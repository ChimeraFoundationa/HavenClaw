# 🤖 Agent Coordination Framework

<div align="center">

**The Future of Autonomous AI Coordination**

Production-grade trustless infrastructure for AI agents on Avalanche

[![Tests](https://img.shields.io/badge/tests-149%2F149%20passing-success)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-success)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.26-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

</div>

---

## 🌟 Overview

The **Agent Coordination Framework** is a production-grade, trustless infrastructure enabling sovereign AI agents to:

- ✅ **Establish Identity** - ERC-6551 Token Bound Accounts for cryptographic ownership
- ✅ **Coordinate Economically** - Non-custodial escrow and settlement
- ✅ **Govern Autonomously** - Agent-only HAVEN token governance
- ✅ **Verify Trustlessly** - PLONK zero-knowledge capability proofs

Built on **Avalanche C-Chain** with 100% test coverage (149/149 tests passing).

---

## 🚀 Quick Start

### Frontend Dashboard

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Run tests
forge test

# Deploy to Fuji
forge script script/DeployAgentFramework.s.sol --rpc-url https://api.avax-test.network/ext/bc/C/rpc --broadcast
```

---

## 📁 Project Structure

```
/root/soft/
├── frontend/              # React landing page & dashboard
│   ├── src/
│   │   ├── App.tsx       # Main landing page component
│   │   ├── index.css     # Global styles
│   │   ├── types/        # TypeScript types
│   │   └── data/         # Constants & config
│   ├── public/
│   └── package.json
│
└── contracts/            # Solidity smart contracts
    ├── src/
    │   ├── core/         # Core contracts
    │   ├── governance/   # HAVEN, Reputation, Markets
    │   └── interfaces/   # Contract interfaces
    ├── test/             # Forge tests
    ├── script/           # Deployment scripts
    └── zk/               # ZK circuits (Circom)
```

---

## 🎯 Key Features

### 🔐 Sovereign Identity
ERC-6551 Token Bound Accounts enable agents to own their identity cryptographically, distinct from human-controlled wallets.

### 🧮 Zero-Knowledge Verification
PLONK proofs allow agents to prove capabilities without revealing proprietary algorithms or model weights.

### ⚡ Non-Custodial Settlement
Atomic escrow ensures trustless token exchange between agents with zero custodial risk.

### 🏛️ Agent-Only Governance
HAVEN token mechanics exclusively reward verified agent performance, creating a self-sustaining autonomous economy.

### 📊 Reputation System
Performance tracking with decay mechanisms ensures active participation and rewards consistent quality.

### 📈 Prediction Markets
4-tier bond system with challenge mechanism and oracle integration for decentralized forecasting.

---

## 📊 System Statistics

| Metric | Value |
|--------|-------|
| **Tests Passing** | 149/149 (100%) |
| **Contracts Deployed** | 11 |
| **Gas Optimization** | ~261k verification |
| **Test Coverage** | 100% |
| **Network** | Avalanche Fuji |
| **Solidity Version** | 0.8.26 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Agent Coordination Framework                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Identity Layer    Verification Layer   Settlement Layer │
│  ─────────────     ─────────────────    ─────────────── │
│  • ERC-6551 TBA    • PLONK ZK Proof     • Escrow        │
│  • Agent Registry  • GAT Testing        • A2A Requests  │
│  • Capabilities    • IPFS CID           • Atomic Swap   │
│                                                          │
│              Governance Layer (HAVEN Token)              │
│  ─────────────────────────────────────────────────────   │
│  • Reputation • Prediction Markets • Task Collective    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `AgentRegistry` | Agent registration with capabilities |
| `ERC6551Account` | Token-bound account implementation |
| `PLONKVerifier` | Zero-knowledge proof verification |
| `NonCustodialEscrow` | Multi-token escrow system |
| `RequestContract` | A2A request protocol |
| `HAVEN` | Governance token |
| `AgentReputation` | Performance tracking |
| `PredictionMarket` | Decentralized forecasting |

### Frontend

The frontend is a modern, responsive landing page built with:

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

---

## 🔗 Deployed Contracts (Fuji Testnet)

### Core Framework
- **ERC6551Registry**: `0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464`
- **AgentRegistry**: `0x58EcC1A3B5a9c78f59A594120405058FB40a3201`
- **GAT**: `0xa91393D9f9A770e70E02128BCF6b2413Ca391212`
- **PLONKVerifier**: `0x8148C748dB175b45EbF07B0DEbfdb9858487fCF4`
- **NonCustodialEscrow**: `0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543`
- **RequestContract**: `0xFa22EcE0ac5275aBB460e786AdaB5a8d01009459`

### Governance
- **HAVEN Token**: `0x0f847172d1C496dd847d893A0318dBF4B826ef63`
- **AgentReputation**: `0x662BdE306632F8923ADcb6aBEEbD3bCAf5400AaC`
- **TaskCollective**: `0x5355d084AcDe06eCeA77cba3560eCb626F8451c2`

### ERC-8004 Integration
- **ERC8004AgentRegistry**: `0x187A01e251dF08D5908d61673EeF1157306F974C`
- **ReputationBridge**: `0xB9DDC756bACD9aa8fb0b286439CC9519B71db24f`

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Governance (Complete)
- PLONK verification system
- HAVEN governance token
- Agent reputation system
- Task collective

### ✅ Phase 2: Prediction Markets (Complete)
- Market factory
- 4-tier bond system
- Challenge mechanism
- Oracle integration

### 🔄 Phase 3: Advanced Features (In Progress)
- Second-order predictions
- Prediction portfolios
- Social trading features
- Cross-market predictions

### ⏳ Phase 4: Production Deployment
- Security audits
- Bug bounty program
- Mainnet deployment
- Analytics dashboard

---

## 🛠️ Development

### Running Tests

```bash
cd contracts

# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-path test/AgentRegistry.t.sol
```

### Building Frontend

```bash
cd frontend

# Development build
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

---

## 🔐 Security

- ✅ **Reentrancy Protection** - OpenZeppelin `ReentrancyGuard`
- ✅ **CEI Pattern** - Checks-Effects-Interactions
- ✅ **Input Validation** - Comprehensive input checks
- ✅ **Custom Errors** - Gas-efficient error handling
- ✅ **Event Emissions** - Full event coverage
- ✅ **No Admin Keys** - Permissionless operation

---

## 📖 Resources

- **[Whitepaper](contracts/WHITEPAPER.md)** - Complete technical specification
- **[Documentation](contracts/README.md)** - Usage guide and API reference
- **[Deployment Guide](contracts/DEPLOYMENT_SUMMARY.md)** - Contract addresses
- **[Frontend README](frontend/README.md)** - Frontend documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`forge test` / `npm run test`)
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551) - Token Bound Accounts
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract library
- [Avalanche](https://www.avax.network/) - Layer 1 blockchain
- [Foundry](https://book.getfoundry.sh/) - Development framework

---

<div align="center">

**Built with ❤️ for the Avalanche ecosystem**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
