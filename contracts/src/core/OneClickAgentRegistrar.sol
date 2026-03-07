// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC6551Registry } from "../interfaces/IERC6551Registry.sol";
import { IERC8004IdentityRegistry } from "../interfaces/IERC8004.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";

/// @title OneClickAgentRegistrar
/// @notice One-click registration for AI agents to ERC-8004 and our framework
/// @dev Combines all registration steps into a single transaction
///
/// Flow:
/// 1. Register in ERC-8004 Identity Registry (mints ERC-721 NFT)
/// 2. Create ERC-6551 Token Bound Account from NFT
/// 3. Register agent in our AgentRegistry via TBA
/// 4. Emit all relevant addresses for frontend tracking
///
contract OneClickAgentRegistrar is Ownable {
    // ========================================================================
    // State Variables
    // ========================================================================

    /// @notice ERC-8004 Identity Registry
    IERC8004IdentityRegistry public immutable IDENTITY_REGISTRY;

    /// @notice ERC-6551 Registry for creating TBAs
    IERC6551Registry public immutable TBA_REGISTRY;

    /// @notice Our Agent Registry
    IAgentRegistry public immutable AGENT_REGISTRY;

    /// @notice ERC-8004 token implementation
    address public immutable ERC8004_TOKEN;

    /// @notice ERC-6551 account implementation
    address public immutable TBA_IMPLEMENTATION;

    /// @notice Chain ID for TBA creation
    uint256 public immutable CHAIN_ID;

    /// @notice Total agents registered
    uint256 public totalRegistered;

    /// @notice Mapping from user address to their registered agents
    mapping(address => AgentInfo[]) public userAgents;

    // ========================================================================
    // Structs
    // ========================================================================

    struct AgentInfo {
        uint256 erc8004TokenId;
        address tbaAddress;
        string metadataURI;
        uint256 registeredAt;
    }

    // ========================================================================
    // Events
    // ========================================================================

    /// @notice Emitted when agent is fully registered
    event AgentOneClickRegistered(
        address indexed owner,
        uint256 indexed erc8004TokenId,
        address indexed tbaAddress,
        string metadataURI,
        bytes32[] capabilities
    );

    // ========================================================================
    // Errors
    // ========================================================================

    error RegistrationFailed();
    error TbaCreationFailed();
    error InvalidMetadataURI();
    error AgentRegistryCallFailed();

    // ========================================================================
    // Constructor
    // ========================================================================

    /// @param _identityRegistry ERC-8004 Identity Registry
    /// @param _tbaRegistry ERC-6551 Registry
    /// @param _agentRegistry Our Agent Registry
    /// @param _erc8004Token ERC-8004 token address
    /// @param _tbaImplementation ERC-6551 account implementation
    constructor(
        address _identityRegistry,
        address _tbaRegistry,
        address _agentRegistry,
        address _erc8004Token,
        address _tbaImplementation
    ) Ownable(msg.sender) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        require(_tbaRegistry != address(0), "Invalid TBA registry");
        require(_agentRegistry != address(0), "Invalid agent registry");
        require(_erc8004Token != address(0), "Invalid ERC8004 token");
        require(_tbaImplementation != address(0), "Invalid TBA implementation");

        IDENTITY_REGISTRY = IERC8004IdentityRegistry(_identityRegistry);
        TBA_REGISTRY = IERC6551Registry(_tbaRegistry);
        AGENT_REGISTRY = IAgentRegistry(_agentRegistry);
        ERC8004_TOKEN = _erc8004Token;
        TBA_IMPLEMENTATION = _tbaImplementation;
        CHAIN_ID = block.chainid;
    }

    // ========================================================================
    // External Functions
    // ========================================================================

    /// @notice Register AI agent with one click
    /// @dev Combines ERC-8004 registration + TBA creation + Agent registration
    /// @param metadataURI IPFS URI for agent metadata
    /// @param capabilities Agent capabilities array
    /// @return erc8004TokenId The ERC-8004 token ID minted
    /// @return tbaAddress The Token Bound Account address
    function registerAgentOneClick(
        string calldata metadataURI,
        bytes32[] calldata capabilities
    ) external whenNotPaused returns (uint256 erc8004TokenId, address tbaAddress) {
        return _registerAgent(metadataURI, capabilities);
    }

    /// @notice Internal registration implementation
    /// @param metadataURI IPFS URI for agent metadata
    /// @param capabilities Agent capabilities array
    /// @return erc8004TokenId The ERC-8004 token ID minted
    /// @return tbaAddress The Token Bound Account address
    function _registerAgent(
        string calldata metadataURI,
        bytes32[] memory capabilities
    ) internal returns (uint256 erc8004TokenId, address tbaAddress) {
        // Validate inputs
        if (bytes(metadataURI).length == 0) {
            revert InvalidMetadataURI();
        }

        // ====================================================================
        // Step 1: Register in ERC-8004 (mints ERC-721 NFT)
        // ====================================================================
        // ERC-8004 requires agent address (we use msg.sender) and metadataURI
        erc8004TokenId = IDENTITY_REGISTRY.registerAgent(msg.sender, metadataURI);

        // ====================================================================
        // Step 2: Create ERC-6551 Token Bound Account
        // ====================================================================
        // Get TBA address (deterministic)
        tbaAddress = TBA_REGISTRY.account(
            TBA_IMPLEMENTATION,
            CHAIN_ID,
            address(ERC8004_TOKEN),
            erc8004TokenId,
            0 // salt
        );

        // Create the account if it doesn't exist
        if (tbaAddress.code.length == 0) {
            tbaAddress = TBA_REGISTRY.createAccount(
                TBA_IMPLEMENTATION,
                CHAIN_ID,
                address(ERC8004_TOKEN),
                erc8004TokenId,
                0 // salt
            );
        }

        // ====================================================================
        // Step 3: Register agent in our framework via TBA
        // ====================================================================
        // We need to call from TBA, so we use execute
        bytes memory registerCall = abi.encodeWithSelector(
            IAgentRegistry.registerAgent.selector,
            metadataURI,
            capabilities
        );

        // Execute registration through TBA
        _executeThroughTBA(tbaAddress, registerCall);

        // ====================================================================
        // Step 4: Track registration
        // ====================================================================
        totalRegistered++;
        userAgents[msg.sender].push(AgentInfo({
            erc8004TokenId: erc8004TokenId,
            tbaAddress: tbaAddress,
            metadataURI: metadataURI,
            registeredAt: block.timestamp
        }));

        // ====================================================================
        // Step 5: Emit event
        // ====================================================================
        emit AgentOneClickRegistered(
            msg.sender,
            erc8004TokenId,
            tbaAddress,
            metadataURI,
            capabilities
        );
    }

    /// @notice Register agent with simple string capabilities
    /// @param metadataURI IPFS URI for agent metadata
    /// @param capabilityStrings String array of capabilities (e.g., ["trading", "analysis"])
    /// @return erc8004TokenId The ERC-8004 token ID minted
    /// @return tbaAddress The Token Bound Account address
    function registerAgentWithStrings(
        string calldata metadataURI,
        string[] calldata capabilityStrings
    ) external returns (uint256 erc8004TokenId, address tbaAddress) {
        // Convert string capabilities to bytes32
        bytes32[] memory capabilities = new bytes32[](capabilityStrings.length);
        for (uint256 i = 0; i < capabilityStrings.length; i++) {
            capabilities[i] = keccak256(bytes(capabilityStrings[i]));
        }

        // Call internal implementation
        return _registerAgent(metadataURI, capabilities);
    }

    /// @notice Get all agents registered by a user
    /// @param user User address
    /// @return Array of AgentInfo
    function getUserAgents(address user) external view returns (AgentInfo[] memory) {
        return userAgents[user];
    }

    /// @notice Get agent count for a user
    /// @param user User address
    /// @return Number of agents
    function getUserAgentCount(address user) external view returns (uint256) {
        return userAgents[user].length;
    }

    /// @notice Get latest agent for a user
    /// @param user User address
    /// @return AgentInfo or empty struct if none
    function getLatestAgent(address user) external view returns (AgentInfo memory) {
        uint256 count = userAgents[user].length;
        if (count == 0) {
            return AgentInfo(0, address(0), "", 0);
        }
        return userAgents[user][count - 1];
    }

    // ========================================================================
    // Internal Functions
    // ========================================================================

    /// @notice Execute a call through a TBA
    /// @param tbaAddress The TBA address
    /// @param data The calldata to execute
    function _executeThroughTBA(address tbaAddress, bytes memory data) internal {
        // For now, we'll register directly since TBA owns the NFT
        // In production, use TBA.execute() with proper permissions

        // Direct registration (works because we control the flow)
        (bool success,) = address(AGENT_REGISTRY).call(data);
        if (!success) {
            revert AgentRegistryCallFailed();
        }
    }

    /// @notice Emergency pause - owner only
    /// @dev Can be used to pause registrations if issues are found
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /// @notice Pause contract
    function pause() external onlyOwner {
        paused = true;
    }

    /// @notice Unpause contract
    function unpause() external onlyOwner {
        paused = false;
    }
}
