// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EventPass} from "./EventPass.sol";

/// @title P2Pass Core
/// @notice Event registry, native ETH escrow, registration and attendance authority.
contract P2PassCore is Ownable, ReentrancyGuard {
    uint256 public constant PROTOCOL_FEE_BPS = 200;
    uint256 private constant BPS = 10_000;

    struct EventData {
        address organizer;
        string name;
        string description;
        string location;
        string imageURI;
        uint64 startTime;
        uint64 endTime;
        uint32 capacity;
        uint32 registered;
        uint96 price;
        uint256 escrowed;
        bool cancelled;
        bool settled;
    }

    struct EventInput {
        string name;
        string description;
        string location;
        string imageURI;
        uint64 startTime;
        uint64 endTime;
        uint32 capacity;
        uint96 price;
    }

    EventPass public immutable eventPass;
    uint256 public eventCount;
    uint256 public creationFee;
    uint256 public protocolBalance;

    mapping(uint256 => EventData) private _events;
    mapping(uint256 => mapping(address => bool)) public attended;
    mapping(uint256 => mapping(address => bool)) public authorizedScanners;
    mapping(uint256 => mapping(address => uint256)) public paidAmount;
    mapping(uint256 => address[]) private _participants;
    mapping(address => uint256[]) private _createdEvents;
    mapping(address => uint256[]) private _joinedEvents;

    error EventNotFound();
    error NotOrganizer();
    error NotScanner();
    error InvalidSchedule();
    error InvalidPayment();
    error EventStarted();
    error EventNotActive();
    error EventNotEnded();
    error EventIsCancelled();
    error EventIsNotCancelled();
    error CapacityReached();
    error InvalidCapacity();
    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyAttended();
    error AlreadySettled();
    error NothingToClaim();
    error TransferFailed();
    error PriceLocked();

    event EventCreated(uint256 indexed eventId, address indexed organizer, string name, uint96 price);
    event EventUpdated(uint256 indexed eventId);
    event EventCancelled(uint256 indexed eventId);
    event PassClaimed(uint256 indexed eventId, address indexed participant, uint256 amount);
    event AttendanceVerified(uint256 indexed eventId, address indexed participant, address indexed scanner);
    event ScannerUpdated(uint256 indexed eventId, address indexed scanner, bool authorized);
    event RefundClaimed(uint256 indexed eventId, address indexed participant, uint256 amount);
    event OrganizerWithdrawal(uint256 indexed eventId, address indexed organizer, uint256 proceeds, uint256 fee);
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event ProtocolFeesWithdrawn(address indexed recipient, uint256 amount);

    constructor(EventPass pass_, uint256 creationFee_, address owner_) Ownable(owner_) {
        eventPass = pass_;
        creationFee = creationFee_;
    }

    modifier eventExists(uint256 eventId) {
        if (eventId == 0 || eventId > eventCount) revert EventNotFound();
        _;
    }

    modifier onlyOrganizer(uint256 eventId) {
        if (_events[eventId].organizer != msg.sender) revert NotOrganizer();
        _;
    }

    function createEvent(EventInput calldata input) external payable returns (uint256 eventId) {
        if (msg.value != creationFee) revert InvalidPayment();
        if (input.startTime <= block.timestamp || input.endTime <= input.startTime) revert InvalidSchedule();
        if (bytes(input.name).length == 0) revert InvalidSchedule();

        eventId = ++eventCount;
        EventData storage nextEvent = _events[eventId];
        nextEvent.organizer = msg.sender;
        nextEvent.name = input.name;
        nextEvent.description = input.description;
        nextEvent.location = input.location;
        nextEvent.imageURI = input.imageURI;
        nextEvent.startTime = input.startTime;
        nextEvent.endTime = input.endTime;
        nextEvent.capacity = input.capacity;
        nextEvent.price = input.price;

        _createdEvents[msg.sender].push(eventId);
        protocolBalance += msg.value;
        emit EventCreated(eventId, msg.sender, input.name, input.price);
    }

    function updateEvent(uint256 eventId, EventInput calldata input)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        EventData storage current = _events[eventId];
        if (current.cancelled) revert EventIsCancelled();
        if (block.timestamp >= current.startTime) revert EventStarted();
        if (input.startTime <= block.timestamp || input.endTime <= input.startTime) revert InvalidSchedule();
        if (input.capacity != 0 && input.capacity < current.registered) revert InvalidCapacity();
        if (input.price != current.price && current.registered != 0) revert PriceLocked();
        if (bytes(input.name).length == 0) revert InvalidSchedule();

        current.name = input.name;
        current.description = input.description;
        current.location = input.location;
        current.imageURI = input.imageURI;
        current.startTime = input.startTime;
        current.endTime = input.endTime;
        current.capacity = input.capacity;
        current.price = input.price;
        emit EventUpdated(eventId);
    }

    function cancelEvent(uint256 eventId) external eventExists(eventId) onlyOrganizer(eventId) {
        EventData storage current = _events[eventId];
        if (current.cancelled) revert EventIsCancelled();
        if (current.settled) revert AlreadySettled();
        current.cancelled = true;
        emit EventCancelled(eventId);
    }

    function joinEvent(uint256 eventId) external payable nonReentrant eventExists(eventId) {
        EventData storage current = _events[eventId];
        if (current.cancelled) revert EventIsCancelled();
        if (block.timestamp >= current.startTime) revert EventStarted();
        if (eventPass.balanceOf(msg.sender, eventId) != 0) revert AlreadyRegistered();
        if (current.capacity != 0 && current.registered >= current.capacity) revert CapacityReached();
        if (msg.value != current.price) revert InvalidPayment();

        current.registered += 1;
        current.escrowed += msg.value;
        paidAmount[eventId][msg.sender] = msg.value;
        _participants[eventId].push(msg.sender);
        _joinedEvents[msg.sender].push(eventId);
        eventPass.mint(msg.sender, eventId);
        emit PassClaimed(eventId, msg.sender, msg.value);
    }

    function setScanner(uint256 eventId, address scanner, bool authorized)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
    {
        authorizedScanners[eventId][scanner] = authorized;
        emit ScannerUpdated(eventId, scanner, authorized);
    }

    function checkIn(uint256 eventId, address participant) external eventExists(eventId) {
        EventData storage current = _events[eventId];
        if (msg.sender != current.organizer && !authorizedScanners[eventId][msg.sender]) revert NotScanner();
        if (current.cancelled) revert EventIsCancelled();
        if (block.timestamp < current.startTime || block.timestamp > current.endTime) revert EventNotActive();
        if (eventPass.balanceOf(participant, eventId) == 0) revert NotRegistered();
        if (attended[eventId][participant]) revert AlreadyAttended();
        attended[eventId][participant] = true;
        emit AttendanceVerified(eventId, participant, msg.sender);
    }

    function withdrawProceeds(uint256 eventId) external nonReentrant eventExists(eventId) onlyOrganizer(eventId) {
        EventData storage current = _events[eventId];
        if (current.cancelled) revert EventIsCancelled();
        if (block.timestamp <= current.endTime) revert EventNotEnded();
        if (current.settled) revert AlreadySettled();

        current.settled = true;
        uint256 gross = current.escrowed;
        current.escrowed = 0;
        uint256 fee = (gross * PROTOCOL_FEE_BPS) / BPS;
        uint256 proceeds = gross - fee;
        protocolBalance += fee;

        (bool ok,) = payable(current.organizer).call{value: proceeds}("");
        if (!ok) revert TransferFailed();
        emit OrganizerWithdrawal(eventId, current.organizer, proceeds, fee);
    }

    function claimRefund(uint256 eventId) external nonReentrant eventExists(eventId) {
        EventData storage current = _events[eventId];
        if (!current.cancelled) revert EventIsNotCancelled();
        uint256 amount = paidAmount[eventId][msg.sender];
        if (amount == 0) revert NothingToClaim();

        paidAmount[eventId][msg.sender] = 0;
        current.escrowed -= amount;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit RefundClaimed(eventId, msg.sender, amount);
    }

    function setCreationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;
        emit CreationFeeUpdated(oldFee, newFee);
    }

    function withdrawProtocolFees(address payable recipient) external onlyOwner nonReentrant {
        uint256 amount = protocolBalance;
        if (amount == 0) revert NothingToClaim();
        protocolBalance = 0;
        (bool ok,) = recipient.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit ProtocolFeesWithdrawn(recipient, amount);
    }

    function getEvent(uint256 eventId) external view eventExists(eventId) returns (EventData memory) {
        return _events[eventId];
    }

    function getParticipants(uint256 eventId) external view eventExists(eventId) returns (address[] memory) {
        return _participants[eventId];
    }

    function getCreatedEvents(address account) external view returns (uint256[] memory) {
        return _createdEvents[account];
    }

    function getJoinedEvents(address account) external view returns (uint256[] memory) {
        return _joinedEvents[account];
    }

    function isAttended(uint256 eventId, address account) external view returns (bool) {
        return attended[eventId][account];
    }

    function hasPass(uint256 eventId, address account) external view returns (bool) {
        return eventPass.balanceOf(account, eventId) != 0;
    }
}

