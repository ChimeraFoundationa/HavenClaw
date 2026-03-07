// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IZKVerifier
/// @notice Interface for Groth16 ZK Proof Verifier
interface IZKVerifier {
    /// @notice Groth16 proof structure
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    /// @notice Verification result structure
    struct VerificationResult {
        bool isValid;
        bytes32 commitmentHash;
        bytes32 ipfsCID;
        uint256[] publicInputs;
        uint256 timestamp;
    }

    /// @notice Emitted when a proof is verified
    event ProofVerified(
        bytes32 indexed proofHash,
        address indexed verifier,
        address indexed submitter,
        bytes32 commitmentHash,
        bytes32 ipfsCID,
        uint256 timestamp
    );

    /// @notice Emitted when verification key is updated
    event VerificationKeyUpdated(bytes32 indexed keyHash, uint256 timestamp);

    /// @notice Custom errors
    error InvalidProof();
    error ProofAlreadyVerified(bytes32 proofHash);
    error InvalidPublicInputs();
    error CommitmentMismatch();

    /// @notice Verify a Groth16 proof
    /// @param proof The Groth16 proof
    /// @param publicInputs The public inputs to the circuit
    /// @param commitmentHash The hash of the commitment
    /// @param ipfsCID The IPFS CID hash (as bytes32)
    /// @return result The verification result
    function verifyProof(Proof calldata proof, uint256[] calldata publicInputs, bytes32 commitmentHash, bytes32 ipfsCID)
        external
        returns (VerificationResult memory result);

    /// @notice Verify a proof and return boolean
    /// @param proof The Groth16 proof
    /// @param publicInputs The public inputs to the circuit
    /// @return isValid Whether the proof is valid
    function verifyProofBool(Proof calldata proof, uint256[] calldata publicInputs) external view returns (bool isValid);

    /// @notice Get the verification key hash
    /// @return keyHash The hash of the verification key
    function verificationKeyHash() external view returns (bytes32 keyHash);

    /// @notice Check if a proof hash has been verified
    /// @param proofHash The hash of the proof
    /// @return isVerified Whether the proof has been verified
    function isProofVerified(bytes32 proofHash) external view returns (bool isVerified);

    /// @notice Get verification result for a proof hash
    /// @param proofHash The hash of the proof
    /// @return result The verification result
    function getVerificationResult(bytes32 proofHash) external view returns (VerificationResult memory result);
}
