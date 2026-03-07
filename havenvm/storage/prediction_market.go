// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package storage

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"sort"

	"github.com/ava-labs/avalanchego/database"
	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	smath "github.com/ava-labs/avalanchego/utils/math"
)

// ============================================================================
// Prediction Market Storage Functions
// ============================================================================

// GetMarket retrieves a prediction market from storage
func GetMarket(ctx context.Context, mu state.Immutable, marketID ids.ID) (*PredictionMarket, error) {
	key := MarketKey(marketID)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get market: %w", err)
	}

	market, err := UnmarshalMarket(val)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal market: %w", err)
	}

	return market, nil
}

// SetMarket stores a prediction market with validation
func SetMarket(ctx context.Context, mu state.Mutable, market *PredictionMarket) error {
	if market == nil {
		return fmt.Errorf("market cannot be nil: %w", ErrInvalidMarketData)
	}

	if err := market.Validate(); err != nil {
		return fmt.Errorf("invalid market: %w", err)
	}

	key := MarketKey(market.ID)
	data := market.Bytes()

	return mu.Insert(ctx, key, data)
}

// DeleteMarket removes a market from storage
func DeleteMarket(ctx context.Context, mu state.Mutable, marketID ids.ID) error {
	key := MarketKey(marketID)
	return mu.Remove(ctx, key)
}

// MarketExists checks if a market exists
func MarketExists(ctx context.Context, mu state.Immutable, marketID ids.ID) (bool, error) {
	key := MarketKey(marketID)
	_, err := mu.GetValue(ctx, key)

	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check market existence: %w", err)
	}

	return true, nil
}

// CreateMarket creates a new prediction market with bond
func CreateMarket(
	ctx context.Context,
	mu state.Mutable,
	marketID ids.ID,
	creator codec.Address,
	description string,
	outcomes []string,
	resolutionTime int64,
	oracle codec.Address,
	tier uint8,
	bondAmount uint64,
	timestamp int64,
) error {
	// 1. Validate inputs
	if err := validateOutcomes(outcomes); err != nil {
		return err
	}

	if resolutionTime <= timestamp {
		return ErrResolutionTimeInPast
	}

	if tier < 1 || tier > 4 {
		return ErrInvalidTier
	}

	// 2. Lock bond from creator - use bond escrow key
	bondKey := BondKey(creator, marketID)
	// Transfer to bond escrow (stored under bondKey)
	fromKey := BalanceKey(creator)
	fromBalance, err := getBalance(ctx, mu, fromKey)
	if err != nil {
		return fmt.Errorf("failed to get creator balance: %w", err)
	}
	if fromBalance < bondAmount {
		return fmt.Errorf("insufficient creator balance: %w", ErrInsufficientBalance)
	}
	newFromBalance := fromBalance - bondAmount
	if err := setBalance(ctx, mu, fromKey, newFromBalance); err != nil {
		return fmt.Errorf("failed to update creator balance: %w", err)
	}
	// Store bond in escrow
	if err := setBalance(ctx, mu, bondKey, bondAmount); err != nil {
		return fmt.Errorf("failed to store bond: %w", err)
	}

	// 3. Create market record
	market := &PredictionMarket{
		ID:             marketID,
		Creator:        creator,
		Description:    description,
		Outcomes:       make([]string, len(outcomes)),
		ResolutionTime: resolutionTime,
		Oracle:         oracle,
		Tier:           tier,
		BondAmount:     bondAmount,
		Status:         MarketStatusActive,
		Resolution:     "",
		TotalBets:      make(map[string]uint64),
		CreatedAt:      timestamp,
		ResolvedAt:     0,
	}
	copy(market.Outcomes, outcomes)

	// 4. Initialize bet totals for each outcome
	for _, outcome := range outcomes {
		market.TotalBets[outcome] = 0
	}

	// 5. Store market
	return SetMarket(ctx, mu, market)
}

// PlaceBet places a bet on a market outcome
func PlaceBet(
	ctx context.Context,
	mu state.Mutable,
	marketID ids.ID,
	bettor codec.Address,
	outcome string,
	amount uint64,
	timestamp int64,
) error {
	// 1. Get market
	market, err := GetMarket(ctx, mu, marketID)
	if err != nil {
		return fmt.Errorf("failed to get market: %w", err)
	}

	// 2. Validate market status
	if market.Status != MarketStatusActive {
		return ErrMarketNotReady
	}

	// 3. Validate outcome
	validOutcome := false
	for _, o := range market.Outcomes {
		if o == outcome {
			validOutcome = true
			break
		}
	}
	if !validOutcome {
		return ErrInvalidOutcome
	}

	// 4. Validate bet amount
	if amount == 0 {
		return ErrOutputValueZero
	}

	// 5. Lock bet from bettor
	betKey := BetKey(marketID, bettor)
	// Transfer to bet escrow
	fromKey := BalanceKey(bettor)
	fromBalance, err := getBalance(ctx, mu, fromKey)
	if err != nil {
		return fmt.Errorf("failed to get bettor balance: %w", err)
	}
	if fromBalance < amount {
		return fmt.Errorf("insufficient bettor balance: %w", ErrInsufficientBalance)
	}
	newFromBalance := fromBalance - amount
	if err := setBalance(ctx, mu, fromKey, newFromBalance); err != nil {
		return fmt.Errorf("failed to update bettor balance: %w", err)
	}
	// Store bet in escrow
	if err := setBalance(ctx, mu, betKey, amount); err != nil {
		return fmt.Errorf("failed to store bet: %w", err)
	}

	// 6. Update market totals
	market.TotalBets[outcome], err = smath.Add(market.TotalBets[outcome], amount)
	if err != nil {
		return fmt.Errorf("bet total overflow: %w", err)
	}

	// 7. Store updated market
	return SetMarket(ctx, mu, market)
}

// ResolveMarket resolves a prediction market
func ResolveMarket(
	ctx context.Context,
	mu state.Mutable,
	marketID ids.ID,
	resolution string,
	timestamp int64,
) error {
	// 1. Get market
	market, err := GetMarket(ctx, mu, marketID)
	if err != nil {
		return err
	}

	// 2. Validate market status
	if market.Status != MarketStatusActive {
		return ErrMarketAlreadyResolved
	}

	// 3. Validate resolution
	validOutcome := false
	for _, o := range market.Outcomes {
		if o == resolution {
			validOutcome = true
			break
		}
	}
	if !validOutcome {
		return ErrInvalidResolution
	}

	// 4. Update market status
	market.Status = MarketStatusResolved
	market.Resolution = resolution
	market.ResolvedAt = timestamp

	// 5. Store updated market
	return SetMarket(ctx, mu, market)
}

// GetBet returns the bet amount for a specific bettor on a market
func GetBet(
	ctx context.Context,
	mu state.Immutable,
	marketID ids.ID,
	bettor codec.Address,
) (uint64, error) {
	key := BetKey(marketID, bettor)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return 0, nil
		}
		return 0, err
	}

	if len(val) < 8 {
		return 0, fmt.Errorf("invalid bet data")
	}

	return binary.BigEndian.Uint64(val), nil
}

// ============================================================================
// Market Serialization
// ============================================================================

// Bytes serializes market to binary
func (m *PredictionMarket) Bytes() []byte {
	// Calculate size for outcomes and bets
	outcomeSize := 0
	for _, o := range m.Outcomes {
		outcomeSize += 4 + len(o)
	}

	betSize := 0
	for outcome, _ := range m.TotalBets {
		betSize += 4 + len(outcome) + 8
	}

	size := ids.IDLen + codec.AddressLen*2 + 8*4 + 1 + 1 + 1 // Fixed fields
	size += 4 + len(m.Description)                           // Description
	size += 4 + len(m.Resolution)                            // Resolution
	size += outcomeSize                                      // Outcomes
	size += 4 + betSize                                      // TotalBets map

	p := codec.NewWriter(size, size*2)

	// Fixed-size fields
	p.PackID(m.ID)
	p.PackAddress(m.Creator)
	p.PackInt64(m.ResolutionTime)
	p.PackAddress(m.Oracle)
	p.PackByte(m.Tier)
	p.PackUint64(m.BondAmount)
	p.PackByte(uint8(m.Status))
	p.PackInt64(m.CreatedAt)
	p.PackInt64(m.ResolvedAt)

	// Variable-size fields
	p.PackString(m.Description)
	p.PackString(m.Resolution)

	// Outcomes
	p.PackUint64(uint64(len(m.Outcomes)))
	for _, outcome := range m.Outcomes {
		p.PackString(outcome)
	}

	// TotalBets map - sort keys for determinism
	keys := make([]string, 0, len(m.TotalBets))
	for k := range m.TotalBets {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	p.PackUint64(uint64(len(m.TotalBets)))
	for _, outcome := range keys {
		p.PackString(outcome)
		p.PackUint64(m.TotalBets[outcome])
	}

	return p.Bytes()
}

// UnmarshalMarket deserializes market from binary
func UnmarshalMarket(b []byte) (*PredictionMarket, error) {
	if len(b) < 200 {
		return nil, fmt.Errorf("market data too short: %w", ErrDeserialization)
	}

	m := &PredictionMarket{}
	p := codec.NewReader(b, 8192)

	// Fixed-size fields
	p.UnpackID(true, &m.ID)
	p.UnpackAddress(&m.Creator)
	m.ResolutionTime = p.UnpackInt64(true)
	p.UnpackAddress(&m.Oracle)
	m.Tier = p.UnpackByte()
	m.BondAmount = p.UnpackUint64(true)
	status := p.UnpackByte()
	m.Status = MarketStatus(status)
	m.CreatedAt = p.UnpackInt64(true)
	m.ResolvedAt = p.UnpackInt64(true)

	// Variable-size fields
	m.Description = p.UnpackString(true)
	m.Resolution = p.UnpackString(true)

	// Outcomes
	numOutcomes := p.UnpackUint64(true)
	m.Outcomes = make([]string, numOutcomes)
	for i := 0; i < int(numOutcomes); i++ {
		m.Outcomes[i] = p.UnpackString(true)
	}

	// TotalBets map
	numBets := p.UnpackUint64(true)
	m.TotalBets = make(map[string]uint64, numBets)
	for i := 0; i < int(numBets); i++ {
		outcome := p.UnpackString(true)
		amount := p.UnpackUint64(true)
		m.TotalBets[outcome] = amount
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return m, nil
}

// Validate validates market data
func (m *PredictionMarket) Validate() error {
	if m.ID == ids.Empty {
		return fmt.Errorf("invalid market ID: %w", ErrInvalidMarketData)
	}

	if m.Creator == (codec.Address{}) {
		return fmt.Errorf("invalid creator address: %w", ErrInvalidMarketData)
	}

	if len(m.Description) == 0 {
		return fmt.Errorf("description required: %w", ErrInvalidMarketData)
	}

	if len(m.Outcomes) < 2 {
		return fmt.Errorf("market needs at least 2 outcomes: %w", ErrInvalidMarketData)
	}

	if len(m.Outcomes) > 10 {
		return fmt.Errorf("too many outcomes (max 10): %w", ErrInvalidMarketData)
	}

	if m.ResolutionTime <= 0 {
		return fmt.Errorf("invalid resolution time: %w", ErrInvalidMarketData)
	}

	if m.Tier < 1 || m.Tier > 4 {
		return fmt.Errorf("invalid tier (must be 1-4): %w", ErrInvalidMarketData)
	}

	if m.BondAmount == 0 {
		return fmt.Errorf("bond must be positive: %w", ErrInvalidMarketData)
	}

	if m.Status > MarketStatusChallenged {
		return fmt.Errorf("invalid market status: %w", ErrInvalidMarketData)
	}

	return nil
}

// validateOutcomes validates market outcomes
func validateOutcomes(outcomes []string) error {
	if len(outcomes) < 2 {
		return fmt.Errorf("market needs at least 2 outcomes: %w", ErrInvalidInput)
	}

	if len(outcomes) > 10 {
		return fmt.Errorf("too many outcomes (max 10): %w", ErrInvalidInput)
	}

	seen := make(map[string]bool)
	for i, outcome := range outcomes {
		if len(outcome) == 0 {
			return fmt.Errorf("outcome %d cannot be empty: %w", i, ErrInvalidInput)
		}
		if len(outcome) > 128 {
			return fmt.Errorf("outcome %d too long: %w", i, ErrInvalidInput)
		}
		if seen[outcome] {
			return fmt.Errorf("duplicate outcome %s: %w", outcome, ErrInvalidInput)
		}
		seen[outcome] = true
	}

	return nil
}

// IsActive returns true if market is active and accepting bets
func (m *PredictionMarket) IsActive(currentTime int64) bool {
	return m.Status == MarketStatusActive && currentTime < m.ResolutionTime
}

// CanResolve returns true if market can be resolved
func (m *PredictionMarket) CanResolve(currentTime int64) bool {
	return m.Status == MarketStatusActive && currentTime >= m.ResolutionTime
}

// GetTotalBets returns total bets across all outcomes
func (m *PredictionMarket) GetTotalBets() uint64 {
	total := uint64(0)
	for _, amount := range m.TotalBets {
		var err error
		total, err = smath.Add(total, amount)
		if err != nil {
			return 0
		}
	}
	return total
}

// MarketStatus String representation
func (s MarketStatus) String() string {
	switch s {
	case MarketStatusActive:
		return "Active"
	case MarketStatusResolved:
		return "Resolved"
	case MarketStatusCancelled:
		return "Cancelled"
	case MarketStatusChallenged:
		return "Challenged"
	default:
		return "Unknown"
	}
}
