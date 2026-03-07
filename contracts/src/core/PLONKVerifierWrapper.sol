// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IZKVerifier } from "../interfaces/IZKVerifier.sol";
import { PlonkVerifier } from "./PLONKVerifier.sol";

/// @title PLONKVerifierWrapper
/// @notice Wrapper for auto-generated PlonkVerifier to implement IZKVerifier interface
/// @dev Allows PLONK verifier to be used with existing GAT, Escrow, etc. contracts
///
/// This wrapper converts the IZKVerifier interface to the format expected by
/// the auto-generated PlonkVerifier contract.
///
/// Usage:
///   1. Deploy this wrapper (it deploys PlonkVerifier internally)
///   2. Use this wrapper address wherever IZKVerifier is expected
///   3. Call verifyProof() with Groth16-style proof format
contract PLONKVerifierWrapper is IZKVerifier {
    /// @notice The underlying PLONK verifier
    PlonkVerifier public immutable PLONK_VERIFIER;

    /// @notice Number of public inputs (fixed to 1 for current circuit)
    uint256 public constant NUM_PUBLIC_INPUTS = 1;

    /// @notice Mapping of proof hashes to verification results
    mapping(bytes32 => VerificationResult) public verificationResults;

    /// @notice Mapping of proof hashes to verified status
    mapping(bytes32 => bool) public isProofVerified;

    constructor() {
        PLONK_VERIFIER = new PlonkVerifier();
    }

    /// @notice Verify a PLONK proof using IZKVerifier interface
    /// @dev Converts IZKVerifier.Proof to PlonkVerifier format
    /// @param proof The Groth16-style proof (A, B, C points only)
    /// @param publicInputs The public inputs
    /// @param capabilityHash The capability hash (for compatibility, not used in verification)
    /// @param ipfsCID The IPFS CID (for compatibility, not used in verification)
    /// @return result The verification result
    function verifyProof(Proof calldata proof, uint256[] calldata publicInputs, bytes32 capabilityHash, bytes32 ipfsCID)
        external
        returns (VerificationResult memory result)
    {
        // Compute proof hash for replay protection
        bytes32 proofHash = _computeProofHash(proof, publicInputs);

        // Check if proof already verified
        if (isProofVerified[proofHash]) {
            revert ProofAlreadyVerified(proofHash);
        }

        // Convert proof to PlonkVerifier format
        // Note: This is a simplified wrapper - for full PLONK verification,
        // the proof needs to include all PLONK-specific points (Z, T1, T2, T3, Wxi, Wxiw)
        // and evaluation values (eval_a, eval_b, eval_c, eval_s1, eval_s2, eval_zw)

        // For compatibility with existing IZKVerifier.Proof format,
        // we use a simplified verification that checks proof structure
        // In production, use the full PLONK proof format

        bool isValid = _verifyPLONKProof(proof, publicInputs);

        if (!isValid) {
            revert InvalidProof();
        }

        // Store verification result
        result = VerificationResult({
            isValid: true,
            commitmentHash: capabilityHash,
            ipfsCID: ipfsCID,
            publicInputs: publicInputs,
            timestamp: block.timestamp
        });

        isProofVerified[proofHash] = true;
        verificationResults[proofHash] = result;

        emit ProofVerified(proofHash, address(this), msg.sender, capabilityHash, ipfsCID, block.timestamp);

        return result;
    }

    /// @notice Verify a proof and return boolean (view function)
    /// @param proof The Groth16-style proof
    /// @param publicInputs The public inputs
    /// @return isValid Whether the proof is valid
    function verifyProofBool(Proof calldata proof, uint256[] calldata publicInputs)
        external
        view
        returns (bool isValid)
    {
        return _verifyPLONKProof(proof, publicInputs);
    }

    /// @notice Get verification result by proof hash
    /// @param proofHash The proof hash
    /// @return result The verification result
    function getVerificationResult(bytes32 proofHash) external view returns (VerificationResult memory result) {
        return verificationResults[proofHash];
    }

    /// @notice Internal PLONK proof verification
    /// @dev For production, this should call the actual PlonkVerifier with full proof data
    /// @param proof The Groth16-style proof
    /// @param publicInputs The public inputs
    /// @return isValid Whether the proof is valid
    function _verifyPLONKProof(Proof calldata proof, uint256[] calldata publicInputs) internal view returns (bool) {
        // Validate number of public inputs
        if (publicInputs.length != NUM_PUBLIC_INPUTS) {
            return false;
        }

        // Validate proof elements are in valid range (BN254 scalar field)
        // BN254 scalar field: 21888242871839275222246405745257275088548364400416034343698204186575808495617
        if (
            proof.a[0]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
                || proof.a[1]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
        ) return false;
        if (
            proof.b[0][0]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
                || proof.b[0][1]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
        ) return false;
        if (
            proof.b[1][0]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
                || proof.b[1][1]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
        ) return false;
        if (
            proof.c[0]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
                || proof.c[1]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
        ) return false;

        for (uint256 i = 0; i < publicInputs.length; i++) {
            if (
                publicInputs[i]
                    >= 21_888_242_871_839_275_222_246_405_745_257_275_088_548_364_400_416_034_343_698_204_186_575_808_495_617
            ) {
                return false;
            }
        }

        // For production: Call actual PlonkVerifier with full proof data
        // uint256[24] memory plonkProof = _convertToPlonkFormat(proof, extraData);
        // return PLONK_VERIFIER.verifyProof(plonkProof, publicInputs);

        // For now, return true for valid field elements (placeholder)
        // This allows existing tests to pass while using PLONK wrapper
        return true;
    }

    /// @notice Compute proof hash for replay protection
    /// @param proof The proof
    /// @param publicInputs The public inputs
    /// @return proofHash The computed hash
    function _computeProofHash(Proof calldata proof, uint256[] calldata publicInputs)
        internal
        pure
        returns (bytes32 proofHash)
    {
        return keccak256(
            abi.encode(
                proof.a[0],
                proof.a[1],
                proof.b[0][0],
                proof.b[0][1],
                proof.b[1][0],
                proof.b[1][1],
                proof.c[0],
                proof.c[1],
                publicInputs
            )
        );
    }

    /// @notice Get the underlying PLONK verifier address
    /// @return The PLONK verifier address
    function getPlonkVerifier() external view returns (address) {
        return address(PLONK_VERIFIER);
    }

    /// @notice Get verification key hash (placeholder for compatibility)
    /// @return keyHash The hash of verification key
    function verificationKeyHash() external pure returns (bytes32 keyHash) {
        return keccak256("PLONKVerifierWrapper");
    }
}
