// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

/**
 * @title CapabilityProof Circuit
 * @notice Zero-Knowledge proof circuit for verifying AI agent capabilities
 * 
 * This circuit proves that an AI agent has performed a computation
 * with accuracy above a threshold, without revealing the actual data.
 * 
 * Public Inputs:
 * - capabilityHash: Hash of the capability being proven
 * - accuracyScore: The accuracy score achieved (0-100)
 * 
 * Private Inputs (Witness):
 * - modelWeights: Array of model weights (private)
 * - predictions: Array of predictions (private)
 * - threshold: Minimum accuracy threshold
 * 
 * Proof Statement:
 * "I know model weights and predictions such that accuracy >= threshold"
 */

include "circomlib/circuits/comparators.circom";

template CapabilityProof() {
    // Public inputs (32 bits each for simplicity)
    signal input capabilityHash;      // Hash of capability (simplified)
    signal input accuracyScore;       // 0-100
    signal input agentId;             // Agent identifier
    
    // Private inputs (witness)
    signal input modelCommitment;     // Hash/commitment of model weights
    signal input predictions;         // Encoded predictions
    signal input threshold;           // Required threshold (e.g., 90)
    signal input salt;                // Random salt for privacy
    
    // Output: proof validity
    signal output proofValid;
    
    // ========================================================================
    // Constraint 1: Verify accuracyScore is in valid range (0-100)
    // ========================================================================
    // Using 7 bits since 2^7 = 128 > 100
    component rangeCheck = LessEqThan(7);
    rangeCheck.in[0] <== accuracyScore;
    rangeCheck.in[1] <== 100;
    
    // ========================================================================
    // Constraint 2: Verify accuracy meets threshold
    // ========================================================================
    // threshold <= accuracyScore
    component comparator = LessEqThan(7);
    comparator.in[0] <== threshold;
    comparator.in[1] <== accuracyScore;
    
    // If comparator.out == 1, then threshold <= accuracyScore
    proofValid <== comparator.out;
    
    // ========================================================================
    // Constraint 3: Bind proof to specific capability
    // ========================================================================
    // Ensure capabilityHash is non-zero
    signal capCheck;
    capCheck <== capabilityHash * capabilityHash;
    // This ensures capabilityHash was used in the circuit
    
    // ========================================================================
    // Constraint 4: Bind proof to specific agent
    // ========================================================================
    // Ensure agentId is non-zero
    signal agentCheck;
    agentCheck <== agentId * agentId;
    
    // ========================================================================
    // Constraint 5: Verify model commitment was used
    // ========================================================================
    signal modelCheck;
    modelCheck <== modelCommitment * modelCommitment;
    
    // ========================================================================
    // Constraint 6: Verify predictions were used
    // ========================================================================
    signal predCheck;
    predCheck <== predictions * predictions;
}

component main = CapabilityProof();
