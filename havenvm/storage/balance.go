// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package storage

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"

	"github.com/ava-labs/avalanchego/database"
	"github.com/ava-labs/avalanchego/ids"
	safemath "github.com/ava-labs/avalanchego/utils/math"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/consts"
	"github.com/ava-labs/hypersdk/state"
)

// Key prefixes for namespacing storage
const (
	balancePrefix byte = 0x3 // After hypersdk metadata prefixes
	agentPrefix   byte = 0x4
	reputationPrefix byte = 0x5
	taskPrefix    byte = 0x6
	marketPrefix  byte = 0x7
	stakePrefix   byte = 0x8
	bondPrefix    byte = 0x9
	proposalPrefix byte = 0xA
	votePrefix    byte = 0xB
	delegationPrefix byte = 0xC
	tbaPrefix     byte = 0xD
)

// BalanceChunks specifies how many chunks the balance key uses
const BalanceChunks uint16 = 1

// Agent represents a registered AI agent with full metadata
type Agent struct {
	ID           ids.ID        `json:"id"`
	Owner        codec.Address `json:"owner"`
	MetadataURI  string        `json:"metadata_uri"`
	Capabilities []string      `json:"capabilities"`
	CreatedAt    int64         `json:"created_at"`
	UpdatedAt    int64         `json:"updated_at"`
	Reputation   int64         `json:"reputation"`
	Verified     bool          `json:"verified"`
	TaskCount    uint32        `json:"task_count"`
	Earnings     uint64        `json:"earnings"`
}

// Reputation tracks agent performance with decay
type Reputation struct {
	Score           int64 `json:"score"`
	LastActivity    int64 `json:"last_activity"`
	TotalTasks      uint32 `json:"total_tasks"`
	CompletedTasks  uint32 `json:"completed_tasks"`
	FailedTasks     uint32 `json:"failed_tasks"`
	Streak          uint32 `json:"streak"` // Consecutive successful tasks
}

// Task represents a bounty task
type Task struct {
	ID                ids.ID        `json:"id"`
	Creator           codec.Address `json:"creator"`
	Description       string        `json:"description"`
	BountyAmount      uint64        `json:"bounty_amount"`
	RequireZKProof    bool          `json:"require_zk_proof"`
	ProofRequirements []byte        `json:"proof_requirements"`
	Deadline          int64         `json:"deadline"`
	Status            TaskStatus    `json:"status"`
	CompletedBy       codec.Address `json:"completed_by"`
	CompletedAt       int64         `json:"completed_at"`
	Result            []byte        `json:"result"`
	CreatedAt         int64         `json:"created_at"`
}

// TaskStatus represents task lifecycle
type TaskStatus uint8

const (
	TaskStatusOpen TaskStatus = iota
	TaskStatusInProgress
	TaskStatusCompleted
	TaskStatusExpired
	TaskStatusCancelled
)

// PredictionMarket represents a prediction market
type PredictionMarket struct {
	ID             ids.ID        `json:"id"`
	Creator        codec.Address `json:"creator"`
	Description    string        `json:"description"`
	Outcomes       []string      `json:"outcomes"`
	ResolutionTime int64         `json:"resolution_time"`
	Oracle         codec.Address `json:"oracle"`
	Tier           uint8         `json:"tier"`
	BondAmount     uint64        `json:"bond_amount"`
	Status         MarketStatus  `json:"status"`
	Resolution     string        `json:"resolution"`
	TotalBets      map[string]uint64 `json:"total_bets"` // outcome -> amount
	CreatedAt      int64         `json:"created_at"`
	ResolvedAt     int64         `json:"resolved_at"`
}

// MarketStatus represents market lifecycle
type MarketStatus uint8

const (
	MarketStatusActive MarketStatus = iota
	MarketStatusResolved
	MarketStatusCancelled
	MarketStatusChallenged
)

// Bet represents a bet on a prediction market
type Bet struct {
	MarketID  ids.ID        `json:"market_id"`
	Bettor    codec.Address `json:"bettor"`
	Outcome   string        `json:"outcome"`
	Amount    uint64        `json:"amount"`
	Timestamp int64         `json:"timestamp"`
}

// Stake represents staked HAVEN for governance
type Stake struct {
	Owner       codec.Address `json:"owner"`
	Amount      uint64        `json:"amount"`
	StakedAt    int64         `json:"staked_at"`
	UnlockAt    int64         `json:"unlock_at"`
	DelegatedTo codec.Address `json:"delegated_to"` // If delegated
	Rewards     uint64        `json:"rewards"`
}

// Proposal represents a governance proposal
type Proposal struct {
	ID          ids.ID        `json:"id"`
	Proposer    codec.Address `json:"proposer"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	ForVotes    uint64        `json:"for_votes"`
	AgainstVotes uint64       `json:"against_votes"`
	VotingStart int64         `json:"voting_start"`
	VotingEnd   int64         `json:"voting_end"`
	Executed    bool          `json:"executed"`
	Status      ProposalStatus `json:"status"`
}

// ProposalStatus represents proposal state
type ProposalStatus uint8

const (
	ProposalStatusActive ProposalStatus = iota
	ProposalStatusPassed
	ProposalStatusRejected
	ProposalStatusExecuted
	ProposalStatusCancelled
)

// Vote represents a governance vote
type Vote struct {
	Voter     codec.Address `json:"voter"`
	ProposalID ids.ID       `json:"proposal_id"`
	Support   bool          `json:"support"`
	VotingPower uint64      `json:"voting_power"`
	Timestamp int64         `json:"timestamp"`
}

// TokenBoundAccount represents ERC-6551 style account
type TokenBoundAccount struct {
	Address     codec.Address `json:"address"`
	NFTContract codec.Address `json:"nft_contract"`
	TokenID     uint64        `json:"token_id"`
	ChainID     uint32        `json:"chain_id"`
	Controller  codec.Address `json:"controller"`
	CreatedAt   int64         `json:"created_at"`
}

// ============================================================================
// Key Generation Functions
// ============================================================================

// BalanceKey returns the storage key for an address balance
func BalanceKey(address codec.Address) []byte {
	k := make([]byte, 1+codec.AddressLen+consts.Uint16Len)
	k[0] = balancePrefix
	copy(k[1:], address[:])
	binary.BigEndian.PutUint16(k[1+codec.AddressLen:], BalanceChunks)
	return k
}

// AgentKey returns the storage key for an agent
func AgentKey(address codec.Address) []byte {
	return append([]byte{agentPrefix}, address[:]...)
}

// ReputationKey returns the storage key for reputation
func ReputationKey(address codec.Address) []byte {
	return append([]byte{reputationPrefix}, address[:]...)
}

// TaskKey returns the storage key for a task
func TaskKey(taskID ids.ID) []byte {
	return append([]byte{taskPrefix}, taskID[:]...)
}

// MarketKey returns the storage key for a prediction market
func MarketKey(marketID ids.ID) []byte {
	return append([]byte{marketPrefix}, marketID[:]...)
}

// BetKey returns the storage key for a bet
func BetKey(marketID ids.ID, bettor codec.Address) []byte {
	key := append([]byte{bondPrefix}, marketID[:]...)
	return append(key, bettor[:]...)
}

// StakeKey returns the storage key for a stake
func StakeKey(address codec.Address) []byte {
	return append([]byte{stakePrefix}, address[:]...)
}

// BondKey returns the storage key for a bond
func BondKey(address codec.Address, marketID ids.ID) []byte {
	key := append([]byte{bondPrefix}, address[:]...)
	return append(key, marketID[:]...)
}

// ProposalKey returns the storage key for a proposal
func ProposalKey(proposalID ids.ID) []byte {
	return append([]byte{proposalPrefix}, proposalID[:]...)
}

// VoteKey returns the storage key for a vote
func VoteKey(voter codec.Address, proposalID ids.ID) []byte {
	key := append([]byte{votePrefix}, voter[:]...)
	return append(key, proposalID[:]...)
}

// DelegationKey returns the storage key for delegation
func DelegationKey(delegator codec.Address) []byte {
	return append([]byte{delegationPrefix}, delegator[:]...)
}

// TBAKey returns the storage key for a token bound account
func TBAKey(address codec.Address) []byte {
	return append([]byte{tbaPrefix}, address[:]...)
}

// ============================================================================
// Balance Handler - HAVEN Token Implementation
// ============================================================================

// HAVENBalanceHandler implements chain.BalanceHandler for HAVEN token
type HAVENBalanceHandler struct{}

// NewHAVENBalanceHandler creates a new balance handler
func NewHAVENBalanceHandler() *HAVENBalanceHandler {
	return &HAVENBalanceHandler{}
}

func (*HAVENBalanceHandler) BalanceKey(actor codec.Address) []byte {
	return BalanceKey(actor)
}

func (*HAVENBalanceHandler) AddBalance(
	ctx context.Context,
	actor codec.Address,
	mu state.Mutable,
	amount uint64,
) error {
	if amount == 0 {
		return nil // No-op for zero amounts
	}

	key := BalanceKey(actor)
	balance, err := getBalance(ctx, mu, key)
	if err != nil {
		return fmt.Errorf("failed to get balance: %w", err)
	}

	newBalance, err := safemath.Add(balance, amount)
	if err != nil {
		return fmt.Errorf("balance overflow: %w", err)
	}

	return setBalance(ctx, mu, key, newBalance)
}

func (*HAVENBalanceHandler) SubtractBalance(
	ctx context.Context,
	actor codec.Address,
	mu state.Mutable,
	amount uint64,
) error {
	if amount == 0 {
		return nil
	}

	key := BalanceKey(actor)
	balance, err := getBalance(ctx, mu, key)
	if err != nil {
		return fmt.Errorf("failed to get balance: %w", err)
	}

	if balance < amount {
		return fmt.Errorf("insufficient balance: have=%d, need=%d, %w", balance, amount, ErrInsufficientBalance)
	}

	newBalance := balance - amount
	return setBalance(ctx, mu, key, newBalance)
}

func (*HAVENBalanceHandler) GetBalance(
	ctx context.Context,
	actor codec.Address,
	mu state.Immutable,
) (uint64, error) {
	key := BalanceKey(actor)
	return getBalance(ctx, mu, key)
}

func (*HAVENBalanceHandler) CanDeduct(
	ctx context.Context,
	actor codec.Address,
	mu state.Immutable,
	amount uint64,
) error {
	balance, err := GetBalance(ctx, mu, actor)
	if err != nil {
		return err
	}
	if balance < amount {
		return ErrInsufficientBalance
	}
	return nil
}

func (h *HAVENBalanceHandler) Deduct(
	ctx context.Context,
	actor codec.Address,
	mu state.Mutable,
	amount uint64,
) error {
	return h.SubtractBalance(ctx, actor, mu, amount)
}

func (*HAVENBalanceHandler) SponsorStateKeys(addr codec.Address) state.Keys {
	return state.Keys{
		string(BalanceKey(addr)): state.Read | state.Write,
	}
}

// ============================================================================
// Balance Storage Functions
// ============================================================================

func getBalance(ctx context.Context, mu state.Immutable, key []byte) (uint64, error) {
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return 0, nil // Account doesn't exist yet
		}
		return 0, err
	}

	if len(val) < 8 {
		return 0, fmt.Errorf("invalid balance data: expected 8 bytes, got %d", len(val))
	}

	return binary.BigEndian.Uint64(val), nil
}

func setBalance(ctx context.Context, mu state.Mutable, key []byte, balance uint64) error {
	if balance == 0 {
		// Delete the key if balance is zero
		return mu.Remove(ctx, key)
	}
	return mu.Insert(ctx, key, binary.BigEndian.AppendUint64(nil, balance))
}

// TransferBalance transfers balance between addresses atomically
func TransferBalance(
	ctx context.Context,
	mu state.Mutable,
	from codec.Address,
	to codec.Address,
	amount uint64,
) error {
	if from == to {
		return nil
	}

	if amount == 0 {
		return nil
	}

	// Subtract from sender first (atomic - if this fails, nothing changes)
	fromKey := BalanceKey(from)
	fromBalance, err := getBalance(ctx, mu, fromKey)
	if err != nil {
		return fmt.Errorf("sender balance error: %w", err)
	}

	if fromBalance < amount {
		return fmt.Errorf("insufficient sender balance: %w", ErrInsufficientBalance)
	}

	newFromBalance := fromBalance - amount

	// Add to receiver
	toKey := BalanceKey(to)
	toBalance, err := getBalance(ctx, mu, toKey)
	if err != nil {
		return fmt.Errorf("receiver balance error: %w", err)
	}

	newToBalance, err := safemath.Add(toBalance, amount)
	if err != nil {
		return fmt.Errorf("receiver balance overflow: %w", err)
	}

	// Write both balances (state is mutable, so this is atomic within a tx)
	if err := setBalance(ctx, mu, fromKey, newFromBalance); err != nil {
		return fmt.Errorf("failed to update sender balance: %w", err)
	}

	if err := setBalance(ctx, mu, toKey, newToBalance); err != nil {
		return fmt.Errorf("failed to update receiver balance: %w", err)
	}

	return nil
}

// MintBalance creates new tokens (for genesis/testing only)
func MintBalance(
	ctx context.Context,
	mu state.Mutable,
	to codec.Address,
	amount uint64,
) error {
	key := BalanceKey(to)
	balance, err := getBalance(ctx, mu, key)
	if err != nil {
		return err
	}

	newBalance, err := safemath.Add(balance, amount)
	if err != nil {
		return fmt.Errorf("balance overflow: %w", err)
	}

	return setBalance(ctx, mu, key, newBalance)
}

// GetBalance returns the balance of an address
func GetBalance(ctx context.Context, mu state.Immutable, addr codec.Address) (uint64, error) {
	key := BalanceKey(addr)
	return getBalance(ctx, mu, key)
}

// Bytes serializes the agent to binary format
func (a *Agent) Bytes() []byte {
	p := codec.NewWriter(256, 4096)
	p.PackID(a.ID)
	p.PackAddress(a.Owner)
	p.PackString(a.MetadataURI)
	p.PackUint64(uint64(len(a.Capabilities)))
	for _, cap := range a.Capabilities {
		p.PackString(cap)
	}
	p.PackInt64(a.CreatedAt)
	p.PackInt64(a.UpdatedAt)
	p.PackInt64(a.Reputation)
	p.PackBool(a.Verified)
	p.PackUint64(uint64(a.TaskCount))
	p.PackUint64(a.Earnings)
	return p.Bytes()
}

// UnmarshalAgent deserializes an agent from binary
func UnmarshalAgent(b []byte) (*Agent, error) {
	if len(b) == 0 {
		return nil, ErrDeserialization
	}
	a := &Agent{}
	p := codec.NewReader(b, 4096)
	p.UnpackID(true, &a.ID)
	p.UnpackAddress(&a.Owner)
	a.MetadataURI = p.UnpackString(true)
	numCaps := p.UnpackUint64(true)
	a.Capabilities = make([]string, numCaps)
	for i := 0; i < int(numCaps); i++ {
		a.Capabilities[i] = p.UnpackString(true)
	}
	a.CreatedAt = p.UnpackInt64(true)
	a.UpdatedAt = p.UnpackInt64(true)
	a.Reputation = p.UnpackInt64(true)
	a.Verified = p.UnpackBool()
	taskCount := p.UnpackUint64(true)
	a.TaskCount = uint32(taskCount)
	a.Earnings = p.UnpackUint64(true)
	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}
	return a, nil
}

// Validate validates agent data
func (a *Agent) Validate() error {
	if a.ID == ids.Empty {
		return ErrInvalidAgentData
	}
	if a.Owner == (codec.Address{}) {
		return ErrInvalidAgentData
	}
	return nil
}
