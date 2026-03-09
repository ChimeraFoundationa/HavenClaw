// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOpenClawRegistry} from "../interfaces/IOpenClawRegistry.sol";
import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OpenClawRegistry
 * @dev Main registry contract for OpenClaw Agents
 */
contract OpenClawRegistry is IOpenClawRegistry, Ownable {
    mapping(address => Agent) private _agents;
    mapping(address => mapping(bytes32 => bool)) private _capabilities;
    mapping(bytes32 => address[]) private _agentsByCapability;

    uint256 private _agentCount;

    IZKVerifier public zkVerifier;
    bool public zkEnabled;

    event ZKVerifierSet(address indexed verifier, bool enabled);
    event CapabilityVerified(address indexed agent, bytes32 capability, bool valid);

    constructor(address initialOwner) Ownable(initialOwner) {
        zkEnabled = false;
    }

    function setZKVerifier(address verifier, bool enabled) external onlyOwner {
        zkVerifier = IZKVerifier(verifier);
        zkEnabled = enabled;
        emit ZKVerifierSet(verifier, enabled);
    }

    function registerAgent(
        address tbaAddress,
        uint256 nftTokenId,
        string calldata metadataUri,
        bytes32[] calldata capabilities
    ) external override {
        require(tbaAddress != address(0), "Invalid TBA address");
        require(!_agents[tbaAddress].active, "Agent already registered");

        _agents[tbaAddress] = Agent({
            tbaAddress: tbaAddress,
            nftTokenId: nftTokenId,
            metadataUri: metadataUri,
            capabilities: capabilities,
            registeredAt: block.timestamp,
            active: true
        });

        for (uint256 i = 0; i < capabilities.length; i++) {
            _capabilities[tbaAddress][capabilities[i]] = true;
            _agentsByCapability[capabilities[i]].push(tbaAddress);
        }

        _agentCount++;
        emit AgentRegistered(tbaAddress, nftTokenId, metadataUri, capabilities);
    }

    function registerAgentWithProof(
        address tbaAddress,
        uint256 nftTokenId,
        string calldata metadataUri,
        bytes32[] calldata capabilities,
        bytes calldata proof
    ) external {
        require(zkEnabled, "ZK verification not enabled");
        require(address(zkVerifier) != address(0), "ZK verifier not set");

        bytes32[] memory publicInputs = new bytes32[](capabilities.length);
        for (uint256 i = 0; i < capabilities.length; i++) {
            publicInputs[i] = capabilities[i];
        }

        bool valid = zkVerifier.verify(proof, publicInputs);
        require(valid, "Invalid ZK proof");

        _agents[tbaAddress] = Agent({
            tbaAddress: tbaAddress,
            nftTokenId: nftTokenId,
            metadataUri: metadataUri,
            capabilities: capabilities,
            registeredAt: block.timestamp,
            active: true
        });

        for (uint256 i = 0; i < capabilities.length; i++) {
            _capabilities[tbaAddress][capabilities[i]] = true;
            _agentsByCapability[capabilities[i]].push(tbaAddress);
        }

        _agentCount++;
        emit AgentRegistered(tbaAddress, nftTokenId, metadataUri, capabilities);
        emit CapabilityVerified(tbaAddress, keccak256(abi.encodePacked("zk_verified")), true);
    }

    function updateAgent(
        address tbaAddress,
        string calldata metadataUri,
        bytes32[] calldata capabilities
    ) external override {
        require(_agents[tbaAddress].active, "Agent not registered");
        require(msg.sender == _agents[tbaAddress].tbaAddress, "Not authorized");

        Agent storage agent = _agents[tbaAddress];

        for (uint256 i = 0; i < agent.capabilities.length; i++) {
            _capabilities[tbaAddress][agent.capabilities[i]] = false;
        }

        agent.capabilities = capabilities;
        agent.metadataUri = metadataUri;

        for (uint256 i = 0; i < capabilities.length; i++) {
            _capabilities[tbaAddress][capabilities[i]] = true;
            _agentsByCapability[capabilities[i]].push(tbaAddress);
        }

        emit AgentUpdated(tbaAddress, metadataUri, capabilities);
    }

    function deactivateAgent(address tbaAddress) external override {
        require(_agents[tbaAddress].active, "Agent not registered");
        require(msg.sender == _agents[tbaAddress].tbaAddress, "Not authorized");

        Agent storage agent = _agents[tbaAddress];
        agent.active = false;
        emit AgentDeactivated(tbaAddress);
    }

    function getAgent(address tbaAddress) external view override returns (Agent memory) {
        return _agents[tbaAddress];
    }

    function isAgent(address tbaAddress) external view override returns (bool) {
        return _agents[tbaAddress].active;
    }

    function getAgentCount() external view override returns (uint256) {
        return _agentCount;
    }

    // Alias for getAgentCount() for compatibility
    function agentCount() external view returns (uint256) {
        return _agentCount;
    }

    function hasCapability(address tbaAddress, bytes32 capability) external view override returns (bool) {
        return _agents[tbaAddress].active && _capabilities[tbaAddress][capability];
    }

    function getAgentsByCapability(bytes32 capability) external view returns (address[] memory) {
        return _agentsByCapability[capability];
    }

    function getCapabilityCount(address tbaAddress) external view returns (uint256) {
        return _agents[tbaAddress].capabilities.length;
    }
}
