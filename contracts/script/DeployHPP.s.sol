// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {HavenClawPaymentProtocol} from "../src/hpp/HavenClawPaymentProtocol.sol";

/**
 * @dev Deploy HavenClaw Payment Protocol (HPP)
 * 
 * Usage:
 * forge script script/DeployHPP.s.sol:DeployHPP \
 *   --rpc-url $RPC_URL \
 *   --private-key $DEPLOYER_PRIVATE_KEY \
 *   --broadcast \
 *   --verify \
 *   --etherscan-api-key $SNOWTRACE_API_KEY
 */
contract DeployHPP is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying HavenClaw Payment Protocol (HPP)...");
        
        // Deploy HPP with deployer as platform wallet
        HavenClawPaymentProtocol hpp = new HavenClawPaymentProtocol(msg.sender);
        
        console.log("HPP deployed at:", address(hpp));

        vm.stopBroadcast();

        console.log("\n=== HavenClaw Payment Protocol Deployment Complete ===\n");
        console.log("HPP Contract:", address(hpp));
        console.log("Platform Wallet:", msg.sender);
        console.log("Platform Fee: 1% (100 bps)");
        console.log("\n=== Save this address to .env ===");
    }
}
