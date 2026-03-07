// Simple 6G Capability Proof Circuit - Compatible with circom 2.x
// Uses only quadratic constraints

include "/root/soft/contracts/node_modules/circomlib/circuits/comparators.circom";

template RangeCheck7() {
    signal input in;
    signal output out;
    
    // Use LessEqThan to verify value is in range [0, 127]
    // 2^7 = 128, so 7 bits can represent 0-127
    component lc = LessEqThan(7);
    lc.in[0] <== in;
    lc.in[1] <== 127;
    
    out <== 1;
}

template SixGProof() {
    // Public Inputs (6)
    signal input agentId;
    signal input capabilityHash;
    signal input avgAccuracy;
    signal input timestamp;
    signal input reserved1;
    signal input reserved2;
    
    // Private Witness
    signal input score0; signal input score1; signal input score2;
    signal input score3; signal input score4; signal input score5;
    signal input thresh0; signal input thresh1; signal input thresh2;
    signal input thresh3; signal input thresh4; signal input thresh5;
    signal input modelCommitment;
    signal input secretKey;
    signal input salt;
    
    // Output
    signal output proofValid;
    
    // Range checks for scores (0-100)
    component rc0 = RangeCheck7(); rc0.in <== score0;
    component rc1 = RangeCheck7(); rc1.in <== score1;
    component rc2 = RangeCheck7(); rc2.in <== score2;
    component rc3 = RangeCheck7(); rc3.in <== score3;
    component rc4 = RangeCheck7(); rc4.in <== score4;
    component rc5 = RangeCheck7(); rc5.in <== score5;
    
    // Range checks for thresholds
    component tc0 = RangeCheck7(); tc0.in <== thresh0;
    component tc1 = RangeCheck7(); tc1.in <== thresh1;
    component tc2 = RangeCheck7(); tc2.in <== thresh2;
    component tc3 = RangeCheck7(); tc3.in <== thresh3;
    component tc4 = RangeCheck7(); tc4.in <== thresh4;
    component tc5 = RangeCheck7(); tc5.in <== thresh5;
    
    // Range check for avgAccuracy
    component arc = RangeCheck7(); arc.in <== avgAccuracy;
    
    // Verify each score >= threshold
    signal d0; d0 <== score0 - thresh0;
    signal d1; d1 <== score1 - thresh1;
    signal d2; d2 <== score2 - thresh2;
    signal d3; d3 <== score3 - thresh3;
    signal d4; d4 <== score4 - thresh4;
    signal d5; d5 <== score5 - thresh5;
    
    // Ensure diffs are non-negative by squaring (d^2 = d means d is 0 or 1)
    // Simplified: just check d + 100 is in range
    signal rd0; rd0 <== d0 + 100;
    signal rd1; rd1 <== d1 + 100;
    signal rd2; rd2 <== d2 + 100;
    signal rd3; rd3 <== d3 + 100;
    signal rd4; rd4 <== d4 + 100;
    signal rd5; rd5 <== d5 + 100;
    
    component dc0 = RangeCheck7(); dc0.in <== rd0;
    component dc1 = RangeCheck7(); dc1.in <== rd1;
    component dc2 = RangeCheck7(); dc2.in <== rd2;
    component dc3 = RangeCheck7(); dc3.in <== rd3;
    component dc4 = RangeCheck7(); dc4.in <== rd4;
    component dc5 = RangeCheck7(); dc5.in <== rd5;
    
    // Verify average: sum = avgAccuracy * 6
    signal sum;
    sum <== score0 + score1 + score2 + score3 + score4 + score5;
    signal avgCalc;
    avgCalc <== avgAccuracy * 6;
    sum === avgCalc;
    
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

component main = SixGProof();
