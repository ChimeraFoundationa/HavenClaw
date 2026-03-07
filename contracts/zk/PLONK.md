# PLONK Zero-Knowledge Proof Setup for 6G Capability

## Overview

This project uses **PLONK** (Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge) for zero-knowledge proofs.

### Why PLONK?

| Feature | PLONK | Groth16 |
|---------|-------|---------|
| Trusted Setup | Universal (one-time) | Circuit-specific |
| Updatable | ✅ Yes | ❌ No |
| Proof Size | ~288 bytes | ~192 bytes |
| Verification Gas | ~300k | ~250k |
| Proving Time | Slower | Faster |

---

## Quick Start

### 1. Compile Circuit

```bash
cd /root/soft/contracts
/root/.cargo/bin/circom zk/circuits/6g_capability_proof.circom --r1cs --wasm --sym -o zk/build
```

### 2. Run PLONK Trusted Setup

```bash
npm run setup:plonk
```

This will:
- Generate universal trusted setup (pot14_final.ptau)
- Create circuit-specific zkey
- Export verifier.sol and vkey.json

### 3. Generate Proof

```bash
npm run generate:plonk
```

### 4. Verify Proof

```bash
npx snarkjs plonk verify zk/build/vkey_plonk.json zk/build/public_plonk.json zk/build/proof_plonk.json
```

---

## Manual Commands

### Full Setup (Single Command)

```bash
bash zk/scripts/setup-plonk.sh
```

### Generate Proof (Single Command)

```bash
bash zk/scripts/generate-plonk-proof.sh
```

---

## File Structure

```
zk/
├── circuits/
│   └── 6g_capability_proof.circom    # Circuit definition
├── build/
│   ├── 6g_capability_proof.r1cs      # Circuit constraints
│   ├── 6g_capability_proof.wasm      # WASM for witness
│   ├── pot14_final.ptau             # Universal trusted setup
│   ├── 6g_capability_proof_plonk.zkey  # PLONK proving key
│   ├── vkey_plonk.json              # Verification key
│   ├── verifier_plonk.sol           # Auto-generated verifier
│   ├── proof_plonk.json             # Generated proof
│   └── public_plonk.json            # Public inputs
├── scripts/
│   ├── setup-plonk.sh               # Setup script
│   ├── generate-plonk-proof.sh      # Proof generation
│   ├── generate-plonk-proof.js      # JS version
│   └── DeployPLONKVerifier.s.sol    # Deploy script
├── test/
│   └── PLONKVerifier.t.sol          # Tests
└── proofs/
    └── plonk_6g_latest_proof.json   # Latest proof
```

---

## Circuit Specification

### Public Inputs (6)
1. `agentId` - Agent identifier
2. `capabilityHash` - Hash of capability being proven
3. `avgAccuracy` - Average accuracy score (0-100)
4. `timestamp` - Unix timestamp
5. `reserved1` - Reserved
6. `reserved2` - Reserved

### Private Witness (15)
- `score0` to `score5` - Individual capability scores
- `thresh0` to `thresh5` - Individual thresholds
- `modelCommitment` - Model weight commitment
- `secretKey` - Agent's secret key
- `salt` - Random salt for privacy

### Constraints Verified
1. Each score is in range [0, 100]
2. Each threshold is in range [0, 100]
3. Each score >= corresponding threshold
4. Average = sum(scores) / 6
5. Bindings to agent and capability

---

## Deploy to Blockchain

### 1. Update Verifier

After running setup, copy values from `zk/build/verifier_plonk.sol` to `src/core/PLONKVerifier.sol`.

### 2. Deploy

```bash
export PRIVATE_KEY=your_key_here
forge script zk/scripts/DeployPLONKVerifier.s.sol --rpc-url <URL> --broadcast
```

### 3. Verify On-Chain

```solidity
IPLONKVerifier.PlonkProof memory proof = IPLONKVerifier.PlonkProof({
    A: [proof_A_0, proof_A_1],
    B: [proof_B_0, proof_B_1],
    C: [proof_C_0, proof_C_1],
    Z: [proof_Z_0, proof_Z_1],
    W1: [proof_W1_0, proof_W1_1],
    W2: [proof_W2_0, proof_W2_1],
    W3: [proof_W3_0, proof_W3_1]
});

uint256[] memory publicInputs = new uint256[](6);
publicInputs[0] = agentId;
publicInputs[1] = capabilityHash;
publicInputs[2] = avgAccuracy;
publicInputs[3] = timestamp;
publicInputs[4] = reserved1;
publicInputs[5] = reserved2;

bool isValid = verifier.verifyProof(proof, publicInputs);
```

---

## Troubleshooting

### Error: "WASM not found"
Run `npm run compile:circuit` first.

### Error: "ZKey not found"
Run `npm run setup:plonk` first.

### Error: "Proof verification failed"
Ensure inputs satisfy circuit constraints (scores >= thresholds).

---

## License

MIT
