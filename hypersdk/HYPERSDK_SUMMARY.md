# HyperSDK - Comprehensive Summary

## 🎯 Overview

**HyperSDK** is a high-performance, customizable framework for building blockchains on Avalanche, developed by Ava Labs. It provides opinionated abstractions that enable developers to create fast, scalable blockchains (called "hyperchains") without implementing low-level consensus or networking logic.

**Status**: ALPHA software - not safe for production use (as of repository clone date)

---

## 🏗️ Core Architecture

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                    HyperSDK Framework                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Actions    │  │    Auth      │  │    State     │  │
│  │  (Logic)     │  │  (Identity)  │  │  (Storage)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Fees (5D)  │  │  Consensus   │  │    VM        │  │
│  │  Multidim.   │  │  (Snowman)   │  │  Services    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Terminology

| Term | Definition |
|------|------------|
| **HyperSDK** | Framework for building high-performance blockchains |
| **HyperVM** | A blockchain VM built using HyperSDK |
| **Hyperchain** | A HyperVM deployed on Avalanche Network |

---

## 🔑 Key Features

### 1. **Actions** (Smallest Unit of Customization)
Actions define state transitions in the blockchain. Each action implements:

```go
Execute(
    ctx context.Context,
    r Rules,
    mu state.Mutable,
    timestamp int64,
    actor codec.Address,
    actionID ids.ID,
) (output codec.Typed, err error)
```

**Additional Requirements:**
- `ComputeUnits()` - Resource usage calculation
- `StateKeys()` - Pessimistic concurrency control (read/write/allocate permissions)
- `GetTypeID()` - Unique action identifier
- `ValidRange()` - Timestamp validity window

### 2. **Account Abstraction**
- **33-byte addressing scheme**: `<typeID><ids.ID>`
- **Actor** = Identity that participates in an Action
- **Sponsor** = Identity that pays fees
- Support for arbitrary transaction authorization logic
- Multiple Auth modules (ED25519, SECP256R1, BLS, custom)

### 3. **Efficient State Management**
- **MerkleDB**: Path-based merkelized radix tree (from avalanchego)
- **Dynamic State Sync**: Nodes sync to tip without executing all history
- **Block Pruning**: Only stores necessary data (configurable window)
- **Size-encoded storage keys**: Keys include chunk count suffix for fee estimation

### 4. **Parallel Transaction Execution**
- Transactions specify key access (read/write/allocate)
- Non-conflicting transactions executed in parallel
- Uses `executor` package for on-the-fly execution plans
- Configurable core count via `TransactionExecutionCores`

### 5. **Multidimensional Fee Pricing** (5 Dimensions)
| Dimension | Description |
|-----------|-------------|
| **Bandwidth** | Transaction data size |
| **Compute** | CPU cycles for execution |
| **Storage Read** | Reading from state |
| **Storage Allocate** | Creating new state |
| **Storage Write** | Modifying existing state |

**Benefits:**
- Independent price adjustment per resource
- Better resource utilization
- Accurate supply/demand reflection

**User Experience:**
- Single `Base.MaxFee` field (denominated in tokens)
- Only charged for actual usage
- No priority fees (FIFO ordering)

### 6. **Nonce-less & Expiring Transactions**
- No nonces = concurrent transactions from single account
- Expiry timestamp = temporary validity windows
- More efficient mempool management
- No replacement transaction broadcasting needed

### 7. **Deferred Root Generation**
- Blocks include **parent's post-execution state root** (not own root)
- Enables asynchronous merklization during consensus
- Reduces block verification time
- Supports dynamic state sync

### 8. **Proposer-Aware Gossip**
- Gossips transactions only to next few block proposers
- Uses Snowman++ lookahead logic
- Reduces unnecessary network traffic

---

## 📦 Example: MorpheusVM

**MorpheusVM** is the simplest HyperVM example - a single token transfer implementation.

### Structure
```
morpheusvm/
├── actions/
│   └── transfer.go      # Transfer action implementation
├── storage/
│   └── balance.go       # State helpers
├── vm/
│   └── vm.go            # VM construction
├── cmd/
│   └── morpheus-cli/    # CLI for interaction
└── tests/
    └── integration/     # Integration tests
```

### Transfer Action Example
```go
type Transfer struct {
    To    codec.Address `json:"to"`
    Value uint64        `json:"value"`
    Memo  []byte        `json:"memo"`
}

func (t *Transfer) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
    return state.Keys{
        string(storage.BalanceKey(actor)): state.Read | state.Write,
        string(storage.BalanceKey(t.To)):  state.All,
    }
}

func (t *Transfer) Execute(
    ctx context.Context,
    _ chain.Rules,
    mu state.Mutable,
    _ int64,
    actor codec.Address,
    _ ids.ID,
) ([]byte, error) {
    // 1. Verify invariants
    if t.Value == 0 {
        return nil, ErrOutputValueZero
    }
    
    // 2. Update state
    senderBalance, err := storage.SubBalance(ctx, mu, actor, t.Value)
    if err != nil {
        return nil, err
    }
    receiverBalance, err := storage.AddBalance(ctx, mu, t.To, t.Value)
    if err != nil {
        return nil, err
    }
    
    // 3. Return result
    return (&TransferResult{
        SenderBalance:   senderBalance,
        ReceiverBalance: receiverBalance,
    }).Bytes(), nil
}
```

### VM Construction
```go
func New(options ...vm.Option) (*vm.VM, error) {
    return vm.NewFactory(
        genesis.DefaultGenesisFactory{},
        &storage.BalanceHandler{},
        metadata.NewDefaultManager(),
        ActionParser,
        AuthParser,
        OutputParser,
        auth.DefaultEngines(),
        options..., // Services registered as options
    )
}
```

---

## 🔧 Services & Options

Services extend VM functionality and are registered as **Options**:

```go
func NewOption[T any](
    namespace string, 
    defaultConfig T, 
    optionFunc OptionFunc[T]
) Option { ... }
```

### Default Services
| Service | Description |
|---------|-------------|
| **Builder** | Block production |
| **Gossiper** | Transaction gossip |
| **Indexer** | Transaction indexing |
| **VM API** | Custom JSON-RPC APIs |
| **External Subscriber** | Event notifications |

### Configuration Example
```json
{
  "services": {
    "externalSubscriber": {
      "enabled": true,
      "serverAddress": "127.0.0.1:57201"
    }
  }
}
```

---

## 📊 Performance Features

### 1. **Parallel Signature Verification**
- `AsyncVerify()` for stateless verification
- Can run concurrently across transactions
- Batch verification support (Ed25519)

### 2. **Continuous Block Production**
- Produces blocks continuously (even if empty)
- `MinEmptyBlockGap` prevents excessive empty blocks
- Improves AWM verification cost
- Prevents fallback to leaderless production

### 3. **Action Batches**
- Multiple actions per transaction
- Atomic execution (all succeed or all fail)
- Arbitrary outputs per action

### 4. **Unified Metrics & Tracing**
- Integrated with avalanchego metrics
- Accessible via `/ext/metrics`
- Standard logging format
- Works with existing monitoring tools

---

## 🚀 Getting Started

### Build from Source
```bash
git clone https://github.com/ava-labs/hypersdk.git
cd hypersdk/examples/morpheusvm

# Build
./scripts/build.sh

# Run integration tests
./scripts/tests.integration.sh

# Start local network
./scripts/run.sh

# Stop network
./scripts/stop.sh
```

### CLI Interaction
```bash
# Build CLI
go build -o build/morpheus-cli cmd/morpheus-cli/*.go

# Import key
./build/morpheus-cli key import ed25519 demo.pk

# Import chain
./build/morpheus-cli chain import
# URI: http://127.0.0.1:9650/ext/bc/morpheusvm

# Check balance
./build/morpheus-cli key balance

# Transfer tokens
./build/morpheus-cli action transfer

# Watch blockchain
./build/morpheus-cli chain watch
```

### API Example
```bash
# Get network info
curl -X POST --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"hypersdk.network",
    "params":{}
}' -H 'content-type:application/json;' \
127.0.0.1:9650/ext/bc/morpheusvm/coreapi
```

---

## 📁 Repository Structure

| Directory | Purpose |
|-----------|---------|
| `abi/` | ABI definitions |
| `api/` | API interfaces |
| `auth/` | Authentication handlers |
| `chain/` | Core chain logic (transactions, blocks) |
| `codec/` | Encoding/decoding |
| `consts/` | Constants |
| `crypto/` | Cryptographic primitives |
| `event/` | Event handling |
| `fees/` | Fee management |
| `genesis/` | Genesis configuration |
| `keys/` | Key management |
| `proto/` | Protocol buffers |
| `pubsub/` | Pub/sub system |
| `state/` | State management (MerkleDB) |
| `storage/` | Storage layer |
| `tests/` | Test suites |
| `vm/` | Virtual machine core |
| `x/` | Experimental features |

---

## 🔒 Security Considerations

### Current Limitations
- ⚠️ **ALPHA software** - not production ready
- ⚠️ No security audits completed
- ⚠️ API not yet stabilized
- ⚠️ Under active development

### Built-in Security
- ✅ Nonce-less transactions prevent ordering attacks
- ✅ Transaction expiry limits replay window
- ✅ Multi-dimensional fees prevent resource exhaustion
- ✅ State keys enable concurrency control
- ✅ Custom error handling with gas-efficient patterns

---

## 🛣️ Roadmap

### Completed
- ✅ Core framework implementation
- ✅ Parallel execution engine
- ✅ Multidimensional fees
- ✅ MorpheusVM example
- ✅ Integration tests

### In Progress / Planned
- 🔄 Customizability options (swap MerkleDB, Firewood)
- 🔄 Chain/validator-driven actions
- 🔄 Enhanced monitoring tools
- 🔄 Security audits
- 🔄 API stabilization

---

## 🔗 Related Resources

- **GitHub**: https://github.com/ava-labs/hypersdk
- **Avalanche Docs**: https://docs.avax.network
- **MorpheusVM Tutorial**: `./docs/tutorials/morpheusvm/`
- **Contributing**: `./CONTRIBUTING.md`
- **Config Reference**: `./docs/reference/config.md`

---

## 💡 Key Takeaways

1. **Performance-First Design**: Every feature optimized for throughput and latency
2. **Developer Experience**: Simple abstractions hide complex internals
3. **Flexibility**: Customizable at every layer (Actions, Auth, Storage, Services)
4. **Avalanche Integration**: Native integration with avalanchego ecosystem
5. **Production Ready Components**: Uses battle-tested primitives (MerkleDB, Snowman consensus)

---

*Document generated from HyperSDK repository cloned on March 6, 2026*
*Status: ALPHA - Not for production use*
