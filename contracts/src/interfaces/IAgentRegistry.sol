// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IAgentRegistry
/// @notice Interface for the Agent Registry contract
interface IAgentRegistry {
    /// @notice Struct representing agent information
    struct AgentInfo {
        address agentAddress; // Token-bound account address
        string metadataURI; // IPFS/Arweave URI for agent metadata
        bytes32[] capabilities; // Capability tags
        uint256 registeredAt; // Registration timestamp
        uint256 verifiedAt; // GAT verification timestamp (0 if not verified)
        bool exists; // Whether agent is registered
    }

    /// @notice Emitted when an agent is registered
    event AgentRegistered(address indexed agentAddress, string metadataURI, bytes32[] capabilities, uint256 timestamp);

    /// @notice Emitted when agent metadata is updated
    event AgentMetadataUpdated(address indexed agentAddress, string oldURI, string newURI, uint256 timestamp);

    /// @notice Emitted when agent capabilities are updated
    event AgentCapabilitiesUpdated(address indexed agentAddress, bytes32[] capabilities, uint256 timestamp);

    /// @notice Emitted when an agent passes GAT verification
    event AgentVerified(address indexed agentAddress, bytes32 proofHash, uint256 timestamp);

    /// @notice Custom errors
    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error InvalidAgentAddress(address agent);
    error NotTokenBoundAccount(address agent);
    error Unauthorized(address caller, address agent);

    /// @notice Register a new agent (only callable by token-bound accounts)
    /// @param metadataURI The metadata URI for the agent
    /// @param capabilities The capability tags for the agent
    function registerAgent(string calldata metadataURI, bytes32[] calldata capabilities) external;

    /// @notice Update agent metadata
    /// @param newMetadataURI The new metadata URI
    function updateMetadata(string calldata newMetadataURI) external;

    /// @notice Update agent capabilities
    /// @param newCapabilities The new capability tags
    function updateCapabilities(bytes32[] calldata newCapabilities) external;

    /// @notice Mark agent as GAT verified
    /// @param agent The agent address
    /// @param proofHash The hash of the verification proof
    function markVerified(address agent, bytes32 proofHash) external;

    /// @notice Get agent information
    /// @param agent The agent address
    /// @return info The agent information struct
    function getAgent(address agent) external view returns (AgentInfo memory info);

    /// @notice Check if an agent is registered
    /// @param agent The agent address
    /// @return exists Whether the agent is registered
    function isRegistered(address agent) external view returns (bool exists);

    /// @notice Check if an agent is GAT verified
    /// @param agent The agent address
    /// @return verified Whether the agent is verified
    function isVerified(address agent) external view returns (bool verified);

    /// @notice Check if an address is a valid token-bound account
    /// @param account The account address to check
    /// @return isValid Whether the account is a valid TBA
    function isValidTokenBoundAccount(address account) external view returns (bool isValid);
}
