// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC8004IdentityRegistry
/// @notice Interface for ERC-8004 Identity Registry
/// @dev ERC-721 based agent identity registration
interface IERC8004IdentityRegistry {
    /// @notice Register a new agent identity
    /// @param agentAddress The agent's on-chain address
    /// @param metadataURI IPFS URI pointing to agent registration file
    /// @return tokenId The ERC-721 token ID representing the agent identity
    function registerAgent(address agentAddress, string calldata metadataURI)
        external
        returns (uint256 tokenId);

    /// @notice Get agent address from token ID
    /// @param tokenId The ERC-721 token ID
    /// @return agentAddress The agent's on-chain address
    function getAgentAddress(uint256 tokenId)
        external
        view
        returns (address agentAddress);

    /// @notice Get token ID from agent address
    /// @param agentAddress The agent's on-chain address
    /// @return tokenId The ERC-721 token ID
    function getTokenId(address agentAddress)
        external
        view
        returns (uint256 tokenId);

    /// @notice Check if agent is registered
    /// @param agentAddress The agent's on-chain address
    /// @return isRegistered Whether the agent is registered
    function isRegistered(address agentAddress) external view returns (bool);

    /// @notice Update agent metadata URI
    /// @param tokenId The ERC-721 token ID
    /// @param newMetadataURI The new IPFS URI
    function updateMetadata(uint256 tokenId, string calldata newMetadataURI)
        external;

    /// @notice Get metadata URI for an agent
    /// @param tokenId The ERC-721 token ID
    /// @return metadataURI The IPFS URI
    function getMetadataURI(uint256 tokenId)
        external
        view
        returns (string memory metadataURI);

    /// @notice Event emitted when agent is registered
    event AgentRegistered(
        address indexed agentAddress,
        uint256 indexed tokenId,
        string metadataURI
    );

    /// @notice Event emitted when metadata is updated
    event MetadataUpdated(
        uint256 indexed tokenId,
        string newMetadataURI
    );
}

/// @title IERC8004ReputationRegistry
/// @notice Interface for ERC-8004 Reputation Registry
/// @dev Standardized feedback and reputation signals
interface IERC8004ReputationRegistry {
    /// @notice Reputation signal types
    enum SignalType {
        ENDORSEMENT,      // Positive endorsement
        VALIDATION,       // Successful validation
        COMPLAINT,        // Negative feedback
        VERIFICATION      // Third-party verification
    }

    /// @notice Reputation signal structure
    struct ReputationSignal {
        uint256 agentTokenId;     // Agent's ERC-721 token ID
        SignalType signalType;    // Type of signal
        address from;             // Who posted the signal
        string metadataURI;       // IPFS URI with details
        uint256 timestamp;        // When signal was posted
        bool active;              // Whether signal is still active
    }

    /// @notice Post a reputation signal for an agent
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @param signalType Type of reputation signal
    /// @param metadataURI IPFS URI with signal details
    function postSignal(
        uint256 agentTokenId,
        SignalType signalType,
        string calldata metadataURI
    ) external;

    /// @notice Get all signals for an agent
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @return signals Array of reputation signals
    function getSignals(uint256 agentTokenId)
        external
        view
        returns (ReputationSignal[] memory signals);

    /// @notice Get signal count for an agent
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @return count Total number of signals
    function getSignalCount(uint256 agentTokenId)
        external
        view
        returns (uint256 count);

    /// @notice Get reputation score for an agent
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @return score Calculated reputation score (0-10000 basis points)
    function getReputationScore(uint256 agentTokenId)
        external
        view
        returns (uint256 score);

    /// @notice Event emitted when signal is posted
    event SignalPosted(
        uint256 indexed agentTokenId,
        SignalType indexed signalType,
        address indexed from,
        string metadataURI,
        uint256 timestamp
    );

    /// @notice Event emitted when signal is deactivated
    event SignalDeactivated(
        uint256 indexed agentTokenId,
        uint256 signalIndex
    );
}

/// @title IERC8004ValidationRegistry
/// @notice Interface for ERC-8004 Validation Registry (WIP)
/// @dev Validation signals and proofs
interface IERC8004ValidationRegistry {
    /// @notice Validation proof structure
    struct ValidationProof {
        uint256 agentTokenId;     // Agent's ERC-721 token ID
        string proofType;         // Type of validation (e.g., "PLONK", "GAT")
        bytes32 proofHash;        // Hash of the proof
        string metadataURI;       // IPFS URI with proof details
        address validator;        // Who validated
        uint256 timestamp;        // When validated
        bool verified;            // Whether proof is verified
    }

    /// @notice Submit a validation proof
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @param proofType Type of validation proof
    /// @param proofHash Hash of the proof data
    /// @param metadataURI IPFS URI with proof details
    function submitProof(
        uint256 agentTokenId,
        string calldata proofType,
        bytes32 proofHash,
        string calldata metadataURI
    ) external;

    /// @notice Verify a submitted proof
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @param proofIndex Index of the proof to verify
    /// @param isValid Whether the proof is valid
    function verifyProof(
        uint256 agentTokenId,
        uint256 proofIndex,
        bool isValid
    ) external;

    /// @notice Get all proofs for an agent
    /// @param agentTokenId The agent's ERC-721 token ID
    /// @return proofs Array of validation proofs
    function getProofs(uint256 agentTokenId)
        external
        view
        returns (ValidationProof[] memory proofs);

    /// @notice Event emitted when proof is submitted
    event ProofSubmitted(
        uint256 indexed agentTokenId,
        string proofType,
        bytes32 proofHash,
        address indexed validator,
        uint256 timestamp
    );

    /// @notice Event emitted when proof is verified
    event ProofVerified(
        uint256 indexed agentTokenId,
        uint256 indexed proofIndex,
        bool isValid
    );
}
