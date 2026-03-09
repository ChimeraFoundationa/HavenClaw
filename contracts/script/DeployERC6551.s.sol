// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC6551Registry} from "../src/core/ERC6551.sol";

/**
 * @dev Deploy ERC6551 contracts
 */
contract DeployERC6551 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ERC6551 Registry (includes Account implementation)
        console.log("Deploying ERC6551 Registry...");
        ERC6551Registry registry = new ERC6551Registry();
        console.log("ERC6551Registry deployed at:", address(registry));

        vm.stopBroadcast();

        console.log("\n=== ERC6551 Deployment Complete ===\n");
        console.log("ERC6551Registry:", address(registry));
        console.log("ERC6551Account: Deployed with Registry (same tx)\n");
    }
}
