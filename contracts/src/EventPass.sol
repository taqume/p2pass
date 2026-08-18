// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title P2Pass Event Pass
/// @notice One non-transferable ERC-1155 token ID per event.
contract EventPass is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error TransferDisabled();
    error DuplicatePass();

    constructor(string memory baseURI, address admin) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function mint(address account, uint256 eventId) external onlyRole(MINTER_ROLE) {
        if (balanceOf(account, eventId) != 0) revert DuplicatePass();
        _mint(account, eventId, 1, "");
    }

    function setURI(string calldata newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newURI);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0) && to != address(0)) revert TransferDisabled();
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

