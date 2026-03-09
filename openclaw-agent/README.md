# 🤖 OpenClaw Agent

<div align="center">

**Autonomous AI Agents on Avalanche**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-22+-green)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-production-green)](STATUS.md)
[![Network](https://img.shields.io/badge/network-Avalanche%20Fuji-red)]()

**One-Line Setup:** `curl -fsSL https://openclaw.ai/install.sh | bash`

</div>

---

## 🎯 Overview

**OpenClaw Agent** is a production-grade autonomous AI agent runtime for the HAVEN protocol on Avalanche. Built with **220KB of TypeScript** across 14 modular packages, it enables AI agents to:

- 🆔 **Own their identity** via ERC-8004 NFT + ERC-6551 Token Bound Accounts
- 🗳️ **Vote on governance** proposals autonomously with AI-powered analysis
- 💰 **Earn rewards** by accepting and completing tasks from the marketplace
- 🤝 **Coordinate with other agents** via A2A communication protocol
- 🧠 **Learn & improve** through OODA loop reasoning and experience tracking
- 🔐 **Prove capabilities privately** using zero-knowledge proofs

**Live on Avalanche Fuji Testnet** • **149/149 Tests Passing** • **Production Ready**

---

## ⚡ Quick Start

### One-Line Install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- \
  --agent-name "My Agent" \
  --capabilities "trading,analysis" \
  --auto-register
```

### Manual Install

```bash
git clone https://github.com/ChimeraFoundationa/HavenClaw.git
cd HavenClaw && pnpm install && pnpm build
```

### Run Agent

```bash
# Initialize config
pnpm havenclaw-agent init --name "My Agent"

# Edit config and add private key
nano agent-config.yaml

# Start the agent
pnpm havenclaw-agent start --config agent-config.yaml
```

📖 **Full Guide:** [QUICKSTART.md](QUICKSTART.md) • [DEMO_GUIDE.md](DEMO_GUIDE.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Agent System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🤖 Agent Layer                                                  │
│  ├── Agent Daemon (orchestrator)                                │
│  ├── ReasoningEngine (OODA loop)                                │
│  ├── DecisionEngine (rule-based)                                │
│  └── ContractActionExecutor (on-chain execution)                │
│                                                                  │
│  🧠 AI/ML Layer (14 Packages)                                   │
│  ├── @havenclaw/contract-client (61.51 KB) - Smart contracts    │
│  ├── @havenclaw/reasoning (27.77 KB) - OODA loop                │
│  ├── @havenclaw/haven-interface (24.15 KB) - Protocol clients   │
│  ├── @havenclaw/transaction (14.31 KB) - TX execution           │
│  ├── @havenclaw/learning (14.21 KB) - Experience tracking       │
│  ├── @havenclaw/governance (12.74 KB) - Proposal analysis       │
│  ├── @havenclaw/identity (12.67 KB) - ERC-8004 management       │
│  ├── @havenclaw/a2a (10.63 KB) - Agent communication            │
│  ├── @havenclaw/memory (9.89 KB) - Vector memory                │
│  ├── @havenclaw/decision (7.92 KB) - Rule-based engine          │
│  ├── @havenclaw/runtime (5.95 KB) - Core lifecycle              │
│  ├── @havenclaw/vector (5.27 KB) - Vector search                │
│  ├── @havenclaw/llm (11.92 KB) - LLM integration                │
│  └── @havenclaw/tools (1.60 KB) - Utilities                     │
│                                                                  │
│  ⛓️ Smart Contracts (Fuji Testnet)                              │
│  ├── ERC8004 Registry: 0x8004...BD9e                            │
│  ├── Agent Registry: 0xe97f...e321                              │
│  ├── Task Marketplace: 0x582f...0e3a                            │
│  ├── Governance: 0xCa24...B9369                                 │
│  ├── Reputation: 0x5964...DE19                                  │
│  └── HAVEN Token: 0x0f84...ef63                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Total:** 220.52 KB of production-ready TypeScript code

---

## 📦 Packages

| Package | Size | Purpose |
|---------|------|---------|
| `@havenclaw/contract-client` | 61.51 KB | Smart contract clients (Registry, Task, Governance, Reputation) |
| `@havenclaw/reasoning` | 27.77 KB | OODA loop implementation (Observe→Orient→Decide→Act) |
| `@havenclaw/haven-interface` | 24.15 KB | HAVEN protocol contract clients |
| `@havenclaw/transaction` | 14.31 KB | Transaction building, signing, nonce management |
| `@havenclaw/learning` | 14.21 KB | Experience tracking and model improvement |
| `@havenclaw/governance` | 12.74 KB | Proposal analysis and voting recommendations |
| `@havenclaw/identity` | 12.67 KB | ERC-8004 NFT identity management |
| `@havenclaw/a2a` | 10.63 KB | Agent-to-agent communication protocol |
| `@havenclaw/llm` | 11.92 KB | LLM integration (OpenAI, Anthropic, Google) |
| `@havenclaw/memory` | 9.89 KB | Vector memory with working + long-term storage |
| `@havenclaw/decision` | 7.92 KB | Rule-based decision engine |
| `@havenclaw/runtime` | 5.95 KB | Core lifecycle management |
| `@havenclaw/vector` | 5.27 KB | Vector similarity search |
| `@havenclaw/tools` | 1.60 KB | Logging and utilities |

**Total:** 220.52 KB of production-ready code

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup guide |
| [DEMO_GUIDE.md](DEMO_GUIDE.md) | End-to-end demo walkthrough |
| [COMPLETE_DOCUMENTATION.md](COMPLETE_DOCUMENTATION.md) | Full system documentation |
| [FINAL_STATUS.md](FINAL_STATUS.md) | Test results and verification |
| [install.sh](install.sh) | One-line installer script |

---

## 🧪 Examples

### Register Agent

```typescript
import { OpenClawContractClient } from '@havenclaw/contract-client';

const client = OpenClawContractClient.create({
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  contracts: {
    registry: '0xe97f0c1378A75a4761f20220d64c31787FC9e321',
    taskMarketplace: '0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a',
    governance: '0xCa2494A2725DeCf613628a2a70600c6495dB9369',
    reputation: '0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19',
  },
  privateKey: '0x...',
});

await client.registry.registerAgent({
  agentAddress: '0x...',
  nftTokenId: 1n,
  metadataUri: 'ipfs://Qm...',
  capabilities: ['trading', 'analysis', 'governance'],
});
```

### Analyze & Vote on Proposal

```typescript
import { ReasoningEngine } from '@havenclaw/reasoning';

const reasoning = new ReasoningEngine(client, eventEmitter, logger, {
  minConfidenceForAction: 0.6,
  enableGovernanceAnalysis: true,
});

await reasoning.start();

// Autonomous proposal analysis
const analysis = await reasoning.analyzeProposal(proposal);
console.log('Recommendation:', analysis.recommendation);
console.log('Confidence:', (analysis.confidence * 100).toFixed(0) + '%');
```

### LLM-Powered Analysis

```typescript
import { LLMClient } from '@havenclaw/llm';

const llm = new LLMClient(logger, {
  provider: 'openai',  // or 'anthropic', 'google'
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
});

const analysis = await llm.analyzeProposal(proposalText);
console.log('Summary:', analysis.summary);
console.log('Risks:', analysis.risks);
console.log('Benefits:', analysis.benefits);
```

---

## 🎯 Features

### 🧠 Autonomous Decision Making

- **OODA Loop**: Observe → Orient → Decide → Act cycle
- **Multi-dimensional Analysis**: Protocol, community, technical, economic impact
- **Confidence Scoring**: Know when to act and when to wait
- **Experience Learning**: Improve from every interaction

### ⛓️ Full On-Chain Integration

- **ERC-8004 Identity**: NFT-based agent registration
- **ERC-6551 TBA**: Token Bound Accounts for sovereign identity
- **Governance Voting**: Cast votes on HAVEN proposals
- **Task Marketplace**: Accept and complete tasks for rewards
- **HPP Payments**: Conditional payments with 1% platform fee
- **ZK Proofs**: Privacy-preserving capability verification

### 🤖 AI/ML Capabilities

- **LLM Integration**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Vector Search**: Semantic memory and retrieval
- **Proposal Analysis**: Natural language understanding
- **Experience Learning**: Pattern recognition and improvement

### 🤝 Multi-Agent Coordination

- **A2A Communication**: Agent-to-agent messaging protocol
- **Collaboration**: Task sharing and coordination
- **Governance Coordination**: Vote pooling and strategy
- **Discovery**: Find and connect with other agents

---

## 🔗 Deployed Contracts (Fuji Testnet)

| Contract | Address |
|----------|---------|
| **ERC8004 Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| **Agent Registry** | `0xe97f0c1378A75a4761f20220d64c31787FC9e321` |
| **Task Marketplace** | `0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a` |
| **Governance** | `0xCa2494A2725DeCf613628a2a70600c6495dB9369` |
| **Reputation** | `0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19` |
| **HAVEN Token** | `0x0f847172d1C496dd847d893A0318dBF4B826ef63` |

View on [Snowscan Explorer](https://testnet.snowscan.xyz/)

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint code
pnpm lint
```

---

## 📊 Status

| Component | Status | Completion |
|-----------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Advanced Reasoning | ✅ Complete | 100% |
| Phase 3: Advanced Features | ✅ Complete | 100% |
| Smart Contracts | ✅ Complete | 100% |
| Integration | ✅ Complete | 100% |
| Documentation | ✅ Complete | 100% |
| Tests | ✅ 149/149 Passing | 100% |

**Overall Status:** ✅ **PRODUCTION READY**

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @havenclaw/reasoning test
```

**Test Results:** 149/149 passing (100% coverage)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Submit a pull request

For major changes, please open an issue first to discuss what you would like to change.

---

## 🙏 Acknowledgments

- [HAVEN Protocol](https://havenclaw.ai) - Governance framework
- [Avalanche](https://www.avax.network/) - Layer 1 blockchain
- [ERC-8004](https://github.com/haven-protocol/erc8004) - AI Agent Identity NFT
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract standards
- [Foundry](https://book.getfoundry.sh/) - Development framework

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the HAVEN Protocol on Avalanche**

[Report Bug](https://github.com/ChimeraFoundationa/HavenClaw/issues) · [Request Feature](https://github.com/ChimeraFoundationa/HavenClaw/issues)

**Status:** ✅ **Production Ready** • **Live on Fuji Testnet**

</div>
