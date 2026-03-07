# Zero-Knowledge Proof Guide

## Overview

This guide explains how to generate and verify Zero-Knowledge (ZK) proofs for the Agent Coordination Framework. The framework uses **Groth16** proofs on the **BN254 curve**, compatible with **snarkjs** and **Circom**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZK Proof Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Circuit    │     │    Setup     │     │    Proof     │    │
│  │  (.circom)   │────►│  (zkey)      │────►│  Generation  │    │
│  │              │     │              │     │              │    │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘    │
│                              │                     │            │
│                              ▼                     ▼            │
│                       ┌──────────────┐     ┌──────────────┐    │
│                       │  Verifier    │     │  On-chain    │    │
│                       │  (Solidity)  │◄────│  Verification│    │
│                       │              │     │              │    │
│                       └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Install Node.js

```bash
# Download from https://nodejs.org/
# Or use nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Install Circom

```bash
# Clone circom repository
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Verify installation
circom --version
```

### 3. Install snarkjs

```bash
npm install -g snarkjs
```

### 4. Install Project Dependencies

```bash
cd contracts
npm install
```

---

## Step 1: Understand the Circuit

### Circuit Definition: `zk/circuits/minimal_capability.circom`

```circom
template MinimalCapabilityProof() {
    // Public inputs (visible on-chain)
    signal input capabilityHash;    // Which capability is being proven
    signal input accuracyScore;     // Claimed accuracy (0-100)
    
    // Private witness (kept secret)
    signal input secretKey;         // Agent's private key/model
    signal input threshold;         // Required threshold (e.g., 90)
    signal input salt;              // Random salt for privacy
    
    // Output
    signal output valid;
    
    // Constraints:
    // 1. Verify accuracyScore is in range [0, 100]
    // 2. Verify threshold is in range [0, 100]
    // 3. Verify accuracyScore >= threshold
    // 4. Prove knowledge of secretKey (commitment)
    // 5. Bind proof to capability
}
```

### What the Proof Proves

> "I know a secret key such that my model achieves accuracy >= threshold, without revealing the secret key or model weights."

---

## Step 2: Trusted Setup Ceremony

The trusted setup generates the proving and verification keys.

### Run Setup

```bash
npm run setup
```

### What This Does

1. **Compiles the circuit** → Generates `.r1cs` and `.wasm` files
2. **Phase 1: Powers of Tau** → Generates `circuit_0000.zkey`
3. **Phase 2: Circuit-specific** → Generates `circuit_final.zkey`
4. **Exports verification key** → Generates `vkey.json`
5. **Exports Solidity verifier** → Generates `verifier.sol`
6. **Extracts IC points** → Generates `ic_points.json`

### Generated Files

```
zk/build/
├── minimal_capability.r1cs      # Circuit constraints
├── minimal_capability.wasm      # WASM for witness generation
├── circuit_0000.zkey            # After Phase 1
├── circuit_final.zkey           # After Phase 2 (proving key)
├── vkey.json                    # Verification key
├── verifier.sol                 # Solidity verifier (auto-generated)
└── ic_points.json               # IC points for on-chain verifier
```

---

## Step 3: Generate a Proof

### Using the Script

```bash
npm run generate-proof
```

### What This Does

1. Creates witness from private inputs
2. Generates Groth16 proof
3. Verifies proof locally
4. Saves proof to `zk/proofs/`

### Example Output

```json
{
  "proof": {
    "a": ["1234567890...", "9876543210..."],
    "b": [
      ["1111111111...", "2222222222..."],
      ["3333333333...", "4444444444..."]
    ],
    "c": ["5555555555...", "6666666666..."]
  },
  "publicInputs": ["12345", "95", "67890"],
  "publicSignals": ["12345", "95", "67890"],
  "capabilityName": "data_analysis",
  "accuracyScore": 95,
  "threshold": 90,
  "agentAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

### Manual Proof Generation

```javascript
const snarkjs = require('snarkjs');
const fs = require('fs');

// 1. Prepare inputs
const input = {
    capabilityHash: "123456789012345",
    accuracyScore: "95",
    secretKey: "98765432109876543210",
    threshold: "90",
    salt: "1111111111111111"
};

// 2. Generate witness
const { witness } = await snarkjs.wtns.calculate(input, 'zk/build/minimal_capability.wasm');

// 3. Generate proof
const { proof, publicSignals } = await snarkjs.groth16.prove(
    'zk/build/circuit_final.zkey',
    witness
);

// 4. Verify locally
const vKey = JSON.parse(fs.readFileSync('zk/build/vkey.json'));
const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
console.log('Proof valid:', isValid);
```

---

## Step 4: Verify Proof On-Chain

### Deploy Contracts

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key_here

# Deploy to local network
forge script script/DeployAgentFramework.s.sol:DeployAgentFramework \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### Update Verifier with IC Points

After running `npm run setup`, update the deployment script with actual IC points:

```solidity
// Load from zk/build/ic_points.json
uint256[] memory icX = new uint256[](3);
uint256[] memory icY = new uint256[](3);
icX[0] = <from ic_points.json>;
icY[0] = <from ic_points.json>;
// ... etc
```

### Call verifyProof

```solidity
// Prepare proof in Solidity format
IZKVerifier.Proof memory proof = IZKVerifier.Proof({
    a: [uint256(proof_a_0), uint256(proof_a_1)],
    b: [[uint256(proof_b_0_1), uint256(proof_b_0_0)], 
        [uint256(proof_b_1_1), uint256(proof_b_1_0)]],
    c: [uint256(proof_c_0), uint256(proof_c_1)]
});

uint256[] memory publicInputs = new uint256[](3);
publicInputs[0] = capabilityHash;
publicInputs[1] = accuracyScore;
publicInputs[2] = agentId;

// Verify on-chain
zkVerifier.verifyProof(
    proof,
    publicInputs,
    bytes32(0),  // commitmentHash
    bytes32(0)   // ipfsCID
);
```

---

## Step 5: Integrate with GAT

### Perform GAT Test with ZK Proof

```solidity
// Convert proof to GAT format
IZKVerifier.Proof memory zkProof = IZKVerifier.Proof({
    a: [proof.a[0], proof.a[1]],
    b: [proof.b[0], proof.b[1]],
    c: [proof.c[0], proof.c[1]]
});

// Call GAT
gat.performTest(
    agentAddress,
    keccak256("data_analysis"),
    zkProof,
    publicInputs
);
```

---

## Troubleshooting

### Error: "Proof verification failed"

**Cause:** Proof was generated with different circuit than verifier expects.

**Solution:**
```bash
# Re-run setup to regenerate keys
npm run setup

# Regenerate proof
npm run generate-proof
```

### Error: "Constraint doesn't match"

**Cause:** Input values don't satisfy circuit constraints.

**Solution:** Ensure `accuracyScore >= threshold` and both are in range [0, 100].

### Error: "Circom not found"

**Solution:**
```bash
# Install circom
cargo install --path circom
circom --version
```

---

## Security Considerations

### Trusted Setup

- The `circuit_final.zkey` contains toxic waste from the setup ceremony
- In production, use a **multi-party ceremony (MPC)** for security
- Never share your contribution to the zkey

### Proof Replay

- Each proof can only be verified once (replay protection)
- Proof hash is stored in `isProofVerified` mapping
- Use different `salt` values for each proof

### Privacy

- Private inputs (secretKey, model weights) are **never revealed**
- Only public inputs (capabilityHash, accuracyScore) are visible on-chain
- Salt adds randomness to prevent correlation

---

## Advanced Usage

### Custom Circuit

To create your own circuit:

1. Create `zk/circuits/my_custom.circom`
2. Update `package.json` script:
   ```json
   "compile:circuit": "circom zk/circuits/my_custom.circom --r1cs --wasm --sym --output-dir zk/build"
   ```
3. Run `npm run setup`
4. Update Solidity verifier with new IC points

### Batch Verification

Verify multiple proofs in one transaction:

```solidity
function verifyMultipleProofs(
    Proof[] calldata proofs,
    uint256[][] calldata publicInputs
) external returns (bool[] memory results) {
    results = new bool[](proofs.length);
    for (uint i = 0; i < proofs.length; i++) {
        results[i] = _verifyProofInternal(proofs[i], publicInputs[i]);
    }
}
```

### Gas Optimization

- Groth16 verification costs ~250,000-300,000 gas
- Use `verifyProofBool` for view (free) verification
- Store proof hashes off-chain when possible

---

## Resources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Groth16 Paper](https://eprint.iacr.org/2016/260)
- [BN254 Curve](https://en.wikipedia.org/wiki/BN_curve)

---

## License

MIT License - See [LICENSE](../LICENSE) for details.
