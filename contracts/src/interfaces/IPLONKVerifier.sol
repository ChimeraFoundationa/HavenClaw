// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPLONKVerifier
/// @notice Interface for PLONK verifier contracts (6G Capability Proof)
interface IPLONKVerifier {
    /// @notice PLONK proof structure for 6G capability
    struct PlonkProof {
        uint256[2] A;
        uint256[2] B;
        uint256[2] C;
        uint256[2] Z;
        uint256[2] T1;
        uint256[2] T2;
        uint256[2] T3;
        uint256[2] W1;
        uint256[2] W2;
        uint256[2] W3;
    }

    /// @notice Verify a PLONK proof
    /// @param proof The PLONK proof
    /// @param publicInputs The public inputs
    /// @return isValid Whether the proof is valid
    function verifyProof(PlonkProof calldata proof, uint256[] calldata publicInputs) external view returns (bool isValid);

    /// @notice Get number of public inputs
    function NUM_PUBLIC_INPUTS() external view returns (uint256);
}
