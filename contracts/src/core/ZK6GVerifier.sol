// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IPLONKVerifier } from "../interfaces/IPLONKVerifier.sol";
import { PlonkVerifier } from "./PLONKVerifier.sol";

/// @title ZK6GVerifier
/// @notice Wrapper for PLONK verifier with 6G capability proof interface
/// @dev Integrates auto-generated PlonkVerifier with IZKVerifier interface
contract ZK6GVerifier is IPLONKVerifier {
    PlonkVerifier public immutable VERIFIER;

    /// @notice Number of public inputs for 6G capability proof
    uint256 public constant NUM_PUBLIC_INPUTS = 6;

    constructor() {
        VERIFIER = new PlonkVerifier();
    }

    /// @notice Verify a PLONK proof for 6G capability
    /// @param proof The PLONK proof
    /// @param publicInputs The public inputs [agentId, capabilityHash, avgAccuracy, timestamp, reserved1, reserved2]
    /// @return isValid Whether the proof is valid
    function verifyProof(PlonkProof calldata proof, uint256[] calldata publicInputs)
        external
        view
        override
        returns (bool isValid)
    {
        require(publicInputs.length == NUM_PUBLIC_INPUTS, "Wrong number of public inputs");

        // Convert PlonkProof to format expected by auto-generated verifier
        uint256[24] memory proofData;

        // Polynomial commitments (A, B, C, Z, T1, T2, T3, Wxi, Wxiw)
        proofData[0] = proof.A[0];
        proofData[1] = proof.A[1];
        proofData[2] = proof.B[0];
        proofData[3] = proof.B[1];
        proofData[4] = proof.C[0];
        proofData[5] = proof.C[1];
        proofData[6] = proof.Z[0];
        proofData[7] = proof.Z[1];
        proofData[8] = proof.T1[0];
        proofData[9] = proof.T1[1];
        proofData[10] = proof.T2[0];
        proofData[11] = proof.T2[1];
        proofData[12] = proof.T3[0];
        proofData[13] = proof.T3[1];
        proofData[14] = proof.W1[0];
        proofData[15] = proof.W1[1];
        proofData[16] = proof.W2[0];
        proofData[17] = proof.W2[1];
        proofData[18] = proof.W3[0];
        proofData[19] = proof.W3[1];

        // Opening evaluations (eval_a, eval_b, eval_c, eval_s1, eval_s2, eval_zw)
        // These are stored in the proof JSON but need to be passed separately
        // For the wrapper, we expect them as part of publicInputs or separate
        proofData[20] = 0; // eval_a - need from proof JSON
        proofData[21] = 0; // eval_b - need from proof JSON
        proofData[22] = 0; // eval_c - need from proof JSON
        proofData[23] = 0; // packed eval_s1, eval_s2, eval_zw

        // Convert dynamic array to fixed-size array for PlonkVerifier
        uint256[1] memory pubSignals;
        if (publicInputs.length > 0) {
            pubSignals[0] = publicInputs[0];
        }

        return VERIFIER.verifyProof(proofData, pubSignals);
    }

    /// @notice Get verifier address
    function getVerifier() external view returns (address) {
        return address(VERIFIER);
    }
}
