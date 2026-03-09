// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OpenClawRegistry} from "../src/core/OpenClawRegistry.sol";
import {OpenClawTaskMarketplace} from "../src/core/OpenClawTaskMarketplace.sol";
import {OpenClawGovernance} from "../src/core/OpenClawGovernance.sol";
import {OpenClawReputation} from "../src/core/OpenClawReputation.sol";

/**
 * @dev Deploy OpenClaw Protocol contracts
 *
 * Usage:
 * forge script script/DeployOpenClaw.s.sol:DeployOpenClaw \
 *   --rpc-url $RPC_URL \
 *   --broadcast \
 *   --verify \
 *   --etherscan-api-key $ETHERSCAN_API_KEY
 *
 * Fuji Testnet Parameters:
 * - VOTING_DELAY: 7200 blocks (~1 day at 12 sec/block)
 * - VOTING_PERIOD: 50400 blocks (~7 days)
 */
contract DeployOpenClaw is Script {
    // Deployment parameters (in blocks for Fuji testnet)
    // 1 block ≈ 12 seconds
    uint256 public constant VOTING_DELAY = 7200;        // ~1 day
    uint256 public constant VOTING_PERIOD = 50400;      // ~7 days
    uint256 public constant EXECUTION_DELAY = 14400;    // ~2 days
    uint256 public constant QUORUM_PERCENTAGE = 4;      // 4% (matches HAVEN Protocol)

    uint256 public constant MIN_STAKE = 1000 * 1e18;    // 1000 tokens
    uint256 public constant MAX_STAKE = 1000000 * 1e18; // 1M tokens

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        // Use HAVEN token address from env or zero address for testing
        address stakingToken = vm.envOr("STAKING_TOKEN_ADDRESS", address(0));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Registry
        console.log("Deploying OpenClawRegistry...");
        OpenClawRegistry registry = new OpenClawRegistry(msg.sender);
        console.log("OpenClawRegistry deployed at:", address(registry));

        // Deploy Reputation
        console.log("Deploying OpenClawReputation...");
        OpenClawReputation reputation = new OpenClawReputation(
            msg.sender,
            stakingToken,
            MIN_STAKE,
            MAX_STAKE
        );
        console.log("OpenClawReputation deployed at:", address(reputation));

        // Deploy Governance
        console.log("Deploying OpenClawGovernance...");
        OpenClawGovernance governance = new OpenClawGovernance(
            msg.sender,
            VOTING_DELAY,
            VOTING_PERIOD,
            EXECUTION_DELAY,
            QUORUM_PERCENTAGE
        );
        console.log("OpenClawGovernance deployed at:", address(governance));

        // Deploy Task Marketplace
        console.log("Deploying OpenClawTaskMarketplace...");
        OpenClawTaskMarketplace marketplace = new OpenClawTaskMarketplace(msg.sender);
        console.log("OpenClawTaskMarketplace deployed at:", address(marketplace));

        // Configure contracts
        console.log("Configuring contracts...");
        
        // Set reputation contract in governance
        governance.setReputationContract(address(reputation));
        
        // Set registry in marketplace
        marketplace.setRegistry(address(registry));

        // Authorize marketplace and governance as reputation updaters
        reputation.setUpdater(address(marketplace), true);
        reputation.setUpdater(address(governance), true);

        vm.stopBroadcast();

        // Output deployment info
        console.log("\n=== HavenClaw Protocol Deployment Complete ===\n");
        console.log("HavenClawRegistry:", address(registry));
        console.log("HavenClawReputation:", address(reputation));
        console.log("HavenClawGovernance:", address(governance));
        console.log("HavenClawTaskMarketplace:", address(marketplace));
        console.log("\nStaking Token:", stakingToken);
        console.log("Deployer:", msg.sender);
        console.log("\n=== Save these addresses to .env ===");
    }
}
