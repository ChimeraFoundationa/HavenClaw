# HavenVM Build Instructions & Requirements

## ⚠️ Important: Go Version Requirement

**HavenVM requires Go 1.23.7 or higher** to be compatible with the local HyperSDK framework.

### Current System Status
- **Installed Go Version**: 1.21.6
- **Required Go Version**: 1.23.7+
- **HyperSDK Location**: `/root/soft/hypersdk`
- **HavenVM Location**: `/root/soft/havenvm`

---

## 🔧 Build Prerequisites

### Option 1: Install Go 1.23.7 (Recommended)

```bash
# Download Go 1.23.7
wget https://go.dev/dl/go1.23.7.linux-arm64.tar.gz

# Remove old version (optional)
sudo rm -rf /usr/local/go

# Install new version
sudo tar -C /usr/local -xzf go1.23.7.linux-arm64.tar.gz

# Verify installation
go version
# Should output: go version go1.23.7 linux/arm64
```

### Option 2: Use Go Toolchain (Automatic)

Add to `go.mod`:
```go
go 1.23.7

toolchain "go1.23.7"
```

Go will automatically download and use the specified version.

### Option 3: Use Docker (Alternative)

```bash
# Build using Docker
docker run --rm -v $(pwd):/havenvm -w /havenvm golang:1.23.7 go build ./...
```

---

## 📦 Dependencies

HavenVM uses the local HyperSDK installation via replace directive:

```go
replace github.com/ava-labs/hypersdk => ../hypersdk
```

### Required Dependencies (go.mod)
```go
module github.com/ava-labs/hypersdk/examples/havenvm

go 1.23.7

replace github.com/ava-labs/hypersdk => ../hypersdk

require (
	github.com/ava-labs/avalanchego v1.13.1-rc.0.0.20250414210208-c8b3f57d2a25
	github.com/ava-labs/hypersdk v0.0.0
	github.com/stretchr/testify v1.10.0
)
```

---

## 🏗️ Build Commands

### Full Build
```bash
cd /root/soft/havenvm
go build ./...
```

### Build VM Binary
```bash
go build -o bin/havenvm ./cmd/havenvm
```

### Run Tests
```bash
# Unit tests
go test ./tests/unit/... -v

# All tests
go test ./... -v
```

### Code Quality
```bash
# Format code
go fmt ./...

# Run vet
go vet ./...

# Run linter (if golangci-lint installed)
golangci-lint run
```

---

## 📁 Project Structure

```
havenvm/
├── actions/              # 12 action implementations ✅
│   ├── agent_register.go
│   ├── agent_update.go
│   ├── transfer.go
│   ├── task.go           # CreateTask, SubmitTask
│   ├── prediction.go     # CreatePredictionMarket, PlaceBet, ResolvePrediction
│   └── governance.go     # Stake, Vote, Delegate, WithdrawStake
│
├── auth/                 # Custom auth modules ✅
│   ├── tba_auth.go       # ERC-6551 Token Bound Account
│   └── multi_sig.go      # Multi-signature auth
│
├── storage/              # State management ✅
│   ├── balance.go        # HAVEN token + storage keys
│   ├── agent_registry.go # Agent CRUD + reputation
│   ├── task.go           # Task lifecycle
│   ├── prediction_market.go # Prediction markets
│   └── governance.go     # Proposals, votes, delegation
│
├── vm/                   # VM construction ✅
│   ├── vm.go             # Factory & registration
│   └── options.go        # Service options
│
├── genesis/              # Genesis configuration ✅
│   ├── genesis.go
│   └── rules.go
│
├── consts/               # Constants & errors ✅
│   ├── consts.go
│   └── errors.go
│
├── cmd/havenvm/          # VM binary entry point ✅
│   └── main.go
│
├── tests/unit/           # Unit tests ✅
│   └── actions_test.go   # 37 tests
│
├── scripts/              # Build scripts ✅
│   ├── build.sh
│   ├── tests.unit.sh
│   ├── tests.integration.sh
│   ├── run.sh
│   └── stop.sh
│
├── go.mod                # Go module definition
├── go.sum                # Dependency checksums
└── README.md             # Documentation
```

---

## ✅ Implementation Status

### Actions (12/12 - 100%)
| Action | Status | Tests |
|--------|--------|-------|
| AgentRegister | ✅ Complete | ✅ 9 tests |
| AgentUpdate | ✅ Complete | ⏳ TODO |
| Transfer | ✅ Complete | ✅ 4 tests |
| CreateTask | ✅ Complete | ⏳ TODO |
| SubmitTask | ✅ Complete | ⏳ TODO |
| CreatePredictionMarket | ✅ Complete | ⏳ TODO |
| PlaceBet | ✅ Complete | ⏳ TODO |
| ResolvePrediction | ✅ Complete | ⏳ TODO |
| Stake | ✅ Complete | ✅ 2 tests |
| Vote | ✅ Complete | ✅ 5 tests |
| Delegate | ✅ Complete | ✅ 6 tests |
| WithdrawStake | ✅ Complete | ✅ 2 tests |

**Total Tests**: 37 unit tests

### Storage (6 files - 100%)
- ✅ `balance.go` - HAVEN token + all storage keys
- ✅ `agent_registry.go` - Agent CRUD + reputation
- ✅ `task.go` - Task lifecycle with escrow
- ✅ `prediction_market.go` - Markets + bets
- ✅ `governance.go` - Proposals, votes, delegation

### Auth (4/4 - 100%)
- ✅ ED25519 (HyperSDK built-in)
- ✅ SECP256R1 (HyperSDK built-in)
- ✅ TokenBoundAccount (ERC-6551)
- ✅ MultiSig

---

## 🧪 Test Coverage

### Current Coverage
- **Total Tests**: 37
- **Actions Tested**: 6/12 (50%)
- **Coverage Estimate**: ~40%

### Test Breakdown
```
AgentRegister:  9 tests ✅
Transfer:       4 tests ✅
Stake:          2 tests ✅
Vote:           5 tests ✅
Delegate:       6 tests ✅
WithdrawStake:  2 tests ✅
Task:           0 tests ⏳
Prediction:     0 tests ⏳
AgentUpdate:    0 tests ⏳
```

### Running Tests
```bash
# Run all unit tests
go test ./tests/unit/... -v

# Run specific test
go test ./tests/unit/... -run TestVote_Execute_Success -v

# Run with coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

---

## 🚀 Quick Start (Once Go is Updated)

```bash
# Navigate to project
cd /root/soft/havenvm

# Download dependencies
go mod download

# Build
go build ./...

# Run tests
go test ./tests/unit/... -v

# Build VM binary
go build -o bin/havenvm ./cmd/havenvm

# Verify build
./bin/havenvm --version
```

---

## 🔍 Known Issues & Solutions

### Issue 1: Go Version Mismatch
**Error**: `module requires go >= 1.23.7 (running go 1.21.6)`

**Solution**: Install Go 1.23.7 (see Build Prerequisites above)

### Issue 2: Missing go.sum
**Error**: `missing go.sum entry`

**Solution**: 
```bash
go mod download
go mod tidy
```

### Issue 3: HyperSDK Not Found
**Error**: `module ../hypersdk: reading hypersdk/go.mod: no such file or directory`

**Solution**: Ensure HyperSDK is at `/root/soft/hypersdk` or update the replace directive in `go.mod`

### Issue 4: Network Timeout
**Error**: `go mod tidy` times out

**Solution**: Use local HyperSDK replace directive (already configured)

---

## 📊 Next Steps

### Immediate (Priority: HIGH)
1. ⏳ **Install Go 1.23.7** - Required for building
2. ⏳ **Run build** - Verify compilation
3. ⏳ **Run tests** - Verify 37 unit tests pass

### Short-term (Priority: MEDIUM)
1. ⏳ **Add more tests** - Target 90% coverage
2. ⏳ **Test Task actions** - CreateTask, SubmitTask
3. ⏳ **Test Prediction actions** - CreatePredictionMarket, PlaceBet, ResolvePrediction
4. ⏳ **Integration tests** - End-to-end testing

### Medium-term (Priority: LOW)
1. ⏳ **CLI implementation** - haven-cli tool
2. ⏳ **Local network testing** - Run single-node network
3. ⏳ **Fuji testnet deployment** - Testnet deployment
4. ⏳ **Security audit** - Pre-mainnet audit

---

## 📖 Reference Documentation

- **HyperSDK**: `/root/soft/hypersdk`
- **MorpheusVM Example**: `/root/soft/hypersdk/examples/morpheusvm`
- **HavenVM Design**: `/root/soft/hypersdk/HAVENVM_DESIGN.md`
- **Development Status**: `/root/soft/havenvm/DEVELOPMENT_STATUS.md`

---

## 🎯 Success Criteria

### Build Success
- [ ] `go build ./...` completes without errors
- [ ] VM binary created at `bin/havenvm`
- [ ] All imports resolve correctly

### Test Success
- [ ] All 37 unit tests pass
- [ ] No test failures or panics
- [ ] Code coverage > 40%

### Code Quality
- [ ] `go fmt ./...` passes
- [ ] `go vet ./...` passes
- [ ] No linting errors

---

*Created: March 6, 2026*
*Go Version Required: 1.23.7+*
*Status: Code Complete - Awaiting Go Update*
