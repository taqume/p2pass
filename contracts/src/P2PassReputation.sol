// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IP2PassCore {
    function eventCount() external view returns (uint256);
    function isAttended(uint256 eventId, address account) external view returns (bool);
}

/// @title P2Pass Reputation
/// @notice On-chain wallet profiles plus peer and event reviews gated by attendance.
contract P2PassReputation {
    uint256 public constant MAX_COMMENT_BYTES = 500;
    uint256 public constant MAX_BIO_BYTES = 500;

    struct Profile {
        string username;
        string displayName;
        string bio;
        string avatarURI;
        string link;
        uint64 updatedAt;
    }

    struct Review {
        uint256 proofEventId;
        uint8 rating;
        string comment;
        uint64 updatedAt;
    }

    IP2PassCore public immutable core;
    mapping(address => Profile) private _profiles;
    mapping(address => mapping(address => Review)) private _peerReviews;
    mapping(address => address[]) private _reviewersByTarget;
    mapping(address => uint256) public peerRatingSum;
    mapping(address => uint256) public peerRatingCount;
    mapping(uint256 => mapping(address => Review)) private _eventReviews;
    mapping(uint256 => address[]) private _eventReviewers;
    mapping(uint256 => uint256) public eventRatingSum;
    mapping(uint256 => uint256) public eventRatingCount;

    error InvalidRating();
    error InvalidTarget();
    error AttendanceRequired();
    error EventNotFound();
    error TextTooLong();

    event ProfileUpdated(address indexed account, string username, string displayName);
    event PeerReviewed(address indexed reviewer, address indexed target, uint256 indexed proofEventId, uint8 rating);
    event EventReviewed(uint256 indexed eventId, address indexed reviewer, uint8 rating);

    constructor(IP2PassCore core_) {
        core = core_;
    }

    function updateProfile(
        string calldata username,
        string calldata displayName,
        string calldata bio,
        string calldata avatarURI,
        string calldata link
    ) external {
        if (bytes(username).length > 64 || bytes(displayName).length > 96 || bytes(bio).length > MAX_BIO_BYTES) {
            revert TextTooLong();
        }
        if (bytes(avatarURI).length > 256 || bytes(link).length > 256) revert TextTooLong();
        _profiles[msg.sender] = Profile(username, displayName, bio, avatarURI, link, uint64(block.timestamp));
        emit ProfileUpdated(msg.sender, username, displayName);
    }

    function reviewPeer(address target, uint256 proofEventId, uint8 rating, string calldata comment) external {
        if (target == address(0) || target == msg.sender) revert InvalidTarget();
        _validateReview(rating, comment);
        if (!core.isAttended(proofEventId, msg.sender) || !core.isAttended(proofEventId, target)) {
            revert AttendanceRequired();
        }

        Review storage current = _peerReviews[msg.sender][target];
        if (current.rating == 0) {
            _reviewersByTarget[target].push(msg.sender);
            peerRatingCount[target] += 1;
        } else {
            peerRatingSum[target] -= current.rating;
        }
        peerRatingSum[target] += rating;
        current.proofEventId = proofEventId;
        current.rating = rating;
        current.comment = comment;
        current.updatedAt = uint64(block.timestamp);
        emit PeerReviewed(msg.sender, target, proofEventId, rating);
    }

    function reviewEvent(uint256 eventId, uint8 rating, string calldata comment) external {
        if (eventId == 0 || eventId > core.eventCount()) revert EventNotFound();
        _validateReview(rating, comment);
        if (!core.isAttended(eventId, msg.sender)) revert AttendanceRequired();

        Review storage current = _eventReviews[eventId][msg.sender];
        if (current.rating == 0) {
            _eventReviewers[eventId].push(msg.sender);
            eventRatingCount[eventId] += 1;
        } else {
            eventRatingSum[eventId] -= current.rating;
        }
        eventRatingSum[eventId] += rating;
        current.proofEventId = eventId;
        current.rating = rating;
        current.comment = comment;
        current.updatedAt = uint64(block.timestamp);
        emit EventReviewed(eventId, msg.sender, rating);
    }

    function getProfile(address account) external view returns (Profile memory) {
        return _profiles[account];
    }

    function getPeerReview(address reviewer, address target) external view returns (Review memory) {
        return _peerReviews[reviewer][target];
    }

    function getPeerReviews(address target) external view returns (address[] memory reviewers, Review[] memory reviews) {
        reviewers = _reviewersByTarget[target];
        reviews = new Review[](reviewers.length);
        for (uint256 i; i < reviewers.length; ++i) reviews[i] = _peerReviews[reviewers[i]][target];
    }

    function getEventReview(uint256 eventId, address reviewer) external view returns (Review memory) {
        return _eventReviews[eventId][reviewer];
    }

    function getEventReviews(uint256 eventId) external view returns (address[] memory reviewers, Review[] memory reviews) {
        reviewers = _eventReviewers[eventId];
        reviews = new Review[](reviewers.length);
        for (uint256 i; i < reviewers.length; ++i) reviews[i] = _eventReviews[eventId][reviewers[i]];
    }

    function peerAverage(address target) external view returns (uint256 averageX100) {
        uint256 count = peerRatingCount[target];
        return count == 0 ? 0 : (peerRatingSum[target] * 100) / count;
    }

    function eventAverage(uint256 eventId) external view returns (uint256 averageX100) {
        uint256 count = eventRatingCount[eventId];
        return count == 0 ? 0 : (eventRatingSum[eventId] * 100) / count;
    }

    function _validateReview(uint8 rating, string calldata comment) private pure {
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (bytes(comment).length > MAX_COMMENT_BYTES) revert TextTooLong();
    }
}

