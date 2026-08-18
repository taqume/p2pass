// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {EventPass} from "../src/EventPass.sol";
import {P2PassCore} from "../src/P2PassCore.sol";
import {P2PassReputation, IP2PassCore} from "../src/P2PassReputation.sol";

contract DeployP2Pass is Script {
    function run() external returns (EventPass pass, P2PassCore core, P2PassReputation reputation) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        uint256 creationFee = vm.envOr("EVENT_CREATION_FEE_WEI", uint256(0.0002 ether));
        string memory passURI = vm.envOr("PASS_METADATA_URI", string("ipfs://bafybeigexample/{id}.json"));

        vm.startBroadcast(deployerKey);
        pass = new EventPass(passURI, deployer);
        core = new P2PassCore(pass, creationFee, deployer);
        pass.grantRole(pass.MINTER_ROLE(), address(core));
        reputation = new P2PassReputation(IP2PassCore(address(core)));
        vm.stopBroadcast();

        console2.log("EventPass:", address(pass));
        console2.log("P2PassCore:", address(core));
        console2.log("P2PassReputation:", address(reputation));
    }
}

