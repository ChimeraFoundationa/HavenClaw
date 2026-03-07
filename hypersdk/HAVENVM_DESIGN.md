# 🏛️ HavenVM - Custom HyperSDK VM for Haven Framework

## 🎯 Visi

Membangun **HavenVM** - blockchain khusus untuk AI Agent Coordination menggunakan HyperSDK, yang mengimplementasikan:
- ERC-8004 Agent Identity
- ERC-6551 Token Bound Accounts
- HAVEN Token Governance
- Agent Reputation System
- Prediction Markets
- Non-Custodial Escrow
- Zero-Knowledge Capability Verification

---

## 🏗️ Arsitektur HavenVM

### Struktur Project
```
havenvm/
├── actions/
│   ├── agent_register.go      # Registrasi agent (ERC-8004 style)
│   ├── agent_update.go        # Update agent metadata/capabilities
│   ├── transfer.go            # Transfer HAVEN tokens
│   ├── create_task.go         # Create task dengan bounty
│   ├── submit_task.go         # Submit hasil task
│   ├── create_prediction.go   # Create prediction market
│   ├── place_bet.go           # Place bet pada prediction
│   ├── resolve_prediction.go  # Resolve prediction
│   ├── stake.go               # Stake HAVEN untuk governance
│   ├── delegate.go            # Delegate voting power
│   └── vote.go                # Vote proposal governance
│
├── auth/
│   ├── agent_auth.go          # Agent-specific authentication
│   ├── tba_auth.go            # Token Bound Account auth
│   └── multi_sig.go           # Multi-sig untuk governance
│
├── storage/
│   ├── agent_registry.go      # Agent registry storage
│   ├── balance.go             # HAVEN token balances
│   ├── reputation.go          # Agent reputation tracking
│   ├── prediction_market.go   # Prediction market storage
│   ├── task_registry.go       # Task registry storage
│   ├── governance.go          # Governance storage
│   └── escrow.go              # Escrow storage
│
├── state/
│   ├── agent_state.go         # Agent state management
│   ├── reputation_state.go    # Reputation state
│   └── governance_state.go    # Governance state
│
├── vm/
│   ├── vm.go                  # VM construction
│   ├── config.go              # VM configuration
│   └── options.go             # VM services/options
│
├── genesis/
│   └── genesis.go             # Genesis configuration
│
├── consts/
│   └── consts.go              # Constants (Name, Symbol, IDs)
│
├── cmd/
│   └── havenvm/               # VM binary
│
├── cli/
│   └── haven-cli/             # CLI untuk interaction
│
├── scripts/
│   ├── build.sh
│   ├── run.sh
│   └── tests.integration.sh
│
└── tests/
    ├── integration/
    └── e2e/
```

---

## 🔑 Actions Implementation

### 1. Agent Registration (ERC-8004 Style)

```go
package actions

import (
    "context"
    "github.com/ava-labs/hypersdk/chain"
    "github.com/ava-labs/hypersdk/codec"
    "github.com/ava-labs/hypersdk/state"
    "github.com/ava-labs/hypersdk/examples/havenvm/storage"
)

const AgentRegisterComputeUnits = 50

type AgentRegister struct {
    // NFT metadata URI (IPFS/data URI)
    MetadataURI string `json:"metadata_uri"`
    
    // Agent capabilities
    Capabilities []string `json:"capabilities"`
    
    // Owner address (will be linked to TBA)
    Owner codec.Address `json:"owner"`
    
    // Optional: NFT token ID if using existing NFT
    TokenID uint64 `json:"token_id"`
}

func (*AgentRegister) GetTypeID() uint8 {
    return consts.AgentRegisterID
}

func (a *AgentRegister) StateKeys(actor codec.Address, actionID ids.ID) state.Keys {
    return state.Keys{
        // Agent registry storage
        string(storage.AgentKey(actor)): state.All,
        // Reputation tracking
        string(storage.ReputationKey(actor)): state.Read | state.Write,
        // Fee collection
        string(storage.FeeCollectorKey()): state.Read | state.Write,
    }
}

func (a *AgentRegister) Execute(
    ctx context.Context,
    _ chain.Rules,
    mu state.Mutable,
    timestamp int64,
    actor codec.Address,
    actionID ids.ID,
) (codec.Typed, error) {
    // 1. Validate metadata URI
    if err := validateMetadataURI(a.MetadataURI); err != nil {
        return nil, err
    }
    
    // 2. Check if agent already registered
    if exists, _ := storage.AgentExists(ctx, mu, actor); exists {
        return nil, ErrAgentAlreadyRegistered
    }
    
    // 3. Create agent record
    agent := &storage.Agent{
        ID:           actionID,
        Owner:        a.Owner,
        MetadataURI:  a.MetadataURI,
        Capabilities: a.Capabilities,
        CreatedAt:    timestamp,
        Reputation:   0, // Initial reputation
        Verified:     false,
    }
    
    // 4. Store agent
    if err := storage.SetAgent(ctx, mu, actor, agent); err != nil {
        return nil, err
    }
    
    // 5. Initialize reputation
    if err := storage.InitializeReputation(ctx, mu, actor); err != nil {
        return nil, err
    }
    
    // 6. Emit event (via output)
    result := &AgentRegisterResult{
        AgentID:      actionID,
        AgentAddress: actor,
        Owner:        a.Owner,
        Timestamp:    timestamp,
    }
    
    return result, nil
}

func (*AgentRegister) ComputeUnits(chain.Rules) uint64 {
    return AgentRegisterComputeUnits
}

func (*AgentRegister) ValidRange(chain.Rules) (int64, int64) {
    return -1, -1 // Always valid
}

// Result type
type AgentRegisterResult struct {
    AgentID      ids.ID        `json:"agent_id"`
    AgentAddress codec.Address `json:"agent_address"`
    Owner        codec.Address `json:"owner"`
    Timestamp    int64         `json:"timestamp"`
}
```

### 2. Create Prediction Market

```go
type CreatePredictionMarket struct {
    // Market question/description
    Description string `json:"description"`
    
    // Possible outcomes (e.g., ["YES", "NO"])
    Outcomes []string `json:"outcomes"`
    
    // Resolution timestamp
    ResolutionTime int64 `json:"resolution_time"`
    
    // Oracle address (who can resolve)
    Oracle codec.Address `json:"oracle"`
    
    // Tier (1-4, determines bond requirements)
    Tier uint8 `json:"tier"`
    
    // Bond amount (in HAVEN)
    BondAmount uint64 `json:"bond_amount"`
}

func (c *CreatePredictionMarket) StateKeys(actor codec.Address, marketID ids.ID) state.Keys {
    return state.Keys{
        // Market storage
        string(storage.MarketKey(marketID)): state.All,
        // Creator reputation
        string(storage.ReputationKey(actor)): state.Read,
        // Bond escrow
        string(storage.BondKey(actor, marketID)): state.All,
    }
}

func (c *CreatePredictionMarket) Execute(
    ctx context.Context,
    rules chain.Rules,
    mu state.Mutable,
    timestamp int64,
    actor codec.Address,
    marketID ids.ID,
) (codec.Typed, error) {
    // 1. Validate resolution time
    if c.ResolutionTime <= timestamp {
        return nil, ErrResolutionTimeInPast
    }
    
    // 2. Validate tier
    if c.Tier < 1 || c.Tier > 4 {
        return nil, ErrInvalidTier
    }
    
    // 3. Check minimum bond for tier
    minBond := getMinBondForTier(c.Tier)
    if c.BondAmount < minBond {
        return nil, ErrInsufficientBond
    }
    
    // 4. Lock bond
    if err := storage.LockBond(ctx, mu, actor, marketID, c.BondAmount); err != nil {
        return nil, err
    }
    
    // 5. Create market
    market := &storage.PredictionMarket{
        ID:             marketID,
        Creator:        actor,
        Description:    c.Description,
        Outcomes:       c.Outcomes,
        ResolutionTime: c.ResolutionTime,
        Oracle:         c.Oracle,
        Tier:           c.Tier,
        Status:         storage.MarketStatusActive,
        CreatedAt:      timestamp,
    }
    
    if err := storage.SetMarket(ctx, mu, market); err != nil {
        return nil, err
    }
    
    return &CreatePredictionMarketResult{
        MarketID: marketID,
        Creator:  actor,
    }, nil
}
```

### 3. Submit Task with ZK Proof

```go
type SubmitTask struct {
    TaskID     ids.ID `json:"task_id"`
    Result     []byte `json:"result"`
    ZKProof    []byte `json:"zk_proof"` // PLONK proof
    PublicInputs []byte `json:"public_inputs"`
}

func (s *SubmitTask) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
    return state.Keys{
        string(storage.TaskKey(s.TaskID)): state.Read | state.Write,
        string(storage.ReputationKey(actor)): state.Read | state.Write,
        string(storage.BountyKey(s.TaskID)): state.Read | state.Write,
    }
}

func (s *SubmitTask) Execute(
    ctx context.Context,
    rules chain.Rules,
    mu state.Mutable,
    timestamp int64,
    actor codec.Address,
    actionID ids.ID,
) (codec.Typed, error) {
    // 1. Get task
    task, err := storage.GetTask(ctx, mu, s.TaskID)
    if err != nil {
        return nil, ErrTaskNotFound
    }
    
    // 2. Verify task not already completed
    if task.Status != storage.TaskStatusOpen {
        return nil, ErrTaskAlreadyCompleted
    }
    
    // 3. Verify ZK proof (if required)
    if task.RequireZKProof {
        if err := verifyZKProof(s.ZKProof, s.PublicInputs, task.ProofRequirements); err != nil {
            return nil, ErrInvalidProof
        }
    }
    
    // 4. Update task status
    task.Status = storage.TaskStatusCompleted
    task.CompletedBy = actor
    task.CompletedAt = timestamp
    task.Result = s.Result
    
    if err := storage.SetTask(ctx, mu, task); err != nil {
        return nil, err
    }
    
    // 5. Release bounty to submitter
    if err := storage.TransferBalance(ctx, mu, task.BountyEscrow, actor, task.BountyAmount); err != nil {
        return nil, err
    }
    
    // 6. Update reputation
    reputationBoost := calculateReputationBoost(task.Difficulty, task.RequireZKProof)
    if err := storage.AddReputation(ctx, mu, actor, reputationBoost); err != nil {
        return nil, err
    }
    
    return &SubmitTaskResult{
        TaskID:          s.TaskID,
        Submitter:       actor,
        ReputationBoost: reputationBoost,
    }, nil
}
```

---

## 🔐 Custom Auth: Token BoundAccount (TBA)

```go
package auth

import (
    "context"
    "github.com/ava-labs/hypersdk/chain"
    "github.com/ava-labs/hypersdk/codec"
    "github.com/ava-labs/hypersdk/crypto"
)

// TokenBoundAccount implements ERC-6551 style authentication
type TokenBoundAccount struct {
    // NFT contract address
    NFTContract codec.Address `json:"nft_contract"`
    
    // NFT token ID
    TokenID uint64 `json:"token_id"`
    
    // Chain ID
    ChainID uint32 `json:"chain_id"`
    
    // Signature from TBA controller
    Signature crypto.Signature `json:"signature"`
}

func (t *TokenBoundAccount) Actor() (codec.Address, error) {
    // Derive TBA address from NFT contract + token ID
    // This follows ERC-6551 deterministic address calculation
    return deriveTBAAddress(t.NFTContract, t.TokenID, t.ChainID)
}

func (t *TokenBoundAccount) Sponsor() (codec.Address, error) {
    // TBA can sponsor itself (holds its own assets)
    return t.Actor()
}

func (t *TokenBoundAccount) AsyncVerify(ctx context.Context) error {
    // Stateless signature verification
    // Can be parallelized across transactions
    return nil
}

func (t *TokenBoundAccount) Verify(
    ctx context.Context,
    mu state.Immutable,
    txBytes []byte,
) error {
    // Stateful verification
    // 1. Verify NFT exists
    // 2. Verify caller is TBA controller
    // 3. Verify signature
    
    tbaAddress, err := t.Actor()
    if err != nil {
        return err
    }
    
    // Get TBA controller from storage
    controller, err := storage.GetTBAController(ctx, mu, tbaAddress)
    if err != nil {
        return err
    }
    
    // Verify signature
    if !crypto.Verify(txBytes, controller, t.Signature) {
        return ErrInvalidSignature
    }
    
    return nil
}

func (t *TokenBoundAccount) ComputeUnits(chain.Rules) uint64 {
    return 10 // Base compute units for TBA auth
}
```

---

## 💰 HAVEN Token - Balance Handler

```go
package storage

import (
    "context"
    "github.com/ava-labs/hypersdk/chain"
    "github.com/ava-labs/hypersdk/codec"
    "github.com/ava-labs/hypersdk/state"
)

const HAVENSymbol = "HAVEN"

type BalanceHandler struct{}

func (*BalanceHandler) BalanceKey(actor codec.Address) []byte {
    return append([]byte("balance_"), actor[:]...)
}

func (*BalanceHandler) AddBalance(
    ctx context.Context,
    actor codec.Address,
    mu state.Mutable,
    amount uint64,
) error {
    key := h.BalanceKey(actor)
    balance, err := getBalance(ctx, mu, key)
    if err != nil {
        return err
    }
    newBalance, err := safemath.Add(balance, amount)
    if err != nil {
        return err
    }
    return setBalance(ctx, mu, key, newBalance)
}

func (*BalanceHandler) SubtractBalance(
    ctx context.Context,
    actor codec.Address,
    mu state.Mutable,
    amount uint64,
) error {
    key := h.BalanceKey(actor)
    balance, err := getBalance(ctx, mu, key)
    if err != nil {
        return err
    }
    newBalance, err := safemath.Sub(balance, amount)
    if err != nil {
        return ErrInsufficientBalance
    }
    return setBalance(ctx, mu, key, newBalance)
}

func (*BalanceHandler) GetBalance(
    ctx context.Context,
    actor codec.Address,
    mu state.Immutable,
) (uint64, error) {
    key := h.BalanceKey(actor)
    return getBalance(ctx, mu, key)
}
```

---

## ⚙️ VM Configuration

```go
package vm

import (
    "github.com/ava-labs/hypersdk/auth"
    "github.com/ava-labs/hypersdk/chain"
    "github.com/ava-labs/hypersdk/codec"
    "github.com/ava-labs/hypersdk/examples/havenvm/actions"
    "github.com/ava-labs/hypersdk/examples/havenvm/auth"
    "github.com/ava-labs/hypersdk/examples/havenvm/storage"
    "github.com/ava-labs/hypersdk/genesis"
    "github.com/ava-labs/hypersdk/state/metadata"
    "github.com/ava-labs/hypersdk/vm"
    "github.com/ava-labs/hypersdk/vm/defaultvm"
)

var (
    ActionParser *codec.TypeParser[chain.Action]
    AuthParser   *codec.TypeParser[chain.Auth]
    OutputParser *codec.TypeParser[codec.Typed]
)

func init() {
    ActionParser = codec.NewTypeParser[chain.Action]()
    AuthParser = codec.NewTypeParser[chain.Auth]()
    OutputParser = codec.NewTypeParser[codec.Typed]()
    
    // Register Actions (APPEND ONLY - order matters!)
    if err := errors.Join(
        ActionParser.Register(&actions.AgentRegister{}, actions.UnmarshalAgentRegister),
        ActionParser.Register(&actions.AgentUpdate{}, actions.UnmarshalAgentUpdate),
        ActionParser.Register(&actions.Transfer{}, actions.UnmarshalTransfer),
        ActionParser.Register(&actions.CreateTask{}, actions.UnmarshalCreateTask),
        ActionParser.Register(&actions.SubmitTask{}, actions.UnmarshalSubmitTask),
        ActionParser.Register(&actions.CreatePredictionMarket{}, actions.UnmarshalCreatePredictionMarket),
        ActionParser.Register(&actions.PlaceBet{}, actions.UnmarshalPlaceBet),
        ActionParser.Register(&actions.ResolvePrediction{}, actions.UnmarshalResolvePrediction),
        ActionParser.Register(&actions.Stake{}, actions.UnmarshalStake),
        ActionParser.Register(&actions.Delegate{}, actions.UnmarshalDelegate),
        ActionParser.Register(&actions.Vote{}, actions.UnmarshalVote),
    ); err != nil {
        panic(err)
    }
    
    // Register Auth modules
    if err := errors.Join(
        AuthParser.Register(&auth.ED25519{}, auth.UnmarshalED25519),
        AuthParser.Register(&auth.SECP256R1{}, auth.UnmarshalSECP256R1),
        AuthParser.Register(&auth.TokenBoundAccount{}, auth.UnmarshalTokenBoundAccount),
        AuthParser.Register(&auth.MultiSig{}, auth.UnmarshalMultiSig),
    ); err != nil {
        panic(err)
    }
}

func New(options ...vm.Option) (*vm.VM, error) {
    factory := NewFactory()
    return factory.New(options...)
}

func NewFactory() *vm.Factory {
    options := append(
        defaultvm.NewDefaultOptions(),
        WithHavenAPI(),      // Custom Haven API
        WithIndexer(),       // Transaction indexer
        WithEventNotifier(), // Event notifications
    )
    
    return vm.NewFactory(
        &genesis.DefaultGenesisFactory{},
        &storage.HAVENBalanceHandler{},
        metadata.NewDefaultManager(),
        ActionParser,
        AuthParser,
        OutputParser,
        auth.DefaultEngines(),
        options...,
    )
}
```

---

## 📜 Genesis Configuration

```json
{
  "stateBranchFactor": 16,
  "customAllocation": [
    {
      "address": "0x00c4cb545f748a28770042f893784ce85b107389004d6a0e0d6d7518eeae1292d9",
      "balance": 1000000000000000
    }
  ],
  "initialRules": {
    "minUnitPrice": {
      "bandwidth": 100,
      "compute": 100,
      "storageRead": 100,
      "storageAllocate": 100,
      "storageWrite": 100
    },
    "unitPriceChangeDenominator": {
      "bandwidth": 48,
      "compute": 48,
      "storageRead": 48,
      "storageAllocate": 48,
      "storageWrite": 48
    },
    "windowTargetUnits": {
      "bandwidth": 20000000,
      "compute": 1000,
      "storageRead": 1000,
      "storageAllocate": 1000,
      "storageWrite": 1000
    },
    "maxBlockUnits": {
      "bandwidth": 1800000,
      "compute": 2000,
      "storageRead": 2000,
      "storageAllocate": 2000,
      "storageWrite": 2000
    },
    "baseComputeUnits": 1,
    "storageKeyReadUnits": 5,
    "storageValueReadUnits": 2,
    "storageKeyAllocateUnits": 20,
    "storageValueAllocateUnits": 5,
    "storageKeyWriteUnits": 10,
    "storageValueWriteUnits": 3
  }
}
```

---

## 🎯 Custom Services

### 1. Haven API Service

```go
package vm

import (
    "github.com/ava-labs/hypersdk/api"
    "github.com/ava-labs/hypersdk/vm"
)

type HavenAPI struct {
    vm api.VM
}

func (h *HavenAPI) GetAgent(ctx context.Context, address codec.Address) (*AgentResponse, error) {
    // Query agent from state
}

func (h *HavenAPI) GetReputation(ctx context.Context, address codec.Address) (*ReputationResponse, error) {
    // Query reputation
}

func (h *HavenAPI) GetPredictionMarkets(ctx context.Context, status MarketStatus) ([]Market, error) {
    // Query prediction markets
}

func WithHavenAPI() vm.Option {
    return vm.NewOption(
        "havenAPI",
        HavenAPIConfig{Enabled: true},
        func(vm api.VM, config HavenAPIConfig) (vm.Opt, error) {
            if !config.Enabled {
                return vm.NewOpt(), nil
            }
            
            api := &HavenAPI{vm: vm}
            return vm.WithVMAPIs(
                api.NewHandlerFactory(),
            ), nil
        },
    )
}
```

### 2. Event Notification Service

```go
type EventNotifier struct {
    subscriptions map[EventType][]chan Event
}

func (e *EventNotifier) NotifyAgentRegistered(agent Agent) {
    e.send(EventAgentRegistered, agent)
}

func (e *EventNotifier) NotifyPredictionResolved(market PredictionMarket) {
    e.send(EventPredictionResolved, market)
}

func WithEventNotifier() vm.Option {
    return vm.NewOption(
        "eventNotifier",
        EventNotifierConfig{Enabled: true},
        func(vm api.VM, config EventNotifierConfig) (vm.Opt, error) {
            // Setup event subscription system
        },
    )
}
```

---

## 📊 Comparison: HavenVM vs Haven Smart Contracts

| Aspect | Haven Smart Contracts (EVM) | HavenVM (HyperSDK) |
|--------|----------------------------|-------------------|
| **Throughput** | ~100-500 tx/s (Avalanche C-Chain) | 10,000+ tx/s (parallel execution) |
| **Finality** | ~1-2 seconds | Sub-second |
| **Fees** | AVAX (gas) | HAVEN (multidimensional) |
| **State Storage** | Account-based (expensive) | MerkleDB (efficient) |
| **Customization** | Limited by EVM | Full control |
| **Agent Identity** | ERC-8004/ERC-6551 (contract) | Native (built-in) |
| **ZK Verification** | Expensive (~261k gas) | Native (compute units) |
| **Governance** | Token-based (contract) | Native (protocol-level) |

---

## 🚀 Implementation Roadmap

### Phase 1: Core VM (4-6 weeks)
- [ ] Setup project structure
- [ ] Implement HAVEN token (balance handler)
- [ ] Agent registration actions
- [ ] Basic transfer action
- [ ] Custom auth (ED25519, SECP256R1, TBA)
- [ ] VM construction & genesis

### Phase 2: Agent Features (4-6 weeks)
- [ ] Agent update actions
- [ ] Reputation system
- [ ] Task creation/submission
- [ ] ZK proof verification integration
- [ ] Haven API service

### Phase 3: Prediction Markets (4-6 weeks)
- [ ] Create prediction market action
- [ ] Place bet action
- [ ] Resolve prediction action
- [ ] Challenge mechanism
- [ ] Oracle integration

### Phase 4: Governance (4-6 weeks)
- [ ] Staking actions
- [ ] Delegation
- [ ] Voting mechanism
- [ ] Proposal system
- [ ] Multi-sig auth

### Phase 5: Testing & Deployment (4-6 weeks)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Testnet deployment
- [ ] Security audit
- [ ] Mainnet deployment

---

## 🔗 Integration dengan Existing Haven

HavenVM dapat berjalan paralel dengan existing Haven smart contracts:

```
┌─────────────────────────────────────────────────────────┐
│              Haven Ecosystem                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │  HavenVM        │         │  Existing Haven │       │
│  │  (HyperSDK)     │◄───────►│  (EVM Contracts)│       │
│  │                 │  Bridge │                 │       │
│  │  - High TPS     │         │  - Deployed     │       │
│  │  - Low fees     │         │  - Audited      │       │
│  │  - Native agent │         │  - Fuji/Mainnet │       │
│  └─────────────────┘         └─────────────────┘       │
│                                                          │
│              ┌─────────────────────────┐                │
│              │   Cross-Chain Bridge    │                │
│              │   - Asset Transfer      │                │
│              │   - Message Passing     │                │
│              └─────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Kesimpulan

**Ya, kita bisa membuat HavenVM dengan HyperSDK!**

### Keuntungan:
1. ✅ **Full Control** - Custom logic tanpa batasan EVM
2. ✅ **High Performance** - 10,000+ TPS dengan parallel execution
3. ✅ **Low Fees** - Multidimensional fees, efficient state management
4. ✅ **Native Features** - Agent identity, reputation, governance built-in
5. ✅ **Avalanche Integration** - Native support dari avalanchego

### Trade-offs:
1. ⚠️ **Development Time** - 20-30 weeks untuk full implementation
2. ⚠️ **Security Audit** - Perlu audit dari scratch (tidak seperti EVM)
3. ⚠️ **Ecosystem** - Tooling tidak selengkap EVM
4. ⚠️ **Adoption** - Perlu bridge untuk interoperability

### Rekomendasi:
Mulai dengan **hybrid approach**:
- Keep existing Haven contracts untuk production
- Build HavenVM untuk high-performance use cases
- Create bridge untuk interoperability
- Migrate gradually berdasarkan adoption

---

*Document created: March 6, 2026*
*Based on HyperSDK v0.0.1*
