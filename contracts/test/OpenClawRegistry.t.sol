// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OpenClawRegistry} from "../src/core/OpenClawRegistry.sol";
import {IOpenClawRegistry} from "../src/interfaces/IOpenClawRegistry.sol";

contract OpenClawRegistryTest is Test {
    OpenClawRegistry public registry;
    address public owner = makeAddr("owner");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    
    uint256 public constant NFT_TOKEN_ID = 1;
    string public METADATA_URI = "ipfs://QmTest123";
    
    event AgentRegistered(
        address indexed tbaAddress,
        uint256 indexed nftTokenId,
        string metadataUri,
        bytes32[] capabilities
    );

    function setUp() public {
        vm.startPrank(owner);
        registry = new OpenClawRegistry(owner);
        vm.stopPrank();
    }

    function test_RegisterAgent() public {
        bytes32[] memory capabilities = new bytes32[](2);
        capabilities[0] = bytes32("trading");
        capabilities[1] = bytes32("analysis");

        vm.expectEmit(true, true, false, true);
        emit AgentRegistered(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        IOpenClawRegistry.Agent memory agent = registry.getAgent(agent1);
        assertEq(agent.tbaAddress, agent1);
        assertEq(agent.nftTokenId, NFT_TOKEN_ID);
        assertEq(agent.metadataUri, METADATA_URI);
        assertEq(agent.active, true);
        assertEq(registry.getAgentCount(), 1);
    }

    function test_RegisterAgent_WithProof() public {
        bytes32[] memory capabilities = new bytes32[](1);
        capabilities[0] = bytes32("trading");

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        assertTrue(registry.isAgent(agent1));
        assertTrue(registry.hasCapability(agent1, bytes32("trading")));
    }

    function test_UpdateAgent() public {
        bytes32[] memory capabilities = new bytes32[](1);
        capabilities[0] = bytes32("trading");

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        string memory newMetadataUri = "ipfs://QmNew456";
        bytes32[] memory newCapabilities = new bytes32[](2);
        newCapabilities[0] = bytes32("trading");
        newCapabilities[1] = bytes32("governance");

        vm.prank(agent1);
        registry.updateAgent(agent1, newMetadataUri, newCapabilities);

        IOpenClawRegistry.Agent memory agent = registry.getAgent(agent1);
        assertEq(agent.metadataUri, newMetadataUri);
        assertEq(registry.getCapabilityCount(agent1), 2);
    }

    function test_DeactivateAgent() public {
        bytes32[] memory capabilities = new bytes32[](1);
        capabilities[0] = bytes32("trading");

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        vm.prank(agent1);
        registry.deactivateAgent(agent1);

        IOpenClawRegistry.Agent memory agent = registry.getAgent(agent1);
        assertEq(agent.active, false);
        assertFalse(registry.isAgent(agent1));
    }

    function test_Revert_InvalidTBA() public {
        bytes32[] memory capabilities = new bytes32[](1);
        capabilities[0] = bytes32("trading");

        vm.expectRevert("Invalid TBA address");
        vm.prank(agent1);
        registry.registerAgent(address(0), NFT_TOKEN_ID, METADATA_URI, capabilities);
    }

    function test_Revert_AlreadyRegistered() public {
        bytes32[] memory capabilities = new bytes32[](1);
        capabilities[0] = bytes32("trading");

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);

        vm.expectRevert("Agent already registered");
        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities);
    }

    function test_SetZKVerifier() public {
        address mockVerifier = makeAddr("mockVerifier");
        
        vm.prank(owner);
        registry.setZKVerifier(mockVerifier, true);

        assertEq(address(registry.zkVerifier()), mockVerifier);
        assertTrue(registry.zkEnabled());
    }

    function test_GetAgentsByCapability() public {
        bytes32[] memory capabilities1 = new bytes32[](1);
        capabilities1[0] = bytes32("trading");

        bytes32[] memory capabilities2 = new bytes32[](1);
        capabilities2[0] = bytes32("trading");

        vm.prank(agent1);
        registry.registerAgent(agent1, NFT_TOKEN_ID, METADATA_URI, capabilities1);

        vm.prank(agent2);
        registry.registerAgent(agent2, NFT_TOKEN_ID + 1, METADATA_URI, capabilities2);

        address[] memory agents = registry.getAgentsByCapability(bytes32("trading"));
        assertEq(agents.length, 2);
    }
}
