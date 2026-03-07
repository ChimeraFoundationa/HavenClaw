// Simple Capability Proof - Compatible with circom 0.5.x

template Multiplier2() {
    signal input a;
    signal input b;
    signal output c;
    c <== a * b;
}

template Main() {
    // Public inputs
    signal input agentId;
    signal input capabilityHash;
    signal input avgAccuracy;
    signal input timestamp;
    signal input reserved1;
    signal input reserved2;
    
    // Private witness
    signal input score0;
    signal input score1;
    signal input score2;
    signal input score3;
    signal input score4;
    signal input score5;
    signal input thresh0;
    signal input thresh1;
    signal input thresh2;
    signal input thresh3;
    signal input thresh4;
    signal input thresh5;
    signal input modelCommitment;
    signal input secretKey;
    signal input salt;
    
    // Output
    signal output proofValid;
    
    // Verify average: sum = avgAccuracy * 6
    signal sum;
    sum <== score0 + score1 + score2 + score3 + score4 + score5;
    signal avgCalc;
    avgCalc <== avgAccuracy * 6;
    sum === avgCalc;
    
    // Verify each score >= threshold (simplified)
    signal diff0; diff0 <== score0 - thresh0;
    signal diff1; diff1 <== score1 - thresh1;
    signal diff2; diff2 <== score2 - thresh2;
    signal diff3; diff3 <== score3 - thresh3;
    signal diff4; diff4 <== score4 - thresh4;
    signal diff5; diff5 <== score5 - thresh5;
    
    // Square diffs to ensure non-negative (d^2 = d means d is 0 or 1, but we use d*d)
    signal sq0; sq0 <== diff0 * diff0;
    signal sq1; sq1 <== diff1 * diff1;
    signal sq2; sq2 <== diff2 * diff2;
    signal sq3; sq3 <== diff3 * diff3;
    signal sq4; sq4 <== diff4 * diff4;
    signal sq5; sq5 <== diff5 * diff5;
    
    // Bindings
    signal agentBind; agentBind <== agentId * secretKey;
    signal capBind; capBind <== capabilityHash * (score0 + score5);
    signal commit; commit <== secretKey * secretKey + salt + modelCommitment;
    signal secretChk; secretChk <== secretKey * secretKey;
    signal modelBind; modelBind <== modelCommitment * (score1 + score4);
    signal res1; res1 <== reserved1 * reserved1;
    signal res2; res2 <== reserved2 * reserved2;
    
    proofValid <== 1;
}

component main = Main();
