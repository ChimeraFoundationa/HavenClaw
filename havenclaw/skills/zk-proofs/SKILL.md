# ZK Proofs Skill

## Description
Generate and verify zero-knowledge proofs for agent capabilities using PLONK.

## Capabilities
- Generate capability proofs
- Verify proofs on-chain
- Setup ZK circuits
- Manage proof storage

## Configuration

```json
{
  "enabled": true,
  "settings": {
    "circuitDirectory": "~/.havenclaw/circuits",
    "proofStorage": "local",
    "autoVerify": true
  }
}
```

## Usage

```bash
# Generate a proof
havenclaw zk prove --circuit capability_proof --input data.json --output proof.json

# Verify a proof
havenclaw zk verify --proof proof.json --public public.json

# Setup circuits
havenclaw zk setup --circuit capability_proof

# List circuits
havenclaw zk circuits
```

## Available Circuits

| Circuit | Description |
|---------|-------------|
| `capability_proof` | Prove agent has specific capabilities |
| `identity_proof` | Prove agent identity without revealing details |
| `reputation_proof` | Prove agent reputation score |
| `task_completion_proof` | Prove task was completed correctly |

## Contract Integration

This skill interacts with the following HavenVM contracts:

- **PLONKVerifier** - On-chain proof verification
- **GAT** - Genuine Agent Test
- **AgentRegistry** - Capability verification

## Author
Ava Labs

## License
MIT
