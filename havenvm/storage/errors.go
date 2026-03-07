// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package storage

import "errors"

// Storage errors
var (
	// Balance errors
	ErrInsufficientBalance  = errors.New("insufficient balance")
	ErrBalanceOverflow      = errors.New("balance overflow")
	ErrInvalidBalanceData   = errors.New("invalid balance data")

	// Agent errors
	ErrInvalidAgentData     = errors.New("invalid agent data")
	ErrAgentDataCorrupt     = errors.New("agent data corrupt")

	// Reputation errors
	ErrInvalidReputation    = errors.New("invalid reputation value")
	ErrReputationCorrupt    = errors.New("reputation data corrupt")

	// Task errors
	ErrInvalidTaskData        = errors.New("invalid task data")
	ErrTaskDataCorrupt        = errors.New("task data corrupt")
	ErrInsufficientBounty     = errors.New("insufficient bounty")
	ErrTaskAlreadyCompleted   = errors.New("task already completed")
	ErrTaskCreatorCannotSubmit = errors.New("task creator cannot submit")

	// Market errors
	ErrInvalidMarketData      = errors.New("invalid market data")
	ErrMarketDataCorrupt      = errors.New("market data corrupt")
	ErrResolutionTimeInPast   = errors.New("resolution time in past")
	ErrInvalidTier            = errors.New("invalid tier")
	ErrMarketNotReady         = errors.New("market not ready")
	ErrMarketAlreadyResolved  = errors.New("market already resolved")
	ErrInvalidOutcome         = errors.New("invalid outcome")
	ErrInvalidResolution      = errors.New("invalid resolution")

	// Stake errors
	ErrInvalidStakeData     = errors.New("invalid stake data")
	ErrStakeDataCorrupt     = errors.New("stake data corrupt")

	// Governance errors
	ErrInvalidInput         = errors.New("invalid input")
	ErrProposalNotActive    = errors.New("proposal not active")
	ErrAlreadyVoted         = errors.New("already voted")
	ErrNoVotingPower        = errors.New("no voting power")
	ErrVotingPeriodEnded    = errors.New("voting period ended")
	ErrInsufficientStake    = errors.New("insufficient stake")
	ErrOutputValueZero      = errors.New("output value zero")

	// General storage errors
	ErrKeyNotFound          = errors.New("key not found")
	ErrKeyAlreadyExists     = errors.New("key already exists")
	ErrInvalidKeyFormat     = errors.New("invalid key format")
	ErrDataCorruption       = errors.New("data corruption detected")
	ErrSerialization        = errors.New("serialization failed")
	ErrDeserialization      = errors.New("deserialization failed")
	ErrStorageQuotaExceeded = errors.New("storage quota exceeded")
	ErrNotImplemented       = errors.New("not implemented")
)
