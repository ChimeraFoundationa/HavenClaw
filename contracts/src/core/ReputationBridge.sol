// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC8004ReputationRegistry } from "../interfaces/IERC8004.sol";

/// @title ReputationBridge
/// @notice Bridge reputation between ERC-8004 and our HAVEN/AgentReputation system
/// @dev Syncs reputation signals bidirectionally
///
/// How it works:
/// 1. ERC-8004 signals → Our reputation score
/// 2. Our HAVEN earnings → ERC-8004 validation signals
/// 3. GAT verifications → ERC-8004 validation proofs
///
contract ReputationBridge is Ownable {
    // ========================================================================
    // State Variables
    // ========================================================================

    /// @notice ERC-8004 Reputation Registry
    IERC8004ReputationRegistry public immutable ERC8004_REGISTRY;

    /// @notice Our Agent Reputation contract address
    address public agentReputation;

    /// @notice Our HAVEN token address
    address public havenToken;

    /// @notice Mapping from ERC-8004 token ID to synced reputation score
    mapping(uint256 => uint256) public syncedScores;

    /// @notice Minimum score to be considered "verified"
    uint256 public constant MIN_VERIFIED_SCORE = 5000; // 50% (in basis points)

    // ========================================================================
    // Events
    // ========================================================================

    /// @notice Emitted when reputation is synced from ERC-8004
    event ReputationSynced(
        uint256 indexed erc8004TokenId,
        uint256 oldScore,
        uint256 newScore
    );

    /// @notice Emitted when validation proof is posted to ERC-8004
    event ValidationPosted(
        uint256 indexed erc8004TokenId,
        string proofType,
        bytes32 proofHash
    );

    /// @notice Emitted when agent reputation contracts are set
    event AgentContractsSet(address reputation, address haven);

    // ========================================================================
    // Errors
    // ========================================================================

    error InvalidAddress();
    error Unauthorized();

    // ========================================================================
    // Constructor
    // ========================================================================

    /// @param erc8004Reputation ERC-8004 Reputation Registry address
    constructor(address erc8004Reputation) Ownable(msg.sender) {
        require(erc8004Reputation != address(0), "Invalid address");
        ERC8004_REGISTRY = IERC8004ReputationRegistry(erc8004Reputation);
    }

    // ========================================================================
    // External Functions
    // ========================================================================

    /// @notice Set our agent reputation contracts
    /// @param _agentReputation AgentReputation contract address
    /// @param _havenToken HAVEN token address
    function setAgentContracts(address _agentReputation, address _havenToken) external onlyOwner {
        require(_agentReputation != address(0), "Invalid address");
        require(_havenToken != address(0), "Invalid address");

        agentReputation = _agentReputation;
        havenToken = _havenToken;

        emit AgentContractsSet(_agentReputation, _havenToken);
    }

    /// @notice Sync reputation score from ERC-8004
    /// @param erc8004TokenId ERC-8004 token ID
    /// @return newScore Synced reputation score
    function syncReputation(uint256 erc8004TokenId) external returns (uint256 newScore) {
        // Get ERC-8004 reputation score
        newScore = ERC8004_REGISTRY.getReputationScore(erc8004TokenId);

        uint256 oldScore = syncedScores[erc8004TokenId];

        // Update synced score
        syncedScores[erc8004TokenId] = newScore;

        emit ReputationSynced(erc8004TokenId, oldScore, newScore);

        // If score is high enough, post validation to ERC-8004
        if (newScore >= MIN_VERIFIED_SCORE) {
            _postValidationSignal(erc8004TokenId, "REPUTATION_VERIFIED", newScore);
        }
    }

    /// @notice Post GAT verification as validation proof to ERC-8004
    /// @param erc8004TokenId ERC-8004 token ID
    /// @param capabilityHash Hash of verified capability
    /// @param proofHash Hash of PLONK proof
    function postGATVerification(
        uint256 erc8004TokenId,
        bytes32 capabilityHash,
        bytes32 proofHash
    ) external {
        // In production, verify caller is GAT contract
        // if (msg.sender != gatContract) revert Unauthorized();

        // Create metadata URI pointing to proof
        string memory metadataURI = string.concat(
            "ipfs://QmGATProof/",
            _bytes32ToString(proofHash)
        );

        // Post validation signal
        ERC8004_REGISTRY.postSignal(
            erc8004TokenId,
            IERC8004ReputationRegistry.SignalType.VERIFICATION,
            metadataURI
        );

        emit ValidationPosted(erc8004TokenId, "GAT_PLONK", proofHash);
    }

    /// @notice Post HAVEN earning as endorsement to ERC-8004
    /// @param erc8004TokenId ERC-8004 token ID
    /// @param amount Amount of HAVEN earned
    function postHAVENEarning(uint256 erc8004TokenId, uint256 amount) external {
        // In production, verify caller is HAVEN contract
        // if (msg.sender != havenToken) revert Unauthorized();

        // Create metadata URI
        string memory metadataURI = string.concat(
            "ipfs://QmHAVENEarning/",
            _uint256ToString(amount)
        );

        // Post endorsement signal
        ERC8004_REGISTRY.postSignal(
            erc8004TokenId,
            IERC8004ReputationRegistry.SignalType.ENDORSEMENT,
            metadataURI
        );

        emit ValidationPosted(erc8004TokenId, "HAVEN_EARNING", bytes32(amount));
    }

    /// @notice Get combined reputation score
    /// @param erc8004TokenId ERC-8004 token ID
    /// @return erc8004Score Score from ERC-8004
    /// @return ourScore Score from our system
    /// @return combinedScore Weighted average
    function getCombinedReputation(uint256 erc8004TokenId)
        external
        view
        returns (
            uint256 erc8004Score,
            uint256 ourScore,
            uint256 combinedScore
        )
    {
        // Get ERC-8004 score
        erc8004Score = ERC8004_REGISTRY.getReputationScore(erc8004TokenId);

        // Get our score (from AgentReputation contract)
        // ourScore = AgentReputation(agentReputation).getReputation(...);

        // Calculate weighted average (50/50 for now)
        combinedScore = (erc8004Score + ourScore) / 2;
    }

    // ========================================================================
    // Internal Functions
    // ========================================================================

    /// @notice Post validation signal to ERC-8004
    function _postValidationSignal(
        uint256 tokenId,
        string memory proofType,
        uint256 value
    ) internal {
        string memory metadataURI = string.concat(
            "ipfs://QmValidation/",
            proofType,
            "/",
            _uint256ToString(value)
        );

        ERC8004_REGISTRY.postSignal(
            tokenId,
            IERC8004ReputationRegistry.SignalType.VERIFICATION,
            metadataURI
        );
    }

    /// @notice Convert bytes32 to string
    function _bytes32ToString(bytes32 data) internal pure returns (string memory) {
        bytes memory bytesString = new bytes(66);
        bytes memory hexAlphabet = "0123456789abcdef";
        bytesString[0] = "0";
        bytesString[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            bytesString[i * 2 + 2] = hexAlphabet[uint8(data[i] >> 4)];
            bytesString[i * 2 + 3] = hexAlphabet[uint8(data[i] & 0x0f)];
        }
        return string(bytesString);
    }

    /// @notice Convert uint256 to string
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}
