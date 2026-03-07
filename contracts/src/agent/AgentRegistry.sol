// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../interfaces/IAgentRegistry.sol";

/// @title AgentRegistry - Agent Registration Contract
/// @notice Register and manage AI agents with capabilities
/// @dev Simple registration without NFT complexity
contract AgentRegistry is IAgentRegistry {
    // Storage
    mapping(address => AgentInfo) private _agents;

    /// @notice Register a new agent
    /// @param metadataURI IPFS URI with agent metadata
    /// @param capabilities Array of capability identifiers
    function registerAgent(string calldata metadataURI, bytes32[] calldata capabilities) external {
        address agent = msg.sender;

        // Prevent duplicate registration
        require(!_agents[agent].exists, "Agent already registered");
        require(bytes(metadataURI).length > 0, "Metadata URI required");

        // Store agent info
        _agents[agent] = AgentInfo({
            agentAddress: agent,
            metadataURI: metadataURI,
            capabilities: capabilities,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            exists: true
        });
        
        emit AgentRegistered(agent, metadataURI, capabilities, block.timestamp);
    }
    
    /// @notice Update agent metadata
    /// @param newMetadataURI New metadata URI
    function updateMetadata(string calldata newMetadataURI) external {
        require(_agents[msg.sender].exists, "Agent not registered");
        
        string memory oldURI = _agents[msg.sender].metadataURI;
        _agents[msg.sender].metadataURI = newMetadataURI;
        
        emit AgentMetadataUpdated(msg.sender, oldURI, newMetadataURI, block.timestamp);
    }
    
    /// @notice Update agent capabilities
    /// @param newCapabilities New capabilities array
    function updateCapabilities(bytes32[] calldata newCapabilities) external {
        require(_agents[msg.sender].exists, "Agent not registered");
        
        _agents[msg.sender].capabilities = newCapabilities;
        
        emit AgentCapabilitiesUpdated(msg.sender, newCapabilities, block.timestamp);
    }
    
    /// @notice Get agent information
    /// @param agent Agent address
    /// @return AgentInfo struct
    function getAgent(address agent) external view returns (AgentInfo memory) {
        return _agents[agent];
    }
    
    /// @notice Check if agent is registered
    /// @param agent Agent address
    /// @return True if registered
    function isRegistered(address agent) external view returns (bool) {
        return _agents[agent].exists;
    }
    
    /// @notice Get agent capabilities
    /// @param agent Agent address
    /// @return Array of capability hashes
    function getCapabilities(address agent) external view returns (bytes32[] memory) {
        return _agents[agent].capabilities;
    }
    
    /// @notice Check if agent is GAT verified
    function isVerified(address agent) external view returns (bool) {
        return _agents[agent].verifiedAt > 0;
    }
    
    /// @notice Mark agent as verified (only callable by GAT contract)
    function markVerified(address agent, bytes32) external {
        require(msg.sender == address(0), "Only GAT can verify"); // TODO
        _agents[agent].verifiedAt = block.timestamp;
    }
    
    /// @notice Check if address is valid token-bound account
    function isValidTokenBoundAccount(address) external pure returns (bool) {
        return false; // TODO: Implement TBA check
    }
}
