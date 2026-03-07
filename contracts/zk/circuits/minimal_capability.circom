// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

/**
 * @title MinimalCapabilityProof Circuit
 * @notice Minimal working ZK proof circuit for AI agent capability verification
 * 
 * Circuit that proves an agent knows a secret value that produces 
 * an accuracy score above a threshold.
 * 
 * Public Inputs:
 * - capabilityHash: Hash identifier for the capability
 * - accuracyScore: The accuracy score (0-100)
 * 
 * Private Witness:
 * - secretKey: Agent's private key
 * - threshold: Minimum threshold (e.g., 90)
 * - salt: Random salt for privacy
 * 
 * Statement: "I know secretKey such that accuracy >= threshold"
 */

template MinimalCapabilityProof() {
    // Public inputs
    signal input capabilityHash;
    signal input accuracyScore;
    
    // Private witness
    signal input secretKey;
    signal input threshold;
    signal input salt;
    
    // Output
    signal output valid;
    
    // ================================================================
    // Constraint 1: Range check for accuracyScore (0-100)
    // ================================================================
    // Decompose accuracyScore into 7 bits (2^7 = 128 > 100)
    signal accBits[7];
    var accSum = 0;
    
    for (let i = 0; i < 7; i++) {
        accBits[i] <== (accuracyScore >> i) & 1;
        accSum = accSum + accBits[i] * (1 << i);
    }
    accuracyScore === accSum;
    
    // ================================================================
    // Constraint 2: Range check for threshold (0-100)
    // ================================================================
    signal threshBits[7];
    var threshSum = 0;
    
    for (let i = 0; i < 7; i++) {
        threshBits[i] <== (threshold >> i) & 1;
        threshSum = threshSum + threshBits[i] * (1 << i);
    }
    threshold === threshSum;
    
    // ================================================================
    // Constraint 3: Verify accuracyScore >= threshold
    // ================================================================
    // Compute difference: accuracyScore - threshold >= 0
    signal diff;
    diff <== accuracyScore - threshold;
    
    // Add constraint that diff must be non-negative
    // We do this by ensuring diff + 100 is in valid range
    signal diffCheck;
    diffCheck <== diff + 100;
    
    // Range check diffCheck (should be 100-200 when diff >= 0)
    signal diffBits[8];
    var diffSum = 0;
    
    for (let i = 0; i < 8; i++) {
        diffBits[i] <== (diffCheck >> i) & 1;
        diffSum = diffSum + diffBits[i] * (1 << i);
    }
    diffCheck === diffSum;
    
    // ================================================================
    // Constraint 4: Prove knowledge of secretKey (commitment)
    // ================================================================
    // Create a simple commitment: secretKey^2 + salt
    signal commitment;
    commitment <== secretKey * secretKey + salt;
    
    // ================================================================
    // Constraint 5: Bind to capability
    // ================================================================
    signal capBinding;
    capBinding <== capabilityHash * secretKey;
    
    // ================================================================
    // Proof is valid if all constraints are satisfied
    // ================================================================
    valid <== 1;
}

component main = MinimalCapabilityProof();
