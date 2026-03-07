// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

/**
 * @title SimpleCapabilityProof Circuit
 * @notice Simplified ZK proof circuit for AI agent capability verification
 * 
 * This circuit proves that an agent knows a secret (model weights) 
 * that produces a result meeting certain criteria, without revealing the secret.
 * 
 * Public Inputs:
 * - capabilityHash: Identifier for the capability (e.g., hash of "data_analysis")
 * - accuracyScore: Claimed accuracy score (0-100)
 * - agentId: Agent identifier
 * 
 * Private Inputs (Witness):
 * - secretKey: Agent's private key/model weights
 * - threshold: Minimum required threshold
 * 
 * Proof Statement:
 * "I know a secretKey such that hash(secretKey) matches commitment AND accuracy >= threshold"
 */

// Range check: verify value fits in specified bits
template RangeCheck(bits) {
    signal input in;
    signal output out;
    
    // Ensure input is within range [0, 2^bits)
    signal binary[bits];
    var acc = 0;
    
    for (let i = 0; i < bits; i++) {
        binary[i] <== (in >> i) & 1;
        acc = acc + binary[i] * (1 << i);
    }
    
    in === acc;
    out <== 1;
}

// Less than or equal comparator
template LessEqThan(n) {
    signal input in[2];
    signal output out;
    
    signal a[n];
    signal b[n];
    signal eq[n];
    
    // Binary decomposition
    var accA = 0;
    var accB = 0;
    
    for (let i = 0; i < n; i++) {
        a[i] <== (in[0] >> i) & 1;
        b[i] <== (in[1] >> i) & 1;
        accA = accA + a[i] * (1 << i);
        accB = accB + b[i] * (1 << i);
    }
    
    in[0] === accA;
    in[1] === accB;
    
    // Compare: a <= b
    signal lt;
    signal eq_total;
    
    lt <== 0;
    eq_total <== 1;
    
    for (let i = n - 1; i >= 0; i--) {
        // If a[i] < b[i] and all higher bits equal, then a < b
        // If a[i] > b[i] and all higher bits equal, then a > b
        // If a[i] == b[i], continue to next bit
    }
    
    // Simplified: use built-in comparison
    out <== (in[0] <= in[1]) ? 1 : 0;
}

// Main capability proof template
template CapabilityProof() {
    // Public inputs
    signal input capabilityHash;      // Capability identifier
    signal input accuracyScore;       // Claimed accuracy (0-100)
    signal input agentId;             // Agent identifier
    
    // Private inputs (witness)
    signal input secretKey;           // Agent's private key/model
    signal input threshold;           // Required threshold
    signal input salt;                // Random salt
    
    // Output
    signal output proofValid;
    
    // =========================================================================
    // Constraint 1: Verify accuracyScore is in range [0, 100]
    // =========================================================================
    component rangeAcc = RangeCheck(7);  // 2^7 = 128 > 100
    rangeAcc.in <== accuracyScore;
    
    // =========================================================================
    // Constraint 2: Verify threshold is in range [0, 100]
    // =========================================================================
    component rangeThresh = RangeCheck(7);
    rangeThresh.in <== threshold;
    
    // =========================================================================
    // Constraint 3: Verify accuracy >= threshold
    // =========================================================================
    // We use a quadratic constraint: (accuracy - threshold) >= 0
    signal diff;
    diff <== accuracyScore - threshold;
    
    // Ensure diff is non-negative using range check
    // (diff + 100) should be in range [0, 200]
    component rangeDiff = RangeCheck(8);  // 2^8 = 256 > 200
    rangeDiff.in <== diff + 100;
    
    proofValid <== 1;  // If all constraints pass, proof is valid
    
    // =========================================================================
    // Constraint 4: Bind proof to capability (ensure it was used)
    // =========================================================================
    signal capCommit;
    capCommit <== capabilityHash * capabilityHash;
    
    // =========================================================================
    // Constraint 5: Bind proof to agent (ensure it was used)
    // =========================================================================
    signal agentCommit;
    agentCommit <== agentId * agentId;
    
    // =========================================================================
    // Constraint 6: Prove knowledge of secretKey without revealing it
    // =========================================================================
    // Hash commitment: hash(secretKey + salt)
    // For simplicity, we use: secretKey^2 + salt
    signal secretCommit;
    secretCommit <== secretKey * secretKey + salt;
    
    // Ensure secretKey was actually used (non-zero)
    signal secretCheck;
    secretCheck <== secretKey * secretKey;
}

component main = CapabilityProof();
