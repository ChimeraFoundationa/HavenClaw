# OpenClaw ZK Contracts

**Zero-Knowledge Verifiers for OpenClaw Agent Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange)](https://getfoundry.sh/)

---

## 🎯 Overview

This repository contains **Zero-Knowledge (ZK) verifier contracts** for the OpenClaw Agent Protocol. These contracts enable:

- **PLONK Verification** - Verify PLONK proofs on-chain
- **ZK 6G Capability Proofs** - Zero-knowledge proofs for agent capabilities
- **Proof Validation** - Trustless verification of off-chain computations

---

## 🏗️ Contract Architecture

```
src/
├── core/
│   ├── PLONKVerifier.sol        # Core PLONK verification logic
│   ├── PLONKVerifierWrapper.sol # Wrapper for easy integration
│   └── ZK6GVerifier.sol         # 6G capability ZK verifier
│
└── interfaces/
    ├── IPLONKVerifier.sol       # PLONK verifier interface
    └── IZKVerifier.sol          # Generic ZK verifier interface
```

---

## 🔐 ZK/PLONK Directory Structure

```
zk/
├── circuits/                    # Circom circuit definitions
│   ├── 6g_capability_proof.circom
│   ├── capability_proof.circom
│   ├── minimal_capability.circom
│   ├── simple_6g.circom
│   └── simple_capability.circom
│
├── build/                       # Build artifacts
│   ├── 6g_capability_proof_plonk.zkey
│   ├── verifier_plonk.sol
│   ├── proof_plonk.json
│   ├── vkey_plonk.json
│   └── public_plonk.json
│
├── proofs/                      # Generated proofs
│   ├── plonk_6g_public.json
│   ├── plonk_6g_latest_proof.json
│   └── ...
│
├── scripts/                     # Setup and proof generation
│   ├── setup-plonk.sh
│   ├── generate-plonk-proof.sh
│   ├── generate-plonk-proof.js
│   ├── DeployPLONKVerifier.s.sol
│   └── DeployZKVerifier.s.sol
│
├── test/                        # ZK contract tests
│   ├── PLONKVerifier.t.sol
│   └── ZKVerifier.t.sol
│
└── docs/
    ├── PLONK.md
    ├── PLONK_INTEGRATION_UPDATE.md
    ├── PLONK_MIGRATION_COMPLETE.md
    ├── IMPLEMENTATION_COMPLETE.md
    ├── STATUS.md
    └── ALL_TESTS_PASSED.md
```

---

## 📦 Contracts

### PLONKVerifier

Core PLONK proof verification contract.

```solidity
interface IPLONKVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
    function verifyProof(bytes calldata proof) external view returns (bool);
}
```

**Features:**
- Gas-optimized verification
- Support for multiple proof formats
- Event emission for indexing

### PLONKVerifierWrapper

Simplified wrapper for integrating PLONK verification.

```solidity
contract PLONKVerifierWrapper {
    function verifyAndExecute(
        bytes calldata proof,
        address target,
        bytes calldata data
    ) external returns (bool);
}
```

**Use Cases:**
- Agent capability verification
- Task completion proofs
- Governance vote validation

### ZK6GVerifier

Specialized verifier for 6G capability proofs.

```solidity
contract ZK6GVerifier {
    function verify6GCapability(
        bytes calldata proof,
        bytes32 agentId,
        uint256 timestamp
    ) external view returns (bool);
}
```

**Features:**
- Optimized for 6G-specific circuits
- Agent identity binding
- Timestamp validation

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Foundry (forge, cast, anvil)
- Node.js 18+
- Circom (for circuit compilation)

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install Circom
git clone https://github.com/iden3/circom.git
cd circom && cargo build --release
```

### Installation

```bash
# Clone repository
git clone https://github.com/openclaw/contracts.git
cd contracts

# Install dependencies
forge install

# Install npm dependencies
npm install
```

### Build Contracts

```bash
# Compile all contracts
forge build

# Compile with gas report
forge build --gas-report
```

### Run Tests

```bash
# Run all tests
forge test

# Run ZK tests only
forge test --match-path zk/test/

# Run with verbosity
forge test -vvv

# Run with gas report
forge test --gas-report
```

---

## 🔧 ZK Circuit Development

### Setup PLONK

```bash
cd zk
./scripts/setup-plonk.sh
```

### Generate Proofs

```bash
# Using shell script
./scripts/generate-plonk-proof.sh

# Using Node.js
node scripts/generate-plonk-proof.js
```

### Deploy Verifiers

```bash
# Deploy PLONK verifier
forge script zk/scripts/DeployPLONKVerifier.s.sol --rpc-url <URL> --broadcast

# Deploy ZK verifier
forge script zk/scripts/DeployZKVerifier.s.sol --rpc-url <URL> --broadcast
```

---

## 📖 Usage Examples

### Verify PLONK Proof

```solidity
import {IPLONKVerifier} from "./interfaces/IPLONKVerifier.sol";

contract MyContract {
    IPLONKVerifier public verifier;
    
    constructor(address _verifier) {
        verifier = IPLONKVerifier(_verifier);
    }
    
    function verifyCapability(bytes calldata proof) external {
        require(verifier.verify(proof, new bytes32[](0)), "Invalid proof");
        // Proceed with verified capability
    }
}
```

### Generate Proof (Off-chain)

```javascript
const snarkjs = require('snarkjs');

const { proof, publicSignals } = await snarkjs.plonk.fullProve(
    input,
    'zk/build/6g_capability_proof_plonk.zkey',
    'zk/build/verifier_plonk.sol'
);

const proofBytes = snarkjs.plonk.exportSolidityCallData(proof, publicSignals);
```

---

## 📊 Gas Costs

| Operation | Gas Cost |
|-----------|----------|
| PLONK Verify (simple) | ~250,000 |
| PLONK Verify (complex) | ~500,000 |
| ZK6G Verify | ~300,000 |

*Costs vary based on proof complexity and public inputs*

---

## 🔐 Security Considerations

### Trusted Setup
- PLONK requires a trusted setup ceremony
- Verification key must be generated securely
- Store zkey files securely

### Proof Validation
- Always verify proofs on-chain before trusting results
- Check public inputs match expected values
- Validate timestamps to prevent replay attacks

### Access Control
- Restrict who can submit proofs if needed
- Consider rate limiting for expensive verifications
- Monitor gas costs for DoS prevention

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [PLONK.md](zk/PLONK.md) | PLONK integration guide |
| [STATUS.md](zk/STATUS.md) | Current implementation status |
| [IMPLEMENTATION_COMPLETE.md](zk/IMPLEMENTATION_COMPLETE.md) | Implementation details |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`forge test`)
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the OpenClaw Protocol**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
