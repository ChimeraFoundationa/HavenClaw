// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package consts

import (
	"time"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/version"
)

// VM Identity
const (
	Name   = "havenvm"
	Symbol = "HAVEN"
)

var ID ids.ID

func init() {
	b := make([]byte, ids.IDLen)
	copy(b, []byte(Name))
	vmID, err := ids.ToID(b)
	if err != nil {
		panic(err)
	}
	ID = vmID
}

var Version = &version.Semantic{
	Major: 0,
	Minor: 1,
	Patch: 0,
}

// Action TypeIDs - CRITICAL: MUST be appended only, order is immutable!
// Changing order will break consensus
const (
	AgentRegisterID uint8 = iota + 1 // 1
	AgentUpdateID                    // 2
	TransferID                       // 3
	CreateTaskID                     // 4
	SubmitTaskID                     // 5
	CreatePredictionMarketID         // 6
	PlaceBetID                       // 7
	ResolvePredictionID              // 8
	StakeID                          // 9
	VoteID                           // 10
	DelegateID                       // 11
	WithdrawStakeID                  // 12
)

// Auth TypeIDs - CRITICAL: MUST be appended only, order is immutable!
const (
	ED25519AuthID uint8 = iota + 1 // 1
	SECP256R1AuthID                // 2
	TokenBoundAccountAuthID        // 3
	MultiSigAuthID                 // 4
)

// Protocol Parameters - Production Values
const (
	// Timeouts
	DefaultValidityWindow     = 60 * time.Second // Transaction validity
	DefaultBlockValidity      = 10 * time.Second // Block inclusion timeout
	DefaultStakeLockPeriod    = 7 * 24 * time.Hour // 7 days
	DefaultVotingPeriod       = 3 * 24 * time.Hour // 3 days
	DefaultTaskMaxDuration    = 14 * 24 * time.Hour // 14 days
	DefaultMarketMaxResolution = 30 * 24 * time.Hour // 30 days

	// Size Limits
	MaxMetadataURILength  = 1024 // bytes
	MaxMemoSize           = 256  // bytes
	MaxDescriptionSize    = 4096 // bytes
	MaxCapabilities       = 100  // count
	MaxCapabilityLength   = 64   // bytes per capability
	MaxOutcomes           = 10   // prediction outcomes
	MaxOutcomeLength      = 128  // bytes per outcome
	MaxSigners            = 20   // multi-sig

	// Fee Parameters (Production)
	MinAgentRegistrationFee = 1_000_000_000_000 // 0.001 HAVEN
	MinPredictionBond       = 10_000_000_000_000 // 0.01 HAVEN
	MinStakeAmount          = 100_000_000_000_000 // 0.1 HAVEN
	MaxBetPerMarket         = 1_000_000_000_000_000 // 1 HAVEN

	// Reputation
	InitialReputation       = 0
	MinReputation           = -1_000_000
	MaxReputation           = 1_000_000
	ReputationDecayPerDay   = 1 // Daily decay
	InactivityDecayDays     = 30 // Days before decay starts

	// ZK Proof
	MaxProofSize          = 2048 // bytes
	MaxPublicInputsSize   = 1024 // bytes

	// Governance
	QuorumPercentage      = 10 // 10% of staked tokens
	PassThreshold         = 67 // 67% approval
	ProposalBond          = 1_000_000_000_000_000 // 1 HAVEN
)

// Compute Units (Production Calibrated)
const (
	AgentRegisterComputeUnits      = 100
	AgentUpdateComputeUnits        = 50
	TransferComputeUnits           = 10
	CreateTaskComputeUnits         = 75
	SubmitTaskComputeUnits         = 200
	CreatePredictionMarketComputeUnits = 150
	PlaceBetComputeUnits           = 25
	ResolvePredictionComputeUnits  = 100
	StakeComputeUnits              = 50
	VoteComputeUnits               = 30
	DelegateComputeUnits           = 40
	WithdrawStakeComputeUnits      = 35

	// Auth Compute Units
	ED25519AuthComputeUnits        = 10
	SECP256R1AuthComputeUnits      = 15
	TBAAuthComputeUnits            = 25
	MultiSigBaseComputeUnits       = 20
	MultiSigPerSignerUnits         = 5
)

// State Key Permissions
const (
	KeyRead       = 0b0001
	KeyWrite      = 0b0010
	KeyAllocate   = 0b0100
	KeyAll        = KeyRead | KeyWrite | KeyAllocate
)

// Event Topics (for indexing)
const (
	EventAgentRegistered     = "agent_registered"
	EventAgentUpdated        = "agent_updated"
	EventTransfer            = "transfer"
	EventTaskCreated         = "task_created"
	EventTaskCompleted       = "task_completed"
	EventMarketCreated       = "market_created"
	EventBetPlaced           = "bet_placed"
	EventMarketResolved      = "market_resolved"
	EventStaked              = "staked"
	EventWithdrawn           = "withdrawn"
	EventVoteCast            = "vote_cast"
	EventProposalCreated     = "proposal_created"
)
