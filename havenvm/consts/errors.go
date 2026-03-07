// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package consts

import "errors"

// HavenVM Errors - Categorized for production error handling
var (
	// === Agent Registration Errors (1000-1099) ===
	ErrAgentAlreadyRegistered    = errors.New("agent already registered")
	ErrAgentNotFound             = errors.New("agent not found")
	ErrInvalidMetadataURI        = errors.New("invalid metadata URI: must be valid IPFS or data URI")
	ErrUnauthorizedAgentUpdate   = errors.New("unauthorized: only agent owner can update")
	ErrTooManyCapabilities       = errors.New("too many capabilities")
	ErrCapabilityTooLong         = errors.New("capability string too long")
	ErrEmptyCapabilities         = errors.New("capabilities cannot be empty")
	ErrDuplicateCapability       = errors.New("duplicate capability")

	// === Token Transfer Errors (1100-1199) ===
	ErrInsufficientBalance       = errors.New("insufficient balance")
	ErrOutputValueZero           = errors.New("transfer value must be positive")
	ErrInvalidAddress            = errors.New("invalid address format")
	ErrSelfTransfer              = errors.New("cannot transfer to self")
	ErrMemoTooLarge              = errors.New("memo exceeds maximum size")

	// === Task Management Errors (1200-1299) ===
	ErrTaskNotFound              = errors.New("task not found")
	ErrTaskAlreadyCompleted      = errors.New("task already completed")
	ErrTaskExpired               = errors.New("task has expired")
	ErrTaskNotExpired            = errors.New("task has not expired yet")
	ErrInvalidTaskDuration       = errors.New("invalid task duration")
	ErrTaskCreatorCannotSubmit   = errors.New("task creator cannot submit own task")
	ErrInvalidProof              = errors.New("invalid zero-knowledge proof")
	ErrProofVerificationFailed   = errors.New("zero-knowledge proof verification failed")
	ErrProofRequirementsMismatch = errors.New("proof does not meet requirements")
	ErrInsufficientBounty        = errors.New("insufficient bounty amount")

	// === Prediction Market Errors (1300-1399) ===
	ErrMarketNotFound            = errors.New("prediction market not found")
	ErrMarketAlreadyResolved     = errors.New("market already resolved")
	ErrMarketNotReady            = errors.New("market not ready for bets")
	ErrInvalidOutcome            = errors.New("invalid outcome: not in market outcomes")
	ErrResolutionTimeInPast      = errors.New("resolution time cannot be in the past")
	ErrResolutionTimeTooFar      = errors.New("resolution time too far in future")
	ErrInvalidTier               = errors.New("invalid market tier: must be 1-4")
	ErrInsufficientBond          = errors.New("insufficient bond amount for tier")
	ErrBetTooLarge               = errors.New("bet amount exceeds maximum")
	ErrBetTooSmall               = errors.New("bet amount below minimum")
	ErrCannotBetOnOwnMarket      = errors.New("cannot bet on own market")
	ErrMarketNotOracle           = errors.New("only oracle can resolve this market")
	ErrInvalidResolution         = errors.New("invalid resolution outcome")

	// === Governance Errors (1400-1499) ===
	ErrInsufficientStake         = errors.New("insufficient stake amount")
	ErrStakeNotMatured           = errors.New("stake lock period not matured")
	ErrStakeAlreadyWithdrawn     = errors.New("stake already withdrawn")
	ErrProposalNotFound          = errors.New("proposal not found")
	ErrProposalAlreadyVoted      = errors.New("already voted on this proposal")
	ErrVotingPeriodEnded         = errors.New("voting period has ended")
	ErrVotingPeriodNotStarted    = errors.New("voting period has not started")
	ErrInsufficientVotingPower   = errors.New("insufficient voting power")
	ErrProposalNotPassed         = errors.New("proposal did not pass")
	ErrProposalAlreadyExecuted   = errors.New("proposal already executed")
	ErrInvalidProposalDuration   = errors.New("invalid proposal duration")
	ErrInsufficientQuorum        = errors.New("quorum not reached")
	ErrSelfDelegate              = errors.New("cannot delegate to self")
	ErrProposalNotActive         = errors.New("proposal not active")
	ErrAlreadyVoted              = errors.New("already voted on this proposal")
	ErrNoVotingPower             = errors.New("no voting power")

	// === Reputation Errors (1500-1599) ===
	ErrReputationNotFound        = errors.New("reputation record not found")
	ErrInvalidReputationChange   = errors.New("invalid reputation change")
	ErrReputationOverflow        = errors.New("reputation would overflow")
	ErrReputationUnderflow       = errors.New("reputation would underflow")

	// === Authentication Errors (1600-1699) ===
	ErrInvalidSignature          = errors.New("invalid signature")
	ErrUnauthorized              = errors.New("unauthorized access")
	ErrInvalidTBA                = errors.New("invalid token bound account")
	ErrTBANotFound               = errors.New("token bound account not found")
	ErrNFTNotOwned               = errors.New("NFT not owned by caller")
	ErrInvalidMultiSigThreshold  = errors.New("invalid multi-sig threshold")
	ErrInsufficientSignatures    = errors.New("insufficient signatures")
	ErrDuplicateSigner           = errors.New("duplicate signer address")
	ErrInvalidSignerOrder        = errors.New("signatures must be in sorted order")
	ErrReplayAttack              = errors.New("transaction replay detected")

	// === State & Storage Errors (1700-1799) ===
	ErrStateCorruption           = errors.New("state corruption detected")
	ErrKeyNotFound               = errors.New("key not found in storage")
	ErrKeyAlreadyExists          = errors.New("key already exists")
	ErrStorageQuotaExceeded      = errors.New("storage quota exceeded")
	ErrInvalidKeyFormat          = errors.New("invalid storage key format")
	ErrSerialization             = errors.New("serialization error")
	ErrDeserialization           = errors.New("deserialization error")

	// === Validation Errors (1800-1899) ===
	ErrInvalidInput              = errors.New("invalid input parameter")
	ErrEmptyInput                = errors.New("input cannot be empty")
	ErrInputTooLarge             = errors.New("input exceeds maximum size")
	ErrInvalidFormat             = errors.New("invalid input format")
	ErrOutOfRange                = errors.New("value out of valid range")
	ErrNegativeValue             = errors.New("value cannot be negative")
	ErrZeroValue                 = errors.New("value cannot be zero")

	// === Fee & Compute Errors (1900-1999) ===
	ErrInsufficientFee           = errors.New("insufficient transaction fee")
	ErrComputeLimitExceeded      = errors.New("compute limit exceeded")
	ErrFeeOverflow               = errors.New("fee calculation overflow")

	// === System Errors (2000-2099) ===
	ErrInternal                  = errors.New("internal error")
	ErrNotImplemented            = errors.New("not implemented")
	ErrDeprecated                = errors.New("functionality deprecated")
	ErrMaintenance               = errors.New("system under maintenance")
)

// IsAgentError checks if error is agent-related
func IsAgentError(err error) bool {
	return errors.Is(err, ErrAgentAlreadyRegistered) ||
		errors.Is(err, ErrAgentNotFound) ||
		errors.Is(err, ErrInvalidMetadataURI) ||
		errors.Is(err, ErrUnauthorizedAgentUpdate)
}

// IsAuthError checks if error is authentication-related
func IsAuthError(err error) bool {
	return errors.Is(err, ErrInvalidSignature) ||
		errors.Is(err, ErrUnauthorized) ||
		errors.Is(err, ErrInvalidTBA) ||
		errors.Is(err, ErrReplayAttack)
}

// IsStateError checks if error is state-related
func IsStateError(err error) bool {
	return errors.Is(err, ErrStateCorruption) ||
		errors.Is(err, ErrKeyNotFound) ||
		errors.Is(err, ErrSerialization) ||
		errors.Is(err, ErrDeserialization)
}
