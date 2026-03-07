// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package genesis

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/trace"
	"github.com/ava-labs/avalanchego/x/merkledb"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/genesis"
	"github.com/ava-labs/hypersdk/state"

	safemath "github.com/ava-labs/avalanchego/utils/math"
)

var (
	_ genesis.Genesis               = (*Genesis)(nil)
	_ genesis.GenesisAndRuleFactory = (*GenesisFactory)(nil)
)

type CustomAllocation struct {
	Address codec.Address `json:"address"`
	Balance uint64        `json:"balance"`
}

func (c *CustomAllocation) Validate() error {
	if c.Address == (codec.Address{}) {
		return fmt.Errorf("invalid address")
	}
	if c.Balance == 0 {
		return fmt.Errorf("balance must be positive")
	}
	return nil
}

type Genesis struct {
	StateBranchFactor merkledb.BranchFactor `json:"stateBranchFactor"`
	CustomAllocation  []*CustomAllocation   `json:"customAllocation"`
	Rules             *Rules                `json:"initialRules"`
}

type GenesisFactory struct{}

func (GenesisFactory) Load(
	genesisBytes []byte,
	_ []byte,
	networkID uint32,
	chainID ids.ID,
) (genesis.Genesis, chain.RuleFactory, error) {
	genesis := &Genesis{}
	if err := json.Unmarshal(genesisBytes, genesis); err != nil {
		return nil, nil, fmt.Errorf("failed to unmarshal genesis: %w", err)
	}

	if err := genesis.Validate(); err != nil {
		return nil, nil, fmt.Errorf("invalid genesis: %w", err)
	}

	genesis.Rules.NetworkID = networkID
	genesis.Rules.ChainID = chainID

	return genesis, &ImmutableRuleFactory{genesis.Rules}, nil
}

func (g *Genesis) InitializeState(
	ctx context.Context,
	tracer trace.Tracer,
	mu state.Mutable,
	balanceHandler chain.BalanceHandler,
) error {
	_, span := tracer.Start(ctx, "HavenVM.Genesis.InitializeState")
	defer span.End()

	totalSupply := uint64(0)
	for _, alloc := range g.CustomAllocation {
		if err := alloc.Validate(); err != nil {
			return fmt.Errorf("invalid allocation %s: %w", alloc.Address, err)
		}
		var err error
		totalSupply, err = safemath.Add(totalSupply, alloc.Balance)
		if err != nil {
			return fmt.Errorf("supply overflow: %w", err)
		}
	}

	for _, alloc := range g.CustomAllocation {
		if err := balanceHandler.AddBalance(ctx, alloc.Address, mu, alloc.Balance); err != nil {
			return fmt.Errorf("failed to allocate balance to %s: %w", alloc.Address, err)
		}
	}

	return nil
}

func (g *Genesis) GetStateBranchFactor() merkledb.BranchFactor {
	return g.StateBranchFactor
}

func (g *Genesis) Validate() error {
	if g.Rules == nil {
		return fmt.Errorf("rules required")
	}
	if err := g.Rules.Validate(); err != nil {
		return fmt.Errorf("invalid rules: %w", err)
	}
	if len(g.CustomAllocation) == 0 {
		return fmt.Errorf("at least one allocation required")
	}

	seen := make(map[codec.Address]bool)
	for i, alloc := range g.CustomAllocation {
		if alloc.Address == (codec.Address{}) {
			return fmt.Errorf("allocation %d has invalid address", i)
		}
		if seen[alloc.Address] {
			return fmt.Errorf("duplicate allocation for address %s", alloc.Address)
		}
		seen[alloc.Address] = true
	}
	return nil
}
