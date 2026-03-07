// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/core/GAT.sol";
import "../src/core/ReputationBridge.sol";
import "../src/core/OneClickAgentRegistrar.sol";
import "../src/core/RequestContract.sol";
import "../src/core/NonCustodialEscrow.sol";
import "../src/core/PLONKVerifierWrapper.sol";
import "../src/core/ERC8004AgentRegistry.sol";
import "../src/agent/AgentRegistry.sol";
import "../src/agent/AgentReputation.sol";
import "../src/tasks/TaskMarketplace.sol";
import "../src/tokens/HAVEN.sol";
import "../src/core/ERC6551Registry.sol";

/// @title DeployHavenPhase2 - Deploy Phase 2 contracts
/// @notice Deploy GAT, Escrow, RequestContract, ReputationBridge, OneClickRegistrar
contract DeployHavenPhase2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get Phase 1 addresses from environment
        address agentRegistryAddr = vm.envAddress("AGENT_REGISTRY");
        address erc6551RegistryAddr = vm.envAddress("ERC6551_REGISTRY");
        address erc8004RegistryAddr = vm.envAddress("ERC8004_REGISTRY");
        address agentReputationAddr = vm.envAddress("AGENT_REPUTATION");
        address havenAddr = vm.envAddress("HAVEN");
        address taskMarketplaceAddr = vm.envAddress("TASK_MARKETPLACE");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("========== HAVEN PHASE 2 DEPLOYMENT ==========");
        console.log("Network: Fuji Testnet");
        console.log("Deployer:", deployer);
        console.log("");
        
        // 1. Deploy PLONKVerifierWrapper (ZK)
        PLONKVerifierWrapper plonkWrapper = new PLONKVerifierWrapper();
        console.log("[OK] PLONKVerifierWrapper deployed:", address(plonkWrapper));
        
        // 2. Deploy GAT
        GAT gat = new GAT(agentRegistryAddr, address(plonkWrapper));
        console.log("[OK] GAT deployed:", address(gat));
        
        // 3. Deploy NonCustodialEscrow
        NonCustodialEscrow escrow = new NonCustodialEscrow(address(plonkWrapper));
        console.log("[OK] NonCustodialEscrow deployed:", address(escrow));
        
        // 4. Deploy RequestContract
        RequestContract requestContract = new RequestContract(agentRegistryAddr, address(escrow));
        console.log("[OK] RequestContract deployed:", address(requestContract));
        
        // 5. Deploy ReputationBridge
        ReputationBridge repBridge = new ReputationBridge(erc8004RegistryAddr);
        console.log("[OK] ReputationBridge deployed:", address(repBridge));
        
        // 6. Deploy OneClickAgentRegistrar
        address erc8004Token = address(0); // TODO: Get actual ERC8004 token
        address tbaImpl = address(0); // TODO: Get TBA implementation
        OneClickAgentRegistrar oneClick = new OneClickAgentRegistrar(
            erc8004RegistryAddr,
            erc6551RegistryAddr,
            agentRegistryAddr,
            erc8004Token,
            tbaImpl
        );
        console.log("[OK] OneClickAgentRegistrar deployed:", address(oneClick));
        
        vm.stopBroadcast();
        
        // Output addresses
        console.log("\n========== PHASE 2 ADDRESSES ==========");
        console.log("");
        console.log("ZK Contracts:");
        console.log("  PLONKVerifierWrapper:", address(plonkWrapper));
        console.log("");
        console.log("Verification & Escrow:");
        console.log("  GAT:                 ", address(gat));
        console.log("  NonCustodialEscrow:  ", address(escrow));
        console.log("  RequestContract:     ", address(requestContract));
        console.log("");
        console.log("Bridges & Registration:");
        console.log("  ReputationBridge:    ", address(repBridge));
        console.log("  OneClickRegistrar:   ", address(oneClick));
        console.log("");
        console.log("==========================================");
        console.log("");
        console.log("Phase 1 Contracts (reference):");
        console.log("  AgentRegistry:       ", agentRegistryAddr);
        console.log("  ERC6551Registry:     ", erc6551RegistryAddr);
        console.log("  ERC8004Registry:     ", erc8004RegistryAddr);
        console.log("  AgentReputation:     ", agentReputationAddr);
        console.log("  HAVEN:               ", havenAddr);
        console.log("  TaskMarketplace:     ", taskMarketplaceAddr);
        console.log("==========================================");
    }
}
