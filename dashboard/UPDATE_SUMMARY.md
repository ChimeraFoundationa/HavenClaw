# Dashboard Update Summary

**Date:** March 9, 2026  
**Purpose:** Align dashboard with OpenClaw contract deployment

## Changes Made

### 1. Contract Addresses Updated (`lib/wagmi-config.ts`)

Updated contract addresses to match the OpenClaw deployment from `/root/soft/openclaw-agent/agent-config-fuji.yaml`:

| Contract | Old Address | New Address |
|----------|-------------|-------------|
| **AgentRegistry** | `0x58EcC...3201` | `0xe97f0c1378A75a4761f20220d64c31787FC9e321` |
| **AgentReputation** | `0x662Bd...0AaC` | `0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19` |
| **HavenGovernance** | `0x5355d...51c2` | `0xCa2494A2725DeCf613628a2a70600c6495dB9369` |
| **TaskMarketplace** | `0xC4Bb2...C543` | `0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a` |
| **ERC-8004 Registry** | `0x187A0...974C` | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

### 2. Contract ABIs Updated

Replaced simplified ABIs with full ABIs from `/root/soft/openclaw-agent/packages/contract-client/src/abi/`:

- **Registry.json** - Agent registration with TBA (Token Bound Account) support
- **TaskMarketplace.json** - Task marketplace with solver tracking
- **Governance.json** - Governance with block-based voting periods
- **Reputation.json** - Enhanced reputation with staking and voting metrics

### 3. Hook Updates (`hooks/useContracts.ts`)

#### `useReputation`
- Now returns full reputation object with all fields:
  - `score`, `tasksCompleted`, `tasksFailed`
  - `proposalsVoted`, `correctVotes`
  - `stakedAmount`, `unlockTime`, `lastUpdated`

#### `useOpenTasks`
- Updated to handle new task structure:
  - Added `solver`, `rewardToken`, `createdAt`
  - Changed `requiredCapabilities` → `requiredCapability` (single bytes32)
  - Added `resultURI`, `completedAt`

#### `useActiveProposals`
- Updated to handle new proposal structure:
  - Added `proposer`, `metadataURI`
  - Changed time-based to block-based (`startBlock`, `endBlock`)
  - Added `state`, `createdAt`, `capabilityHashes`

#### `useRegisterAgent`
- Added `tbaAddress` parameter (Token Bound Account address)
- Changed `capabilities` type to `0x${string}[]` (bytes32 hashes)

#### `useStake`
- Added `lockPeriod` parameter (required by new contract)

### 4. UI Updates (`app/page.tsx`)

- Updated reputation display to use `reputation.score` from full object
- Updated task display to handle new task structure
- Updated proposal display to handle block-based end times

### 5. Documentation Updates (`README.md`)

- Added contract integration section
- Documented all contract addresses
- Added ABI source references
- Updated architecture diagram

## Build Status

✅ **Build Successful**
```
✓ Compiled successfully
✓ TypeScript compilation passed
✓ Static pages generated
```

## Testing Recommendations

1. **Wallet Connection**
   - Connect MetaMask/wallet to Fuji testnet
   - Verify address displays correctly

2. **Agent Display**
   - Connect an agent wallet
   - Verify agent info loads from contract
   - Check reputation score displays

3. **Tasks**
   - Verify open tasks load (if any exist)
   - Check task details display correctly

4. **Proposals**
   - Verify active proposals load (if any exist)
   - Check proposal details and voting UI

## Network Configuration

Ensure wallet is connected to **Avalanche Fuji Testnet**:
- **Chain ID:** 43113
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Explorer:** `https://testnet.snowscan.xyz`

## Related Files

- `/root/soft/openclaw-agent/agent-config-fuji.yaml` - Source of truth for contract addresses
- `/root/soft/openclaw-agent/packages/contract-client/src/abi/` - Source of ABIs
- `/root/soft/contracts/` - Original contract source (may have different deployment)

## Notes

- The dashboard now uses the **OpenClaw** contract deployment (March 8, 2026)
- ERC-8004 integration is configured for AI agent identity
- HAVEN token address remains the same across deployments
- Some contracts from the original README may be from earlier test deployments
