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

var _ chain.Action = (*Transfer)(nil)

// Transfer transfers HAVEN tokens between addresses
type Transfer struct {
	// To is the recipient address
	To codec.Address `json:"to"`

	// Amount to transfer (in wei, 1 HAVEN = 10^18 wei)
	Value uint64 `json:"value"`

	// Optional memo (max 256 bytes)
	Memo []byte `json:"memo"`
}

func (*Transfer) GetTypeID() uint8 {
	return consts.TransferID
}

func (t *Transfer) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor)): state.Read | state.Write,
		string(storage.BalanceKey(t.To)):  state.All, // Allocate if new account
	}
}

func (t *Transfer) Bytes() []byte {
	p := codec.NewWriter(consts.MaxMemoSize+64, 1024)
	p.PackByte(consts.TransferID)
	p.PackAddress(t.To)
	p.PackUint64(t.Value)
	p.PackUint64(uint64(len(t.Memo)))
	p.PackFixedBytes(t.Memo)
	return p.Bytes()
}

func UnmarshalTransfer(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 {
		return nil, consts.ErrEmptyInput
	}
	if bytes[0] != consts.TransferID {
		return nil, fmt.Errorf("invalid type ID: %w", consts.ErrInvalidInput)
	}

	t := &Transfer{}
	p := codec.NewReader(bytes[1:], 1024)

	p.UnpackAddress(&t.To)
	t.Value = p.UnpackUint64(true)
	memoLen := p.UnpackUint64(true)
	t.Memo = make([]byte, memoLen)
	if memoLen > 0 {
		p.UnpackFixedBytes(int(memoLen), &t.Memo)
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return t, nil
}

func (t *Transfer) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	// ===== VALIDATION PHASE =====

	// 1. Validate value (must be positive)
	if t.Value == 0 {
		return nil, consts.ErrOutputValueZero
	}

	// 2. Validate recipient address
	if t.To == (codec.Address{}) {
		return nil, consts.ErrInvalidAddress
	}

	// 3. Prevent self-transfer (no-op)
	if t.To == actor {
		return nil, consts.ErrSelfTransfer
	}

	// 4. Validate memo size
	if len(t.Memo) > consts.MaxMemoSize {
		return nil, fmt.Errorf("memo too large (%d > %d): %w", len(t.Memo), consts.MaxMemoSize, consts.ErrMemoTooLarge)
	}

	// ===== EXECUTION PHASE =====

	// 5. Execute transfer atomically
	if err := storage.TransferBalance(ctx, mu, actor, t.To, t.Value); err != nil {
		return nil, fmt.Errorf("transfer failed: %w", err)
	}

	// 6. Get final balances for result
	senderBalance, err := storage.GetBalance(ctx, mu, actor)
	if err != nil {
		senderBalance = 0 // May not exist if balance is 0
	}

	receiverBalance, err := storage.GetBalance(ctx, mu, t.To)
	if err != nil {
		receiverBalance = 0
	}

	// 7. Return serialized result
	result := &TransferResult{
		From:            actor,
		To:              t.To,
		Amount:          t.Value,
		Memo:            t.Memo,
		SenderBalance:   senderBalance,
		ReceiverBalance: receiverBalance,
	}

	return result.Bytes(), nil
}

func (*Transfer) ComputeUnits(chain.Rules) uint64 {
	return consts.TransferComputeUnits
}

func (*Transfer) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1 // Always valid
}

// ============================================================================
// TransferResult
// ============================================================================

type TransferResult struct {
	From            codec.Address `json:"from"`
	To              codec.Address `json:"to"`
	Amount          uint64        `json:"amount"`
	Memo            []byte        `json:"memo"`
	SenderBalance   uint64        `json:"sender_balance"`
	ReceiverBalance uint64        `json:"receiver_balance"`
}

func (*TransferResult) GetTypeID() uint8 {
	return consts.TransferID
}

func (t *TransferResult) Bytes() []byte {
	p := codec.NewWriter(256, 512)
	p.PackByte(consts.TransferID)
	p.PackAddress(t.From)
	p.PackAddress(t.To)
	p.PackUint64(t.Amount)
	p.PackUint64(uint64(len(t.Memo)))
	p.PackFixedBytes(t.Memo)
	p.PackUint64(t.SenderBalance)
	p.PackUint64(t.ReceiverBalance)
	return p.Bytes()
}

func UnmarshalTransferResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 {
		return nil, consts.ErrEmptyInput
	}
	if b[0] != consts.TransferID {
		return nil, consts.ErrInvalidInput
	}

	r := &TransferResult{}
	p := codec.NewReader(b[1:], 512)

	p.UnpackAddress(&r.From)
	p.UnpackAddress(&r.To)
	r.Amount = p.UnpackUint64(true)
	memoLen := p.UnpackUint64(true)
	r.Memo = make([]byte, memoLen)
	if memoLen > 0 {
		p.UnpackFixedBytes(int(memoLen), &r.Memo)
	}
	r.SenderBalance = p.UnpackUint64(true)
	r.ReceiverBalance = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}
