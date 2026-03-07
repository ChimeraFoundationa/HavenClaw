// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package genesis

import (
	"fmt"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/fees"
)

type Rules struct {
	NetworkID uint32 `json:"networkId"`
	ChainID   ids.ID `json:"chainId"`

	MinUnitPrice               fees.Dimensions `json:"minUnitPrice"`
	UnitPriceChangeDenominator fees.Dimensions `json:"unitPriceChangeDenominator"`
	WindowTargetUnits          fees.Dimensions `json:"windowTargetUnits"`
	MaxBlockUnits              fees.Dimensions `json:"maxBlockUnits"`

	BaseComputeUnits uint64 `json:"baseComputeUnits"`

	StorageKeyReadUnits       uint64 `json:"storageKeyReadUnits"`
	StorageValueReadUnits     uint64 `json:"storageValueReadUnits"`
	StorageKeyAllocateUnits   uint64 `json:"storageKeyAllocateUnits"`
	StorageValueAllocateUnits uint64 `json:"storageValueAllocateUnits"`
	StorageKeyWriteUnits      uint64 `json:"storageKeyWriteUnits"`
	StorageValueWriteUnits    uint64 `json:"storageValueWriteUnits"`

	MinAgentRegistrationBond uint64 `json:"minAgentRegistrationBond"`
	MinPredictionBond        uint64 `json:"minPredictionBond"`
	MaxTaskDuration          int64  `json:"maxTaskDuration"`
	StakeLockPeriod          int64  `json:"stakeLockPeriod"`
	MinStakeAmount           uint64 `json:"minStakeAmount"`
	ProposalBond             uint64 `json:"proposalBond"`
}

func NewDefaultRules() *Rules {
	return &Rules{
		MinUnitPrice:               fees.Dimensions{100, 100, 100, 100, 100},
		UnitPriceChangeDenominator: fees.Dimensions{48, 48, 48, 48, 48},
		WindowTargetUnits:          fees.Dimensions{20_000_000, 1_000, 1_000, 1_000, 1_000},
		MaxBlockUnits:              fees.Dimensions{1_800_000, 2_000, 2_000, 2_000, 2_000},
		BaseComputeUnits:           1,
		StorageKeyReadUnits:        5,
		StorageValueReadUnits:      2,
		StorageKeyAllocateUnits:    20,
		StorageValueAllocateUnits:  5,
		StorageKeyWriteUnits:       10,
		StorageValueWriteUnits:     3,
		MinAgentRegistrationBond:   1_000_000_000_000,
		MinPredictionBond:          10_000_000_000_000,
		MaxTaskDuration:            14 * 24 * 60 * 60,
		StakeLockPeriod:            7 * 24 * 60 * 60,
		MinStakeAmount:             100_000_000_000_000,
		ProposalBond:               1_000_000_000_000_000,
	}
}

func (r *Rules) Validate() error {
	for i := range r.MinUnitPrice {
		if r.MinUnitPrice[i] == 0 {
			return fmt.Errorf("min unit price %d must be positive", i)
		}
	}
	for i := range r.UnitPriceChangeDenominator {
		if r.UnitPriceChangeDenominator[i] == 0 {
			return fmt.Errorf("unit price change denominator %d must be positive", i)
		}
	}
	for i := range r.WindowTargetUnits {
		if r.WindowTargetUnits[i] == 0 {
			return fmt.Errorf("window target units %d must be positive", i)
		}
	}
	for i := range r.MaxBlockUnits {
		if r.MaxBlockUnits[i] == 0 {
			return fmt.Errorf("max block units %d must be positive", i)
		}
	}

	if r.StorageKeyReadUnits == 0 {
		return fmt.Errorf("storage key read units must be positive")
	}
	if r.StorageKeyAllocateUnits == 0 {
		return fmt.Errorf("storage key allocate units must be positive")
	}
	if r.StorageKeyWriteUnits == 0 {
		return fmt.Errorf("storage key write units must be positive")
	}
	if r.MinAgentRegistrationBond == 0 {
		return fmt.Errorf("min agent registration bond must be positive")
	}
	if r.MaxTaskDuration <= 0 {
		return fmt.Errorf("max task duration must be positive")
	}
	if r.StakeLockPeriod <= 0 {
		return fmt.Errorf("stake lock period must be positive")
	}
	return nil
}

type ImmutableRuleFactory struct {
	rules *Rules
}

func (i *ImmutableRuleFactory) GetRules(timestamp int64) chain.Rules {
	return i.rules
}

// Implement chain.Rules interface
func (r *Rules) GetMinUnitPrice() fees.Dimensions {
	return r.MinUnitPrice
}

func (r *Rules) GetBaseComputeUnits() uint64 {
	return r.BaseComputeUnits
}

func (r *Rules) GetStorageKeyReadUnits() uint64 {
	return r.StorageKeyReadUnits
}

func (r *Rules) GetStorageValueReadUnits() uint64 {
	return r.StorageValueReadUnits
}

func (r *Rules) GetStorageKeyAllocateUnits() uint64 {
	return r.StorageKeyAllocateUnits
}

func (r *Rules) GetStorageValueAllocateUnits() uint64 {
	return r.StorageValueAllocateUnits
}

func (r *Rules) GetStorageKeyWriteUnits() uint64 {
	return r.StorageKeyWriteUnits
}

func (r *Rules) GetStorageValueWriteUnits() uint64 {
	return r.StorageValueWriteUnits
}

func (r *Rules) FetchCustom(string) (any, bool) {
	return nil, false
}

func (r *Rules) GetChainID() ids.ID {
	return r.ChainID
}

func (r *Rules) GetNetworkID() uint32 {
	return r.NetworkID
}

func (r *Rules) GetMaxActionsPerTx() uint8 {
	return 16
}

func (r *Rules) GetMaxTxSize() uint64 {
	return 65536
}

func (r *Rules) GetValidityWindow() int64 {
	return 60_000
}

func (r *Rules) GetMaxBlockUnits() fees.Dimensions {
	return r.MaxBlockUnits
}

func (r *Rules) GetMinBlockGap() int64 {
	return 250
}

func (r *Rules) GetMaxBlockSize() uint64 {
	return 256_000
}

func (r *Rules) GetMinEmptyBlockGap() int64 {
	return 250
}

func (r *Rules) GetSponsorStateKeysMaxChunks() []uint16 {
	return []uint16{128}
}

func (r *Rules) GetUnitPriceChangeDenominator() fees.Dimensions {
	return r.UnitPriceChangeDenominator
}

func (r *Rules) GetWindowTargetUnits() fees.Dimensions {
	return r.WindowTargetUnits
}
