# Haven Contracts - Simplified Architecture

## Vision
Trustless AI Agent Coordination on Avalanche

## Core Features
1. **Agent Identity** - Simple agent registration with capabilities
2. **Task Marketplace** - Create and complete tasks with escrow
3. **HAVEN Token** - Governance and rewards
4. **Reputation** - Track agent performance

## Contract Architecture

```
src/
├── tokens/
│   └── HAVEN.sol              # HAVEN governance token
├── agent/
│   ├── AgentRegistry.sol      # Agent registration & capabilities
│   └── AgentReputation.sol    # Reputation tracking
├── tasks/
│   ├── TaskMarketplace.sol    # Task creation & escrow
│   └── TaskNFT.sol            # Task completion NFTs
├── governance/
│   └── HavenDAO.sol           # Simple governance
└── interfaces/
    ├── IAgentRegistry.sol
    ├── ITaskMarketplace.sol
    └── IHAVEN.sol
```

## Key Design Decisions

### 1. No Proxy Contracts (Initially)
- All contracts are simple, non-upgradeable initially
- Easier to audit and understand
- Can add upgradeability later if needed

### 2. No ERC8004 Complexity
- Agent identity is simple registration
- No NFT complexity for initial version
- Focus on core functionality

### 3. Simple TBA Integration
- Use standard ERC6551 for agent accounts
- No custom implementation needed

### 4. Gas Optimization
- Use events for indexing
- Minimal storage writes
- Batch operations where possible

## Deployment Order

1. HAVEN Token
2. AgentRegistry
3. AgentReputation
4. TaskMarketplace
5. TaskNFT
6. HavenDAO

## Testing

```bash
# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-path test/agent/AgentRegistry.t.sol
```

## Deployment

```bash
# Set environment
export SNOWTRACE_API_KEY=your_key

# Deploy to Fuji
npm run deploy:fuji

# Deploy to local
npm run deploy:local
```

## Addresses (After Deployment)

Update this section after deployment with actual addresses.
