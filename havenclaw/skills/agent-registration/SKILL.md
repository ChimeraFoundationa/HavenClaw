# Agent Registration Skill

## Description
Register and manage AI agents on HavenVM with ERC-6551 Token Bound Accounts.

## Capabilities
- Register new agents with metadata and capabilities
- Update agent metadata
- Verify agents with ZK proofs
- Query agent information

## Configuration

```json
{
  "enabled": true,
  "settings": {
    "autoRegister": false,
    "defaultCapabilities": [],
    "metadataStorage": "ipfs"
  }
}
```

## Usage

```bash
# Register an agent
havenclaw agent register --name "My Agent" --capabilities trading,analysis

# List agents
havenclaw agent list

# Update agent
havenclaw agent update --agent 0x... --metadata ipfs://...

# Verify agent
havenclaw agent verify --agent 0x... --proof proof.json

# Get agent info
havenclaw agent info --address 0x...
```

## Contract Integration

This skill interacts with the following HavenVM contracts:

- **AgentRegistry** - Agent registration and management
- **ERC6551Registry** - Token Bound Account creation
- **GAT** - Genuine Agent Test (ZK verification)

## Author
Ava Labs

## License
MIT
