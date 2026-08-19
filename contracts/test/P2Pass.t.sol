// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EventPass} from "../src/EventPass.sol";
import {P2PassCore} from "../src/P2PassCore.sol";
import {P2PassReputation, IP2PassCore} from "../src/P2PassReputation.sol";

contract P2PassTest is Test {
    EventPass internal pass;
    P2PassCore internal core;
    P2PassReputation internal reputation;

    address internal organizer = makeAddr("organizer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal scanner = makeAddr("scanner");
    uint256 internal constant CREATION_FEE = 0.0002 ether;
    uint96 internal constant TICKET_PRICE = 0.01 ether;

    function setUp() public {
        pass = new EventPass("ipfs://passes/{id}.json", address(this));
        core = new P2PassCore(pass, CREATION_FEE, address(this));
        pass.grantRole(pass.MINTER_ROLE(), address(core));
        reputation = new P2PassReputation(IP2PassCore(address(core)));
        vm.deal(organizer, 10 ether);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testCreateAndJoinMintsSoulboundPass() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 2);
        _join(eventId, alice, TICKET_PRICE);

        assertEq(pass.balanceOf(alice, eventId), 1);
        assertEq(core.paidAmount(eventId, alice), TICKET_PRICE);
        P2PassCore.EventData memory details = core.getEvent(eventId);
        assertEq(details.registered, 1);
        assertEq(details.escrowed, TICKET_PRICE);

        vm.prank(alice);
        vm.expectRevert(EventPass.TransferDisabled.selector);
        pass.safeTransferFrom(alice, bob, eventId, 1, "");
    }

    function testRejectsDuplicateRegistrationAndCapacityBypass() public {
        uint256 eventId = _createEvent(0, 1);
        _join(eventId, alice, 0);

        vm.prank(alice);
        vm.expectRevert(P2PassCore.AlreadyRegistered.selector);
        core.joinEvent(eventId);

        vm.prank(bob);
        vm.expectRevert(P2PassCore.CapacityReached.selector);
        core.joinEvent(eventId);
    }

    function testRejectsIncorrectPayment() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 0);
        vm.prank(alice);
        vm.expectRevert(P2PassCore.InvalidPayment.selector);
        core.joinEvent{value: TICKET_PRICE - 1}(eventId);
    }

    function testOrganizerCanBuyTheirOwnPass() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 10);
        _join(eventId, organizer, TICKET_PRICE);

        assertEq(pass.balanceOf(organizer, eventId), 1);
        assertEq(core.paidAmount(eventId, organizer), TICKET_PRICE);
        assertEq(core.getJoinedEvents(organizer)[0], eventId);
    }

    function testEventCanBeEditedBeforeStartButPriceLocksAfterRegistration() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 10);
        P2PassCore.EventInput memory update = P2PassCore.EventInput({
            name: "Updated Assembly",
            description: "Updated details",
            location: "Base Istanbul",
            imageURI: "ipfs://updated",
            startTime: uint64(block.timestamp + 2 days),
            endTime: uint64(block.timestamp + 4 days),
            capacity: 20,
            price: 0.02 ether
        });
        vm.prank(organizer);
        core.updateEvent(eventId, update);
        assertEq(core.getEvent(eventId).name, "Updated Assembly");

        _join(eventId, alice, 0.02 ether);
        update.price = 0.03 ether;
        vm.prank(organizer);
        vm.expectRevert(P2PassCore.PriceLocked.selector);
        core.updateEvent(eventId, update);
    }

    function testOrganizerAndAuthorizedScannerCanCheckIn() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        _join(eventId, bob, 0);

        vm.prank(organizer);
        core.setScanner(eventId, scanner, true);
        vm.warp(block.timestamp + 2 days);

        vm.prank(scanner);
        core.checkIn(eventId, alice);
        assertTrue(core.attended(eventId, alice));

        vm.prank(organizer);
        core.checkIn(eventId, bob);
        assertTrue(core.attended(eventId, bob));

        vm.prank(scanner);
        vm.expectRevert(P2PassCore.AlreadyAttended.selector);
        core.checkIn(eventId, alice);
    }

    function testUnauthorizedCheckInFails() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        vm.warp(block.timestamp + 2 days);

        vm.prank(bob);
        vm.expectRevert(P2PassCore.NotScanner.selector);
        core.checkIn(eventId, alice);
    }

    function testRevokedScannerCanNoLongerCheckIn() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        vm.startPrank(organizer);
        core.setScanner(eventId, scanner, true);
        core.setScanner(eventId, scanner, false);
        vm.stopPrank();
        vm.warp(block.timestamp + 2 days);

        vm.prank(scanner);
        vm.expectRevert(P2PassCore.NotScanner.selector);
        core.checkIn(eventId, alice);
    }

    function testCreatedJoinedAndParticipantIndexesStayInSync() public {
        uint256 first = _createEvent(0, 10);
        uint256 second = _createEvent(0, 10);
        _join(first, alice, 0);
        _join(second, alice, 0);

        assertEq(core.getCreatedEvents(organizer).length, 2);
        assertEq(core.getJoinedEvents(alice).length, 2);
        assertEq(core.getParticipants(first)[0], alice);
    }

    function testCheckInOutsideEventWindowFails() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        vm.prank(organizer);
        vm.expectRevert(P2PassCore.EventNotActive.selector);
        core.checkIn(eventId, alice);
    }

    function testUnauthorizedOrganizerActionsFail() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 10);
        _join(eventId, alice, TICKET_PRICE);

        vm.prank(bob);
        vm.expectRevert(P2PassCore.NotOrganizer.selector);
        core.cancelEvent(eventId);

        P2PassCore.EventData memory details = core.getEvent(eventId);
        vm.warp(details.endTime + 1);
        vm.prank(bob);
        vm.expectRevert(P2PassCore.NotOrganizer.selector);
        core.withdrawProceeds(eventId);
    }

    function testCancelledEventRejectsNewParticipation() public {
        uint256 eventId = _createEvent(0, 10);
        vm.prank(organizer);
        core.cancelEvent(eventId);

        vm.prank(alice);
        vm.expectRevert(P2PassCore.EventIsCancelled.selector);
        core.joinEvent(eventId);
    }

    function testOrganizerWithdrawalTakesTwoPercentFee() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 10);
        _join(eventId, alice, TICKET_PRICE);
        _join(eventId, bob, TICKET_PRICE);
        P2PassCore.EventData memory details = core.getEvent(eventId);
        vm.warp(details.endTime + 1);

        uint256 beforeBalance = organizer.balance;
        vm.prank(organizer);
        core.withdrawProceeds(eventId);

        uint256 gross = TICKET_PRICE * 2;
        uint256 fee = (gross * 200) / 10_000;
        assertEq(organizer.balance - beforeBalance, gross - fee);
        assertEq(core.protocolBalance(), CREATION_FEE + fee);

        vm.prank(organizer);
        vm.expectRevert(P2PassCore.AlreadySettled.selector);
        core.withdrawProceeds(eventId);
    }

    function testCancelledEventUsesPullRefundAndPreventsDoubleRefund() public {
        uint256 eventId = _createEvent(TICKET_PRICE, 10);
        _join(eventId, alice, TICKET_PRICE);

        vm.prank(organizer);
        core.cancelEvent(eventId);
        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        core.claimRefund(eventId);
        assertEq(alice.balance - beforeBalance, TICKET_PRICE);

        vm.prank(alice);
        vm.expectRevert(P2PassCore.NothingToClaim.selector);
        core.claimRefund(eventId);
    }

    function testOnlySharedAttendanceUnlocksPeerReviewAndUpdatesAverage() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        _join(eventId, bob, 0);

        vm.prank(alice);
        vm.expectRevert(P2PassReputation.AttendanceRequired.selector);
        reputation.reviewPeer(bob, eventId, 5, "Great collaborator");

        vm.warp(block.timestamp + 2 days);
        vm.startPrank(organizer);
        core.checkIn(eventId, alice);
        core.checkIn(eventId, bob);
        vm.stopPrank();

        vm.prank(alice);
        reputation.reviewPeer(bob, eventId, 5, "Great collaborator");
        assertEq(reputation.peerAverage(bob), 500);
        assertEq(reputation.peerRatingCount(bob), 1);

        vm.prank(alice);
        reputation.reviewPeer(bob, eventId, 3, "Updated after feedback");
        assertEq(reputation.peerAverage(bob), 300);
        assertEq(reputation.peerRatingCount(bob), 1);
    }

    function testAttendeeCanReviewEventAndUpdateRating() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);
        vm.warp(block.timestamp + 2 days);
        vm.prank(organizer);
        core.checkIn(eventId, alice);

        vm.prank(alice);
        reputation.reviewEvent(eventId, 4, "Sharp talks and warm crowd.");
        assertEq(reputation.eventAverage(eventId), 400);

        vm.prank(alice);
        reputation.reviewEvent(eventId, 5, "Actually, exceptional.");
        assertEq(reputation.eventAverage(eventId), 500);
        assertEq(reputation.eventRatingCount(eventId), 1);
    }

    function testRatingBoundsAndAttendanceAreEnforced() public {
        uint256 eventId = _createEvent(0, 10);
        _join(eventId, alice, 0);

        vm.prank(alice);
        vm.expectRevert(P2PassReputation.InvalidRating.selector);
        reputation.reviewEvent(eventId, 0, "invalid");

        vm.prank(alice);
        vm.expectRevert(P2PassReputation.AttendanceRequired.selector);
        reputation.reviewEvent(eventId, 5, "not checked in");
    }

    function testProfileStaysOnChain() public {
        vm.prank(alice);
        reputation.updateProfile("alice", "Alice A.", "Building public goods", "ipfs://avatar", "https://alice.eth");
        P2PassReputation.Profile memory profile = reputation.getProfile(alice);
        assertEq(profile.username, "alice");
        assertEq(profile.displayName, "Alice A.");
    }

    function testProfileFieldLimitsReturnTextTooLong() public {
        string memory oversizedUsername = new string(65);
        vm.prank(alice);
        vm.expectRevert(P2PassReputation.TextTooLong.selector);
        reputation.updateProfile(oversizedUsername, "Alice", "Bio", "", "");
    }

    function _createEvent(uint96 price, uint32 capacity) internal returns (uint256 eventId) {
        P2PassCore.EventInput memory input = P2PassCore.EventInput({
            name: "Onchain Assembly",
            description: "A gathering for builders",
            location: "Istanbul",
            imageURI: "ipfs://event",
            startTime: uint64(block.timestamp + 1 days),
            endTime: uint64(block.timestamp + 3 days),
            capacity: capacity,
            price: price
        });
        vm.prank(organizer);
        eventId = core.createEvent{value: CREATION_FEE}(input);
    }

    function _join(uint256 eventId, address participant, uint256 price) internal {
        vm.prank(participant);
        core.joinEvent{value: price}(eventId);
    }
}
