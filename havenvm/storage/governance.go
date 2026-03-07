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

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	smath "github.com/ava-labs/avalanchego/utils/math"
)

// ============================================================================
// Proposal Storage Functions
// ============================================================================

// GetProposal retrieves a governance proposal from storage
func GetProposal(ctx context.Context, mu state.Immutable, proposalID ids.ID) (*Proposal, error) {
	key := ProposalKey(proposalID)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get proposal: %w", err)
	}

	proposal, err := UnmarshalProposal(val)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal proposal: %w", err)
	}

	return proposal, nil
}

// SetProposal stores a governance proposal
func SetProposal(ctx context.Context, mu state.Mutable, proposal *Proposal) error {
	if proposal == nil {
		return fmt.Errorf("proposal cannot be nil: %w", ErrInvalidInput)
	}

	key := ProposalKey(proposal.ID)
	data := proposal.Bytes()

	return mu.Insert(ctx, key, data)
}

// DeleteProposal removes a proposal from storage
func DeleteProposal(ctx context.Context, mu state.Mutable, proposalID ids.ID) error {
	key := ProposalKey(proposalID)
	return mu.Remove(ctx, key)
}

// ProposalExists checks if a proposal exists
func ProposalExists(ctx context.Context, mu state.Immutable, proposalID ids.ID) (bool, error) {
	key := ProposalKey(proposalID)
	_, err := mu.GetValue(ctx, key)

	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check proposal existence: %w", err)
	}

	return true, nil
}

// CreateProposal creates a new governance proposal
func CreateProposal(
	ctx context.Context,
	mu state.Mutable,
	proposalID ids.ID,
	proposer codec.Address,
	title string,
	description string,
	votingPeriod int64,
	timestamp int64,
) error {
	// 1. Validate inputs
	if len(title) == 0 || len(title) > 256 {
		return ErrInvalidInput
	}

	if len(description) == 0 || len(description) > 4096 {
		return ErrInvalidInput
	}

	if votingPeriod <= 0 {
		return ErrInvalidInput
	}

	// 2. Check proposer has stake (must be staked to create proposal)
	stake, err := GetStake(ctx, mu, proposer)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return ErrInsufficientStake
		}
		return fmt.Errorf("failed to get proposer stake: %w", err)
	}

	if stake.Amount == 0 {
		return ErrInsufficientStake
	}

	// 3. Create proposal record
	proposal := &Proposal{
		ID:           proposalID,
		Proposer:     proposer,
		Title:        title,
		Description:  description,
		ForVotes:     0,
		AgainstVotes: 0,
		VotingStart:  timestamp,
		VotingEnd:    timestamp + votingPeriod,
		Executed:     false,
		Status:       ProposalStatusActive,
	}

	// 4. Store proposal
	return SetProposal(ctx, mu, proposal)
}

// VoteOnProposal casts a vote on a proposal
func VoteOnProposal(
	ctx context.Context,
	mu state.Mutable,
	proposalID ids.ID,
	voter codec.Address,
	support bool,
	votingPower uint64,
	timestamp int64,
) error {
	// 1. Get proposal
	proposal, err := GetProposal(ctx, mu, proposalID)
	if err != nil {
		return fmt.Errorf("failed to get proposal: %w", err)
	}

	// 2. Validate proposal status
	if proposal.Status != ProposalStatusActive {
		return ErrProposalNotActive
	}

	// 3. Validate voting period
	if timestamp < proposal.VotingStart || timestamp > proposal.VotingEnd {
		return ErrVotingPeriodEnded
	}

	// 4. Check if voter already voted
	existingVote, err := GetVote(ctx, mu, voter, proposalID)
	if err == nil && existingVote != nil {
		return ErrAlreadyVoted
	}

	// 5. Validate voting power
	if votingPower == 0 {
		return ErrNoVotingPower
	}

	// 6. Update proposal vote counts
	if support {
		proposal.ForVotes, err = smath.Add(proposal.ForVotes, votingPower)
		if err != nil {
			return fmt.Errorf("for votes overflow: %w", err)
		}
	} else {
		proposal.AgainstVotes, err = smath.Add(proposal.AgainstVotes, votingPower)
		if err != nil {
			return fmt.Errorf("against votes overflow: %w", err)
		}
	}

	// 7. Store vote record
	vote := &Vote{
		Voter:       voter,
		ProposalID:  proposalID,
		Support:     support,
		VotingPower: votingPower,
		Timestamp:   timestamp,
	}

	if err := SetVote(ctx, mu, vote); err != nil {
		return fmt.Errorf("failed to store vote: %w", err)
	}

	// 8. Store updated proposal
	return SetProposal(ctx, mu, proposal)
}

// GetVote returns a vote record
func GetVote(ctx context.Context, mu state.Immutable, voter codec.Address, proposalID ids.ID) (*Vote, error) {
	key := VoteKey(voter, proposalID)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, err
	}

	vote, err := UnmarshalVote(val)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal vote: %w", err)
	}

	return vote, nil
}

// SetVote stores a vote record
func SetVote(ctx context.Context, mu state.Mutable, vote *Vote) error {
	if vote == nil {
		return fmt.Errorf("vote cannot be nil: %w", ErrInvalidInput)
	}

	key := VoteKey(vote.Voter, vote.ProposalID)
	data := vote.Bytes()

	return mu.Insert(ctx, key, data)
}

// GetVotingPower calculates voting power for an address
// Voting power = own stake + delegated stake
func GetVotingPower(ctx context.Context, mu state.Immutable, address codec.Address) (uint64, error) {
	// 1. Get own stake
	stake, err := GetStake(ctx, mu, address)
	if err != nil && !errors.Is(err, database.ErrNotFound) {
		return 0, fmt.Errorf("failed to get stake: %w", err)
	}

	votingPower := uint64(0)
	if stake != nil {
		votingPower = stake.Amount
	}

	// 2. Get delegated stake (stake delegated to this address)
	delegatedAmount, err := GetDelegatedAmount(ctx, mu, address)
	if err != nil && !errors.Is(err, database.ErrNotFound) {
		return 0, fmt.Errorf("failed to get delegated stake: %w", err)
	}

	votingPower, err = smath.Add(votingPower, delegatedAmount)
	if err != nil {
		return 0, fmt.Errorf("voting power overflow: %w", err)
	}

	return votingPower, nil
}

// ============================================================================
// Delegation Storage Functions
// ============================================================================

// GetDelegation retrieves delegation record for a delegator
func GetDelegation(ctx context.Context, mu state.Immutable, delegator codec.Address) (*Delegation, error) {
	key := DelegationKey(delegator)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, err
	}

	delegation, err := UnmarshalDelegation(val)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal delegation: %w", err)
	}

	return delegation, nil
}

// SetDelegation stores a delegation record
func SetDelegation(ctx context.Context, mu state.Mutable, delegation *Delegation) error {
	if delegation == nil {
		return fmt.Errorf("delegation cannot be nil: %w", ErrInvalidInput)
	}

	key := DelegationKey(delegation.Delegator)
	data := delegation.Bytes()

	return mu.Insert(ctx, key, data)
}

// DeleteDelegation removes a delegation record
func DeleteDelegation(ctx context.Context, mu state.Mutable, delegator codec.Address) error {
	key := DelegationKey(delegator)
	return mu.Remove(ctx, key)
}

// GetDelegatedAmount returns total stake delegated to an address
func GetDelegatedAmount(ctx context.Context, mu state.Immutable, delegatee codec.Address) (uint64, error) {
	// Key for delegated amount tracking
	key := append([]byte{0x0E}, delegatee[:]...) // DelegatedTo prefix
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return 0, nil
		}
		return 0, err
	}

	if len(val) < 8 {
		return 0, fmt.Errorf("invalid delegated amount data")
	}

	return binary.BigEndian.Uint64(val), nil
}

// SetDelegatedAmount updates the total delegated amount for a delegatee
func SetDelegatedAmount(ctx context.Context, mu state.Mutable, delegatee codec.Address, amount uint64) error {
	key := append([]byte{0x0E}, delegatee[:]...)
	return mu.Insert(ctx, key, binary.BigEndian.AppendUint64(nil, amount))
}

// DelegateStake delegates voting power to another address
func DelegateStake(
	ctx context.Context,
	mu state.Mutable,
	delegator codec.Address,
	delegatee codec.Address,
	timestamp int64,
) error {
	// 1. Get delegator's stake
	stake, err := GetStake(ctx, mu, delegator)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return ErrInsufficientStake
		}
		return fmt.Errorf("failed to get delegator stake: %w", err)
	}

	if stake.Amount == 0 {
		return ErrInsufficientStake
	}

	// 2. Check if already delegated
	existing, err := GetDelegation(ctx, mu, delegator)
	if err == nil && existing != nil {
		// Remove old delegation first
		oldDelegatee := existing.Delegatee
		if oldDelegatee != delegatee {
			// Update old delegatee's delegated amount
			oldAmount, _ := GetDelegatedAmount(ctx, mu, oldDelegatee)
			if oldAmount >= stake.Amount {
				oldAmount -= stake.Amount
				if err := SetDelegatedAmount(ctx, mu, oldDelegatee, oldAmount); err != nil {
					return fmt.Errorf("failed to update old delegatee: %w", err)
				}
			}
		}
	}

	// 3. Update stake record
	stake.DelegatedTo = delegatee
	if err := SetStake(ctx, mu, delegator, stake); err != nil {
		return fmt.Errorf("failed to update stake: %w", err)
	}

	// 4. Create delegation record
	delegation := &Delegation{
		Delegator:   delegator,
		Delegatee:   delegatee,
		Amount:      stake.Amount,
		DelegatedAt: timestamp,
	}

	// 5. Store delegation
	if err := SetDelegation(ctx, mu, delegation); err != nil {
		return fmt.Errorf("failed to store delegation: %w", err)
	}

	// 6. Update delegatee's delegated amount
	currentAmount, _ := GetDelegatedAmount(ctx, mu, delegatee)
	newAmount, err := smath.Add(currentAmount, stake.Amount)
	if err != nil {
		return fmt.Errorf("delegated amount overflow: %w", err)
	}

	return SetDelegatedAmount(ctx, mu, delegatee, newAmount)
}

// ============================================================================
// Stake Storage Functions
// ============================================================================

// GetStake retrieves stake record
func GetStake(ctx context.Context, mu state.Immutable, address codec.Address) (*Stake, error) {
	key := StakeKey(address)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, err
	}

	return UnmarshalStake(val)
}

// SetStake stores stake record
func SetStake(ctx context.Context, mu state.Mutable, address codec.Address, stake *Stake) error {
	if stake == nil {
		return fmt.Errorf("stake cannot be nil: %w", ErrInvalidStakeData)
	}

	key := StakeKey(address)
	data := stake.Bytes()

	return mu.Insert(ctx, key, data)
}

// Bytes serializes stake to binary
func (s *Stake) Bytes() []byte {
	p := codec.NewWriter(128, 256)

	p.PackAddress(s.Owner)
	p.PackUint64(s.Amount)
	p.PackInt64(s.StakedAt)
	p.PackInt64(s.UnlockAt)
	p.PackAddress(s.DelegatedTo)
	p.PackUint64(s.Rewards)

	return p.Bytes()
}

// UnmarshalStake deserializes stake from binary
func UnmarshalStake(b []byte) (*Stake, error) {
	if len(b) < 60 {
		return nil, fmt.Errorf("stake data too short: %w", ErrDeserialization)
	}

	s := &Stake{}
	p := codec.NewReader(b, 256)

	p.UnpackAddress(&s.Owner)
	s.Amount = p.UnpackUint64(true)
	s.StakedAt = p.UnpackInt64(true)
	s.UnlockAt = p.UnpackInt64(true)
	p.UnpackAddress(&s.DelegatedTo)
	s.Rewards = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return s, nil
}

// ============================================================================
// Serialization Functions
// ============================================================================

// Bytes serializes proposal to binary
func (p *Proposal) Bytes() []byte {
	packer := codec.NewWriter(512, 1024)

	// Fixed-size fields
	packer.PackID(p.ID)
	packer.PackAddress(p.Proposer)
	packer.PackUint64(p.ForVotes)
	packer.PackUint64(p.AgainstVotes)
	packer.PackInt64(p.VotingStart)
	packer.PackInt64(p.VotingEnd)
	packer.PackBool(p.Executed)
	packer.PackByte(uint8(p.Status))

	// Variable-size fields
	packer.PackString(p.Title)
	packer.PackString(p.Description)

	return packer.Bytes()
}

// UnmarshalProposal deserializes proposal from binary
func UnmarshalProposal(b []byte) (*Proposal, error) {
	if len(b) < 150 {
		return nil, fmt.Errorf("proposal data too short: %w", ErrDeserialization)
	}

	p := &Proposal{}
	packer := codec.NewReader(b, 1024)

	// Fixed-size fields
	packer.UnpackID(true, &p.ID)
	packer.UnpackAddress(&p.Proposer)
	p.ForVotes = packer.UnpackUint64(true)
	p.AgainstVotes = packer.UnpackUint64(true)
	p.VotingStart = packer.UnpackInt64(true)
	p.VotingEnd = packer.UnpackInt64(true)
	p.Executed = packer.UnpackBool()
	status := packer.UnpackByte()
	p.Status = ProposalStatus(status)

	// Variable-size fields
	p.Title = packer.UnpackString(true)
	p.Description = packer.UnpackString(true)

	if packer.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", packer.Err())
	}

	return p, nil
}

// Bytes serializes vote to binary
func (v *Vote) Bytes() []byte {
	packer := codec.NewWriter(128, 256)

	packer.PackAddress(v.Voter)
	packer.PackID(v.ProposalID)
	packer.PackBool(v.Support)
	packer.PackUint64(v.VotingPower)
	packer.PackInt64(v.Timestamp)

	return packer.Bytes()
}

// UnmarshalVote deserializes vote from binary
func UnmarshalVote(b []byte) (*Vote, error) {
	if len(b) < 60 {
		return nil, fmt.Errorf("vote data too short: %w", ErrDeserialization)
	}

	v := &Vote{}
	packer := codec.NewReader(b, 256)

	packer.UnpackAddress(&v.Voter)
	packer.UnpackID(true, &v.ProposalID)
	v.Support = packer.UnpackBool()
	v.VotingPower = packer.UnpackUint64(true)
	v.Timestamp = packer.UnpackInt64(true)

	if packer.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", packer.Err())
	}

	return v, nil
}

// Delegation represents a delegation of voting power
type Delegation struct {
	Delegator   codec.Address `json:"delegator"`
	Delegatee   codec.Address `json:"delegatee"`
	Amount      uint64        `json:"amount"`
	DelegatedAt int64         `json:"delegated_at"`
}

// Bytes serializes delegation to binary
func (d *Delegation) Bytes() []byte {
	packer := codec.NewWriter(128, 256)

	packer.PackAddress(d.Delegator)
	packer.PackAddress(d.Delegatee)
	packer.PackUint64(d.Amount)
	packer.PackInt64(d.DelegatedAt)

	return packer.Bytes()
}

// UnmarshalDelegation deserializes delegation from binary
func UnmarshalDelegation(b []byte) (*Delegation, error) {
	if len(b) < 60 {
		return nil, fmt.Errorf("delegation data too short: %w", ErrDeserialization)
	}

	d := &Delegation{}
	packer := codec.NewReader(b, 256)

	packer.UnpackAddress(&d.Delegator)
	packer.UnpackAddress(&d.Delegatee)
	d.Amount = packer.UnpackUint64(true)
	d.DelegatedAt = packer.UnpackInt64(true)

	if packer.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", packer.Err())
	}

	return d, nil
}

// IsActive returns true if proposal is in voting period
func (p *Proposal) IsActive(currentTime int64) bool {
	return p.Status == ProposalStatusActive && currentTime >= p.VotingStart && currentTime <= p.VotingEnd
}

// CanExecute returns true if proposal can be executed
func (p *Proposal) CanExecute(currentTime int64) bool {
	if p.Status != ProposalStatusActive || currentTime < p.VotingEnd {
		return false
	}

	totalVotes := p.ForVotes + p.AgainstVotes
	if totalVotes == 0 {
		return false
	}

	// Check if passed (67% approval)
	return p.ForVotes*100/totalVotes >= 67
}

// ProposalStatus String representation
func (s ProposalStatus) String() string {
	switch s {
	case ProposalStatusActive:
		return "Active"
	case ProposalStatusPassed:
		return "Passed"
	case ProposalStatusRejected:
		return "Rejected"
	case ProposalStatusExecuted:
		return "Executed"
	case ProposalStatusCancelled:
		return "Cancelled"
	default:
		return "Unknown"
	}
}
