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
	_ chain.Action = (*CreatePredictionMarket)(nil)
	_ chain.Action = (*PlaceBet)(nil)
	_ chain.Action = (*ResolvePrediction)(nil)
)

type CreatePredictionMarket struct {
	Description    string        `json:"description"`
	Outcomes       []string      `json:"outcomes"`
	ResolutionTime int64         `json:"resolution_time"`
	Oracle         codec.Address `json:"oracle"`
	Tier           uint8         `json:"tier"`
	BondAmount     uint64        `json:"bond_amount"`
}

func (*CreatePredictionMarket) GetTypeID() uint8 {
	return consts.CreatePredictionMarketID
}

func (c *CreatePredictionMarket) StateKeys(actor codec.Address, marketID ids.ID) state.Keys {
	return state.Keys{
		string(storage.MarketKey(marketID)): state.All,
		string(storage.BalanceKey(actor)): state.Read | state.Write,
	}
}

func (c *CreatePredictionMarket) Bytes() []byte {
	p := codec.NewWriter(1024, 4096)
	p.PackByte(consts.CreatePredictionMarketID)
	p.PackString(c.Description)
	p.PackUint64(uint64(len(c.Outcomes)))
	for _, outcome := range c.Outcomes {
		p.PackString(outcome)
	}
	p.PackInt64(c.ResolutionTime)
	p.PackAddress(c.Oracle)
	p.PackByte(c.Tier)
	p.PackUint64(c.BondAmount)
	return p.Bytes()
}

func UnmarshalCreatePredictionMarket(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.CreatePredictionMarketID {
		return nil, consts.ErrInvalidInput
	}

	c := &CreatePredictionMarket{}
	p := codec.NewReader(bytes[1:], 4096)

	c.Description = p.UnpackString(true)
	numOutcomes := p.UnpackUint64(true)
	c.Outcomes = make([]string, numOutcomes)
	for i := 0; i < int(numOutcomes); i++ {
		c.Outcomes[i] = p.UnpackString(true)
	}
	c.ResolutionTime = p.UnpackInt64(true)
	p.UnpackAddress(&c.Oracle)
	c.Tier = p.UnpackByte()
	c.BondAmount = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return c, nil
}

func (c *CreatePredictionMarket) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, marketID ids.ID) ([]byte, error) {
	if err := storage.CreateMarket(ctx, mu, marketID, actor, c.Description, c.Outcomes, c.ResolutionTime, c.Oracle, c.Tier, c.BondAmount, timestamp); err != nil {
		return nil, fmt.Errorf("failed to create market: %w", err)
	}

	result := &CreatePredictionMarketResult{
		MarketID:       marketID,
		Creator:        actor,
		Outcomes:       c.Outcomes,
		BondAmount:     c.BondAmount,
		Tier:           c.Tier,
		ResolutionTime: c.ResolutionTime,
	}
	return result.Bytes(), nil
}

func (*CreatePredictionMarket) ComputeUnits(chain.Rules) uint64 {
	return consts.CreatePredictionMarketComputeUnits
}

func (*CreatePredictionMarket) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type CreatePredictionMarketResult struct {
	MarketID       ids.ID        `json:"market_id"`
	Creator        codec.Address `json:"creator"`
	Outcomes       []string      `json:"outcomes"`
	BondAmount     uint64        `json:"bond_amount"`
	Tier           uint8         `json:"tier"`
	ResolutionTime int64         `json:"resolution_time"`
}

func (*CreatePredictionMarketResult) GetTypeID() uint8 {
	return consts.CreatePredictionMarketID
}

func (r *CreatePredictionMarketResult) Bytes() []byte {
	p := codec.NewWriter(512, 2048)
	p.PackByte(consts.CreatePredictionMarketID)
	p.PackID(r.MarketID)
	p.PackAddress(r.Creator)
	p.PackUint64(uint64(len(r.Outcomes)))
	for _, outcome := range r.Outcomes {
		p.PackString(outcome)
	}
	p.PackUint64(r.BondAmount)
	p.PackByte(r.Tier)
	p.PackInt64(r.ResolutionTime)
	return p.Bytes()
}

func UnmarshalCreatePredictionMarketResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.CreatePredictionMarketID {
		return nil, consts.ErrInvalidInput
	}

	r := &CreatePredictionMarketResult{}
	p := codec.NewReader(b[1:], 2048)

	p.UnpackID(true, &r.MarketID)
	p.UnpackAddress(&r.Creator)
	numOutcomes := p.UnpackUint64(true)
	r.Outcomes = make([]string, numOutcomes)
	for i := 0; i < int(numOutcomes); i++ {
		r.Outcomes[i] = p.UnpackString(true)
	}
	r.BondAmount = p.UnpackUint64(true)
	r.Tier = p.UnpackByte()
	r.ResolutionTime = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// PlaceBet Action
// ============================================================================

type PlaceBet struct {
	MarketID ids.ID `json:"market_id"`
	Outcome  string `json:"outcome"`
	Amount   uint64 `json:"amount"`
}

func (*PlaceBet) GetTypeID() uint8 {
	return consts.PlaceBetID
}

func (p *PlaceBet) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.MarketKey(p.MarketID)): state.Read,
		string(storage.BalanceKey(actor)):    state.Read | state.Write,
		string(storage.BetKey(p.MarketID, actor)): state.All,
	}
}

func (p *PlaceBet) Bytes() []byte {
	packer := codec.NewWriter(128, 512)
	packer.PackByte(consts.PlaceBetID)
	packer.PackID(p.MarketID)
	packer.PackString(p.Outcome)
	packer.PackUint64(p.Amount)
	return packer.Bytes()
}

func UnmarshalPlaceBet(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.PlaceBetID {
		return nil, consts.ErrInvalidInput
	}

	p := &PlaceBet{}
	packer := codec.NewReader(bytes[1:], 512)

	packer.UnpackID(true, &p.MarketID)
	p.Outcome = packer.UnpackString(true)
	p.Amount = packer.UnpackUint64(true)

	if packer.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", packer.Err())
	}

	return p, nil
}

func (p *PlaceBet) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if err := storage.PlaceBet(ctx, mu, p.MarketID, actor, p.Outcome, p.Amount, timestamp); err != nil {
		return nil, fmt.Errorf("failed to place bet: %w", err)
	}

	result := &PlaceBetResult{
		MarketID: p.MarketID,
		Bettor:   actor,
		Outcome:  p.Outcome,
		Amount:   p.Amount,
	}
	return result.Bytes(), nil
}

func (*PlaceBet) ComputeUnits(chain.Rules) uint64 {
	return consts.PlaceBetComputeUnits
}

func (*PlaceBet) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type PlaceBetResult struct {
	MarketID ids.ID        `json:"market_id"`
	Bettor   codec.Address `json:"bettor"`
	Outcome  string        `json:"outcome"`
	Amount   uint64        `json:"amount"`
}

func (*PlaceBetResult) GetTypeID() uint8 {
	return consts.PlaceBetID
}

func (r *PlaceBetResult) Bytes() []byte {
	p := codec.NewWriter(128, 256)
	p.PackByte(consts.PlaceBetID)
	p.PackID(r.MarketID)
	p.PackAddress(r.Bettor)
	p.PackString(r.Outcome)
	p.PackUint64(r.Amount)
	return p.Bytes()
}

func UnmarshalPlaceBetResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.PlaceBetID {
		return nil, consts.ErrInvalidInput
	}

	r := &PlaceBetResult{}
	p := codec.NewReader(b[1:], 256)

	p.UnpackID(true, &r.MarketID)
	p.UnpackAddress(&r.Bettor)
	r.Outcome = p.UnpackString(true)
	r.Amount = p.UnpackUint64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// ResolvePrediction Action
// ============================================================================

type ResolvePrediction struct {
	MarketID ids.ID `json:"market_id"`
	Outcome  string `json:"outcome"`
}

func (*ResolvePrediction) GetTypeID() uint8 {
	return consts.ResolvePredictionID
}

func (r *ResolvePrediction) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.MarketKey(r.MarketID)): state.Read | state.Write,
	}
}

func (r *ResolvePrediction) Bytes() []byte {
	p := codec.NewWriter(64, 256)
	p.PackByte(consts.ResolvePredictionID)
	p.PackID(r.MarketID)
	p.PackString(r.Outcome)
	return p.Bytes()
}

func UnmarshalResolvePrediction(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.ResolvePredictionID {
		return nil, consts.ErrInvalidInput
	}

	r := &ResolvePrediction{}
	p := codec.NewReader(bytes[1:], 256)

	p.UnpackID(true, &r.MarketID)
	r.Outcome = p.UnpackString(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

func (r *ResolvePrediction) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, _ ids.ID) ([]byte, error) {
	if err := storage.ResolveMarket(ctx, mu, r.MarketID, r.Outcome, timestamp); err != nil {
		return nil, fmt.Errorf("failed to resolve market: %w", err)
	}

	result := &ResolvePredictionResult{
		MarketID: r.MarketID,
		Outcome:  r.Outcome,
	}
	return result.Bytes(), nil
}

func (*ResolvePrediction) ComputeUnits(chain.Rules) uint64 {
	return consts.ResolvePredictionComputeUnits
}

func (*ResolvePrediction) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type ResolvePredictionResult struct {
	MarketID ids.ID `json:"market_id"`
	Outcome  string `json:"outcome"`
}

func (*ResolvePredictionResult) GetTypeID() uint8 {
	return consts.ResolvePredictionID
}

func (r *ResolvePredictionResult) Bytes() []byte {
	p := codec.NewWriter(64, 128)
	p.PackByte(consts.ResolvePredictionID)
	p.PackID(r.MarketID)
	p.PackString(r.Outcome)
	return p.Bytes()
}

func UnmarshalResolvePredictionResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.ResolvePredictionID {
		return nil, consts.ErrInvalidInput
	}

	r := &ResolvePredictionResult{}
	p := codec.NewReader(b[1:], 128)

	p.UnpackID(true, &r.MarketID)
	r.Outcome = p.UnpackString(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}
