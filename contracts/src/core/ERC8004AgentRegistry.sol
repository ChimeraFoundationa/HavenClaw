// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC8004IdentityRegistry, IERC8004ReputationRegistry } from "../interfaces/IERC8004.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";

/// @title ERC8004AgentRegistry
/// @notice Bridge between ERC-8004 Identity Registry and our Agent Registry
/// @dev Allows agents registered in ERC-8004 to interact with our framework
///
/// Integration Flow:
/// 1. Agent registers in ERC-8004 IdentityRegistry (gets ERC-721 NFT)
/// 2. Agent uses ERC-6551 to create TBA from NFT
/// 3. TBA registers in our AgentRegistry via this bridge
/// 4. Reputation signals flow both ways
///
contract ERC8004AgentRegistry is Ownable {
    // ========================================================================
    // State Variables
    // ========================================================================

    /// @notice ERC-8004 Identity Registry address
    IERC8004IdentityRegistry public immutable IDENTITY_REGISTRY;

    /// @notice Our Agent Registry address
    IAgentRegistry public immutable AGENT_REGISTRY;

    /// @notice ERC-8004 Reputation Registry (optional)
    IERC8004ReputationRegistry public reputationRegistry;

    /// @notice Mapping from ERC-8004 token ID to our agent registration status
    mapping(uint256 => bool) public erc8004TokenRegistered;

    /// @notice Mapping from our agent address to ERC-8004 token ID
    mapping(address => uint256) public agentToERC8004TokenId;

    /// @notice Total agents bridged
    uint256 public bridgedAgentCount;

    // ========================================================================
    // Events
    // ========================================================================

    /// @notice Emitted when agent is bridged from ERC-8004
    event AgentBridged(
        address indexed agentAddress,
        uint256 indexed erc8004TokenId,
        string metadataURI
    );

    /// @notice Emitted when reputation registry is set
    event ReputationRegistrySet(address indexed registry);

    /// @notice Emitted when agent metadata is synced
    event MetadataSynced(
        address indexed agentAddress,
        uint256 indexed erc8004TokenId,
        string metadataURI
    );

    // ========================================================================
    // Errors
    // ========================================================================

    /// @notice Agent not registered in ERC-8004
    error AgentNotRegisteredInERC8004();

    /// @notice Agent already bridged
    error AgentAlreadyBridged();

    /// @notice Invalid agent address
    error InvalidAgentAddress();

    /// @notice TBA validation failed
    error NotTokenBoundAccount();

    // ========================================================================
    // Constructor
    // ========================================================================

    /// @param identityRegistry ERC-8004 Identity Registry address
    /// @param agentRegistry Our Agent Registry address
    constructor(
        address identityRegistry,
        address agentRegistry
    ) Ownable(msg.sender) {
        require(identityRegistry != address(0), "Invalid identity registry");
        require(agentRegistry != address(0), "Invalid agent registry");

        IDENTITY_REGISTRY = IERC8004IdentityRegistry(identityRegistry);
        AGENT_REGISTRY = IAgentRegistry(agentRegistry);
    }

    // ========================================================================
    // External Functions
    // ========================================================================

    /// @notice Set ERC-8004 Reputation Registry
    /// @param _reputationRegistry Reputation Registry address
    function setReputationRegistry(address _reputationRegistry) external onlyOwner {
        reputationRegistry = IERC8004ReputationRegistry(_reputationRegistry);
        emit ReputationRegistrySet(_reputationRegistry);
    }

    /// @notice Bridge agent from ERC-8004 to our framework
    /// @dev Must be called by agent's TBA (ERC-6551)
    /// @param erc8004TokenId ERC-8004 Identity NFT token ID
    /// @param capabilities Agent capabilities
    function bridgeAgent(uint256 erc8004TokenId, bytes32[] calldata capabilities) external {
        // Verify caller is TBA
        if (!_isTokenBoundAccount(msg.sender)) {
            revert NotTokenBoundAccount();
        }

        // Verify agent is registered in ERC-8004
        if (!IDENTITY_REGISTRY.isRegistered(msg.sender)) {
            revert AgentNotRegisteredInERC8004();
        }

        // Verify token ID matches caller
        address agentAddress = IDENTITY_REGISTRY.getAgentAddress(erc8004TokenId);
        if (agentAddress != msg.sender) {
            revert AgentNotRegisteredInERC8004();
        }

        // Check if already bridged
        if (erc8004TokenRegistered[erc8004TokenId]) {
            revert AgentAlreadyBridged();
        }

        // Get metadata URI from ERC-8004
        string memory metadataURI = IDENTITY_REGISTRY.getMetadataURI(erc8004TokenId);

        // Register in our AgentRegistry
        AGENT_REGISTRY.registerAgent(metadataURI, capabilities);

        // Track bridging
        erc8004TokenRegistered[erc8004TokenId] = true;
        agentToERC8004TokenId[msg.sender] = erc8004TokenId;
        bridgedAgentCount++;

        emit AgentBridged(msg.sender, erc8004TokenId, metadataURI);
    }

    /// @notice Sync metadata from ERC-8004 to our registry
    /// @param agentAddress Agent address to sync
    function syncMetadata(address agentAddress) external {
        uint256 tokenId = agentToERC8004TokenId[agentAddress];
        require(tokenId > 0, "Agent not bridged");

        string memory newMetadataURI = IDENTITY_REGISTRY.getMetadataURI(tokenId);
        AGENT_REGISTRY.updateMetadata(newMetadataURI);

        emit MetadataSynced(agentAddress, tokenId, newMetadataURI);
    }

    /// @notice Post reputation signal to ERC-8004
    /// @param agentAddress Agent to signal about
    /// @param signalType Type of signal
    /// @param metadataURI IPFS URI with signal details
    function postReputationSignal(
        address agentAddress,
        uint8 signalType,
        string calldata metadataURI
    ) external {
        require(address(reputationRegistry) != address(0), "Reputation registry not set");

        uint256 tokenId = agentToERC8004TokenId[agentAddress];
        require(tokenId > 0, "Agent not bridged");

        reputationRegistry.postSignal(tokenId, IERC8004ReputationRegistry.SignalType(signalType), metadataURI);
    }

    /// @notice Get agent info including ERC-8004 data
    /// @param agentAddress Agent address
    /// @return erc8004TokenId ERC-8004 token ID (0 if not bridged)
    /// @return isBridged Whether agent is bridged
    /// @return metadataURI Agent metadata URI
    /// @return reputationScore ERC-8004 reputation score
    function getAgentInfo(address agentAddress)
        external
        view
        returns (
            uint256 erc8004TokenId,
            bool isBridged,
            string memory metadataURI,
            uint256 reputationScore
        )
    {
        erc8004TokenId = agentToERC8004TokenId[agentAddress];
        isBridged = erc8004TokenRegistered[erc8004TokenId];

        if (isBridged) {
            metadataURI = IDENTITY_REGISTRY.getMetadataURI(erc8004TokenId);

            if (address(reputationRegistry) != address(0)) {
                reputationScore = reputationRegistry.getReputationScore(erc8004TokenId);
            }
        }
    }

    /// @notice Check if address is a Token Bound Account
    /// @param account Address to check
    /// @return bool Whether address is a TBA
    function _isTokenBoundAccount(address account) internal view returns (bool) {
        // Simple check: TBAs have code and implement ERC-6551 interface
        // In production, verify ERC-6551 interface ID: 0x6faff5f1
        return account.code.length > 0;
    }
}
