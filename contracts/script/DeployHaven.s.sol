// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/tokens/HAVEN.sol";
import "../src/agent/AgentRegistry.sol";
import "../src/agent/AgentReputation.sol";
import "../src/tasks/TaskMarketplace.sol";
import "../src/governance/HavenGovernance.sol";

// Core contracts from old implementation (reuse existing)
import "../src/core/ERC6551Registry.sol";
import "../src/core/GAT.sol";
import "../src/core/RequestContract.sol";
import "../src/core/NonCustodialEscrow.sol";
import "../src/core/PLONKVerifierWrapper.sol";
import "../src/core/ERC8004AgentRegistry.sol";
import "../src/core/ReputationBridge.sol";
import "../src/core/OneClickAgentRegistrar.sol";

/// @title DeployHaven - Deploy complete Haven ecosystem
/// @notice Reuses existing ZK contracts, deploys new core contracts
contract DeployHaven is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("========== HAVEN CONTRACT DEPLOYMENT ==========");
        console.log("Network: Fuji Testnet");
        console.log("Deployer:", deployer);
        console.log("");
        
        // 1. Deploy HAVEN Token (1 billion supply)
        HAVEN haven = new HAVEN(1_000_000_000);
        console.log("[OK] HAVEN Token deployed:", address(haven));
        
        // 2. Deploy ERC6551Registry (for TBA)
        ERC6551Registry erc6551Registry = new ERC6551Registry();
        console.log("[OK] ERC6551Registry deployed:", address(erc6551Registry));

        // 3. Deploy Agent Registry
        AgentRegistry agentRegistry = new AgentRegistry();
        console.log("[OK] AgentRegistry deployed:", address(agentRegistry));
        
        // 4. Deploy PLONKVerifierWrapper (ZK) - needed for GAT
        PLONKVerifierWrapper plonkWrapper = new PLONKVerifierWrapper();
        console.log("[OK] PLONKVerifierWrapper deployed:", address(plonkWrapper));
        
        // 5. Deploy GAT (Genuine Agent Test) - with ZK verifier
        GAT gat = new GAT(address(agentRegistry), address(plonkWrapper));
        console.log("[OK] GAT deployed:", address(gat));
        
        // 5. Deploy ERC8004 Agent Registry
        ERC8004AgentRegistry erc8004Registry = new ERC8004AgentRegistry(
            address(agentRegistry),
            address(agentRegistry) // Using same as placeholder
        );
        console.log("[OK] ERC8004AgentRegistry deployed:", address(erc8004Registry));
        
        // 6. Deploy Agent Reputation (needed for ReputationBridge)
        AgentReputation agentReputation = new AgentReputation(address(haven));
        console.log("[OK] AgentReputation deployed:", address(agentReputation));
        
        // 7. Deploy Reputation Bridge (with both addresses)
        ReputationBridge repBridge = new ReputationBridge(address(erc8004Registry));
        // Note: setHavenReputation would be called separately if needed
        console.log("[OK] ReputationBridge deployed:", address(repBridge));
        
        // 8. Deploy OneClick Agent Registrar
        // Get ERC8004 token address from ERC8004AgentRegistry
        address erc8004Token = address(0); // TODO: Get actual ERC8004 token
        address tbaImpl = address(0); // TODO: Get TBA implementation
        OneClickAgentRegistrar oneClick = new OneClickAgentRegistrar(
            address(erc8004Registry),
            address(erc6551Registry),
            address(agentRegistry),
            erc8004Token,
            tbaImpl
        );
        console.log("[OK] OneClickAgentRegistrar deployed:", address(oneClick));
        
        // 9. Deploy Task Marketplace
        TaskMarketplace taskMarketplace = new TaskMarketplace();
        console.log("[OK] TaskMarketplace deployed:", address(taskMarketplace));
        
        // Note: Phase 2 contracts (RequestContract, NonCustodialEscrow) 
        // are deployed separately via DeployHavenPhase2.s.sol to avoid stack depth issues
        
        // 10. Deploy Haven Governance
        HavenGovernance governance = new HavenGovernance(
            haven,
            agentReputation
        );
        console.log("[OK] HavenGovernance deployed:", address(governance));
        
        // Setup permissions
        haven.transferOwnership(address(governance));
        console.log("[OK] HAVEN ownership transferred to governance");
        
        vm.stopBroadcast();
        
        // Output addresses
        console.log("\n========== CONTRACT ADDRESSES ==========");
        console.log("");
        console.log("Core Contracts:");
        console.log("  HAVEN Token:          ", address(haven));
        console.log("  ERC6551Registry:      ", address(erc6551Registry));
        console.log("  AgentRegistry:        ", address(agentRegistry));
        console.log("  GAT:                  ", address(gat));
        console.log("  ERC8004Registry:      ", address(erc8004Registry));
        console.log("  ReputationBridge:     ", address(repBridge));
        console.log("  OneClickRegistrar:    ", address(oneClick));
        console.log("  AgentReputation:      ", address(agentReputation));
        console.log("");
        console.log("Task & Coordination:");
        console.log("  TaskMarketplace:      ", address(taskMarketplace));
        console.log("  RequestContract:      [Phase 2 - run DeployHavenPhase2.s.sol]");
        console.log("  NonCustodialEscrow:   [Phase 2 - run DeployHavenPhase2.s.sol]");
        console.log("");
        console.log("ZK & Governance:");
        console.log("  PLONKVerifierWrapper:", address(plonkWrapper));
        console.log("  HavenGovernance:      ", address(governance));
        console.log("");
        console.log("==========================================");
        console.log("");
        console.log("ZK Setup:");
        console.log("  Circuit files: /zk/circuits/");
        console.log("  Build files:   /zk/build/");
        console.log("  Proofs:        /zk/proofs/");
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Run ZK setup: npm run setup:plonk");
        console.log("  2. Get test AVAX: https://faucet.avax.network/");
        console.log("  3. Register agent: havenclaw agent register");
        console.log("==========================================");
    }
}
