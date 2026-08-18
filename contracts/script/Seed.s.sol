// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {P2PassCore} from "../src/P2PassCore.sol";

/// @notice Optional Base Sepolia starter events for the public discovery experience.
contract SeedP2Pass is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        P2PassCore core = P2PassCore(vm.envAddress("CORE_CONTRACT_ADDRESS"));
        uint256 fee = core.creationFee();

        vm.startBroadcast(deployerKey);
        _create(core, fee, "Protocol After Hours", "An intimate night for builders shipping the next public internet. Short demos, open protocol conversations, and shared on-chain history.", "Salt Galata - Istanbul", 1787934600, 1787947200, 100, 0.003 ether);
        _create(core, fee, "Base Makers Assembly", "Live prototypes, hard-won lessons, and zero pitch decks. Bring one thing you made and one question worth discussing.", "Impact Hub - Berlin", 1788451200, 1788463800, 80, 0);
        _create(core, fee, "Proof of Presence Walk", "A city walk mapped through stories, people, and cryptographic proof, ending with a shared meal.", "Karakoy Pier - Istanbul", 1789369200, 1789383600, 32, 0);
        _create(core, fee, "Commons Table #08", "Dinner for people building community infrastructure: one long table, twelve provocations, and a record of who showed up.", "Cihangir - Istanbul", 1790096400, 1790109000, 24, 0.0015 ether);
        vm.stopBroadcast();

        console2.log("Seeded through event ID:", core.eventCount());
    }

    function _create(
        P2PassCore core,
        uint256 fee,
        string memory name,
        string memory description,
        string memory location,
        uint64 startTime,
        uint64 endTime,
        uint32 capacity,
        uint96 price
    ) private {
        core.createEvent{value: fee}(P2PassCore.EventInput({
            name: name,
            description: description,
            location: location,
            imageURI: "",
            startTime: startTime,
            endTime: endTime,
            capacity: capacity,
            price: price
        }));
    }
}
