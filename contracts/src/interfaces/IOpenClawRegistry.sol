// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOpenClawRegistry
 * @dev Interface for OpenClaw Agent Registry
 */
interface IOpenClawRegistry {
    struct Agent {
        address tbaAddress;         // Token Bound Account address
        uint256 nftTokenId;         // ERC8004 NFT token ID
        string metadataUri;         // Agent metadata URI
        bytes32[] capabilities;     // Agent capability hashes
        uint256 registeredAt;       // Registration timestamp
        bool active;                // Agent active status
    }

    event AgentRegistered(
        address indexed tbaAddress,
        uint256 indexed nftTokenId,
        string metadataUri,
        bytes32[] capabilities
    );

    event AgentUpdated(
        address indexed tbaAddress,
        string newMetadataUri,
        bytes32[] newCapabilities
    );

    event AgentDeactivated(address indexed tbaAddress);

    function registerAgent(
        address tbaAddress,
        uint256 nftTokenId,
        string calldata metadataUri,
        bytes32[] calldata capabilities
    ) external;

    function updateAgent(
        address tbaAddress,
        string calldata metadataUri,
        bytes32[] calldata capabilities
    ) external;

    function deactivateAgent(address tbaAddress) external;

    function getAgent(address tbaAddress) external view returns (Agent memory);

    function isAgent(address tbaAddress) external view returns (bool);

    function getAgentCount() external view returns (uint256);

    function hasCapability(address tbaAddress, bytes32 capability) external view returns (bool);
}
