// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package actions

import (
	"context"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/examples/havenvm/consts"
	"github.com/ava-labs/hypersdk/examples/havenvm/storage"
	"github.com/ava-labs/hypersdk/state"
)

var (
	_ chain.Action = (*Stake)(nil)
	_ chain.Action = (*Vote)(nil)
	_ chain.Action = (*Delegate)(nil)
	_ chain.Action = (*WithdrawStake)(nil)
)

// ============================================================================
// Stake Action
// ============================================================================

type Stake struct {
	Amount   uint64 `json:"amount"`
	Duration int64  `json:"duration"`
}

func (*Stake) GetTypeID() uint8 {
	return consts.StakeID
}

func (s *Stake) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor)): state.Read | state.Write,
		string(storage.StakeKey(actor)):   state.All,
	}
}

func (s *Stake) Bytes() []byte {
	p := codec.NewWriter(32, 64)
	p.PackByte(consts.StakeID)
	p.PackUint64(s.Amount)
	p.PackInt64(s.Duration)
	return p.Bytes()
}

func UnmarshalStake(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.StakeID {
		return nil, consts.ErrInvalidInput
	}

	s := &Stake{}
	p := codec.NewReader(bytes[1:], 64)

	s.Amount = p.UnpackUint64(true)
	s.Duration = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return s, nil
}

func (s *Stake) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	stakeKey := storage.StakeKey(actor)
	var stakeAddr codec.Address
	copy(stakeAddr[:], stakeKey[1:21])
	
	if err := storage.TransferBalance(ctx, mu, actor, stakeAddr, s.Amount); err != nil {
		return nil, fmt.Errorf("failed to stake: %w", err)
	}

	stake, _ := storage.GetStake(ctx, mu, actor)
	if stake == nil {
		stake = &storage.Stake{Owner: actor, Amount: 0, StakedAt: timestamp, UnlockAt: timestamp + s.Duration}
	}
	stake.Amount += s.Amount
	if timestamp+s.Duration > stake.UnlockAt {
		stake.UnlockAt = timestamp + s.Duration
	}
	if err := storage.SetStake(ctx, mu, actor, stake); err != nil {
		return nil, fmt.Errorf("failed to store stake: %w", err)
	}

	result := &StakeResult{Staker: actor, Amount: s.Amount, Duration: s.Duration, UnlockAt: stake.UnlockAt}
	return result.Bytes(), nil
}

func (*Stake) ComputeUnits(chain.Rules) uint64 {
	return consts.StakeComputeUnits
}

func (*Stake) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type StakeResult struct {
	Staker   codec.Address `json:"staker"`
	Amount   uint64        `json:"amount"`
	Duration int64         `json:"duration"`
	UnlockAt int64         `json:"unlock_at"`
}

func (*StakeResult) GetTypeID() uint8 {
	return consts.StakeID
}

func (r *StakeResult) Bytes() []byte {
	p := codec.NewWriter(64, 128)
	p.PackByte(consts.StakeID)
	p.PackAddress(r.Staker)
	p.PackUint64(r.Amount)
	p.PackInt64(r.Duration)
	p.PackInt64(r.UnlockAt)
	return p.Bytes()
}

func UnmarshalStakeResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.StakeID {
		return nil, consts.ErrInvalidInput
	}

	r := &StakeResult{}
	p := codec.NewReader(b[1:], 128)

	p.UnpackAddress(&r.Staker)
	r.Amount = p.UnpackUint64(true)
	r.Duration = p.UnpackInt64(true)
	r.UnlockAt = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// WithdrawStake Action
// ============================================================================

type WithdrawStake struct {
	Amount uint64 `json:"amount"`
}

func (*WithdrawStake) GetTypeID() uint8 {
	return consts.WithdrawStakeID
}

func (w *WithdrawStake) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.StakeKey(actor)):    state.Read | state.Write,
		string(storage.BalanceKey(actor)): state.Read | state.Write,
	}
}

func (w *WithdrawStake) Bytes() []byte {
	p := codec.NewWriter(16, 32)
	p.PackByte(consts.WithdrawStakeID)
	p.PackUint64(w.Amount)
	return p.Bytes()
}

func UnmarshalWithdrawStake(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.WithdrawStakeID {
		return nil, consts.ErrInvalidInput
	}

	w := &WithdrawStake{}
	p := codec.NewReader(bytes[1:], 32)

	w.Amount = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return w, nil
}

func (w *WithdrawStake) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	stake, err := storage.GetStake(ctx, mu, actor)
	if err != nil {
		return nil, consts.ErrInsufficientStake
	}
	if stake.Amount < w.Amount {
		return nil, consts.ErrInsufficientStake
	}
	if timestamp < stake.UnlockAt {
		return nil, consts.ErrStakeNotMatured
	}

	stake.Amount -= w.Amount
	if err := storage.SetStake(ctx, mu, actor, stake); err != nil {
		return nil, err
	}
	
	stakeKey := storage.StakeKey(actor)
	var stakeAddr codec.Address
	copy(stakeAddr[:], stakeKey[1:21])
	if err := storage.TransferBalance(ctx, mu, stakeAddr, actor, w.Amount); err != nil {
		return nil, err
	}

	result := &WithdrawStakeResult{Staker: actor, Amount: w.Amount}
	return result.Bytes(), nil
}

func (*WithdrawStake) ComputeUnits(chain.Rules) uint64 {
	return consts.WithdrawStakeComputeUnits
}

func (*WithdrawStake) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type WithdrawStakeResult struct {
	Staker codec.Address `json:"staker"`
	Amount uint64        `json:"amount"`
}

func (*WithdrawStakeResult) GetTypeID() uint8 {
	return consts.WithdrawStakeID
}

func (r *WithdrawStakeResult) Bytes() []byte {
	p := codec.NewWriter(48, 64)
	p.PackByte(consts.WithdrawStakeID)
	p.PackAddress(r.Staker)
	p.PackUint64(r.Amount)
	return p.Bytes()
}

func UnmarshalWithdrawStakeResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.WithdrawStakeID {
		return nil, consts.ErrInvalidInput
	}

	r := &WithdrawStakeResult{}
	p := codec.NewReader(b[1:], 64)

	p.UnpackAddress(&r.Staker)
	r.Amount = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// Vote Action
// ============================================================================

type Vote struct {
	ProposalID ids.ID `json:"proposal_id"`
	Support    bool   `json:"support"`
}

func (*Vote) GetTypeID() uint8 {
	return consts.VoteID
}

func (v *Vote) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.ProposalKey(v.ProposalID)):         state.Read | state.Write,
		string(storage.VoteKey(actor, v.ProposalID)): state.All,
	}
}

func (v *Vote) Bytes() []byte {
	p := codec.NewWriter(48, 64)
	p.PackByte(consts.VoteID)
	p.PackID(v.ProposalID)
	p.PackBool(v.Support)
	return p.Bytes()
}

func UnmarshalVote(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.VoteID {
		return nil, consts.ErrInvalidInput
	}

	v := &Vote{}
	p := codec.NewReader(bytes[1:], 64)

	p.UnpackID(true, &v.ProposalID)
	v.Support = p.UnpackBool()

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return v, nil
}

func (v *Vote) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	votingPower, err := storage.GetVotingPower(ctx, mu, actor)
	if err != nil || votingPower == 0 {
		return nil, consts.ErrNoVotingPower
	}

	if err := storage.VoteOnProposal(ctx, mu, v.ProposalID, actor, v.Support, votingPower, timestamp); err != nil {
		return nil, fmt.Errorf("failed to cast vote: %w", err)
	}

	result := &VoteResult{Voter: actor, ProposalID: v.ProposalID, Support: v.Support, VotingPower: votingPower}
	return result.Bytes(), nil
}

func (*Vote) ComputeUnits(chain.Rules) uint64 {
	return consts.VoteComputeUnits
}

func (*Vote) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type VoteResult struct {
	Voter       codec.Address `json:"voter"`
	ProposalID  ids.ID        `json:"proposal_id"`
	Support     bool          `json:"support"`
	VotingPower uint64        `json:"voting_power"`
}

func (*VoteResult) GetTypeID() uint8 {
	return consts.VoteID
}

func (r *VoteResult) Bytes() []byte {
	p := codec.NewWriter(64, 128)
	p.PackByte(consts.VoteID)
	p.PackAddress(r.Voter)
	p.PackID(r.ProposalID)
	p.PackBool(r.Support)
	p.PackUint64(r.VotingPower)
	return p.Bytes()
}

func UnmarshalVoteResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.VoteID {
		return nil, consts.ErrInvalidInput
	}

	r := &VoteResult{}
	p := codec.NewReader(b[1:], 128)

	p.UnpackAddress(&r.Voter)
	p.UnpackID(true, &r.ProposalID)
	r.Support = p.UnpackBool()
	r.VotingPower = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// Delegate Action
// ============================================================================

type Delegate struct {
	To codec.Address `json:"to"`
}

func (*Delegate) GetTypeID() uint8 {
	return consts.DelegateID
}

func (d *Delegate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.DelegationKey(actor)): state.All,
		string(storage.StakeKey(d.To)):   state.Read,
	}
}

func (d *Delegate) Bytes() []byte {
	p := codec.NewWriter(48, 64)
	p.PackByte(consts.DelegateID)
	p.PackAddress(d.To)
	return p.Bytes()
}

func UnmarshalDelegate(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.DelegateID {
		return nil, consts.ErrInvalidInput
	}

	d := &Delegate{}
	p := codec.NewReader(bytes[1:], 64)

	p.UnpackAddress(&d.To)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return d, nil
}

func (d *Delegate) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if err := storage.DelegateStake(ctx, mu, actor, d.To, timestamp); err != nil {
		return nil, fmt.Errorf("failed to delegate: %w", err)
	}

	result := &DelegateResult{Delegator: actor, Delegatee: d.To}
	return result.Bytes(), nil
}

func (*Delegate) ComputeUnits(chain.Rules) uint64 {
	return consts.DelegateComputeUnits
}

func (*Delegate) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type DelegateResult struct {
	Delegator codec.Address `json:"delegator"`
	Delegatee codec.Address `json:"delegatee"`
}

func (*DelegateResult) GetTypeID() uint8 {
	return consts.DelegateID
}

func (r *DelegateResult) Bytes() []byte {
	p := codec.NewWriter(64, 128)
	p.PackByte(consts.DelegateID)
	p.PackAddress(r.Delegator)
	p.PackAddress(r.Delegatee)
	return p.Bytes()
}

func UnmarshalDelegateResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.DelegateID {
		return nil, consts.ErrInvalidInput
	}

	r := &DelegateResult{}
	p := codec.NewReader(b[1:], 128)

	p.UnpackAddress(&r.Delegator)
	p.UnpackAddress(&r.Delegatee)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}
