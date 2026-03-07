// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package actions_test

import (
	"testing"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/examples/havenvm/actions"
	"github.com/ava-labs/hypersdk/examples/havenvm/consts"
)

func createTestAddress() codec.Address {
	id := ids.GenerateTestID()
	var addr codec.Address
	copy(addr[:], id[:])
	return addr
}

// ============================================================================
// AgentRegister Tests
// ============================================================================

func TestAgentRegister_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.AgentRegister{
		MetadataURI:  "ipfs://QmTestMetadata",
		Capabilities: []string{"trading", "analysis"},
		Owner:        createTestAddress(),
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalAgentRegister(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.AgentRegister)
	require.True(ok)
	assert.Equal(original.MetadataURI, deserialized.MetadataURI)
	assert.Equal(original.Capabilities, deserialized.Capabilities)
	assert.Equal(original.Owner, deserialized.Owner)
}

func TestAgentRegister_ComputeUnits(t *testing.T) {
	assert := assert.New(t)

	action := &actions.AgentRegister{}
	units := action.ComputeUnits(nil)

	assert.Equal(uint64(consts.AgentRegisterComputeUnits), units)
}

func TestAgentRegister_ValidRange(t *testing.T) {
	assert := assert.New(t)

	action := &actions.AgentRegister{}
	start, end := action.ValidRange(nil)

	assert.Equal(int64(-1), start)
	assert.Equal(int64(-1), end)
}

func TestAgentRegisterResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.AgentRegisterResult{
		AgentID:      ids.GenerateTestID(),
		AgentAddress: createTestAddress(),
		Owner:        createTestAddress(),
		Timestamp:    1000000,
		MetadataURI:  "ipfs://QmTest",
		Capabilities: []string{"trading"},
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalAgentRegisterResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.AgentRegisterResult)
	require.True(ok)
	assert.Equal(original.AgentID, deserialized.AgentID)
	assert.Equal(original.AgentAddress, deserialized.AgentAddress)
	assert.Equal(original.Owner, deserialized.Owner)
	assert.Equal(original.Timestamp, deserialized.Timestamp)
}

// ============================================================================
// Transfer Tests
// ============================================================================

func TestTransfer_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.Transfer{
		To:    createTestAddress(),
		Value: 100000,
		Memo:  []byte("test payment"),
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalTransfer(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.Transfer)
	require.True(ok)
	assert.Equal(original.To, deserialized.To)
	assert.Equal(original.Value, deserialized.Value)
	assert.Equal(original.Memo, deserialized.Memo)
}

func TestTransfer_ComputeUnits(t *testing.T) {
	assert := assert.New(t)

	action := &actions.Transfer{}
	units := action.ComputeUnits(nil)

	assert.Equal(uint64(consts.TransferComputeUnits), units)
}

func TestTransferResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.TransferResult{
		From:            createTestAddress(),
		To:              createTestAddress(),
		Amount:          100000,
		Memo:            []byte("test"),
		SenderBalance:   900000,
		ReceiverBalance: 100000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalTransferResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.TransferResult)
	require.True(ok)
	assert.Equal(original.From, deserialized.From)
	assert.Equal(original.To, deserialized.To)
	assert.Equal(original.Amount, deserialized.Amount)
}

// ============================================================================
// Stake Tests
// ============================================================================

func TestStake_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.Stake{
		Amount:   500000,
		Duration: 604800,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalStake(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.Stake)
	require.True(ok)
	assert.Equal(original.Amount, deserialized.Amount)
	assert.Equal(original.Duration, deserialized.Duration)
}

func TestStakeResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.StakeResult{
		Staker:   createTestAddress(),
		Amount:   500000,
		Duration: 604800,
		UnlockAt: 1604800,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalStakeResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.StakeResult)
	require.True(ok)
	assert.Equal(original.Staker, deserialized.Staker)
	assert.Equal(original.Amount, deserialized.Amount)
}

// ============================================================================
// Vote Tests
// ============================================================================

func TestVote_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.Vote{
		ProposalID: ids.GenerateTestID(),
		Support:    true,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalVote(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.Vote)
	require.True(ok)
	assert.Equal(original.ProposalID, deserialized.ProposalID)
	assert.Equal(original.Support, deserialized.Support)
}

func TestVoteResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.VoteResult{
		Voter:       createTestAddress(),
		ProposalID:  ids.GenerateTestID(),
		Support:     true,
		VotingPower: 500000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalVoteResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.VoteResult)
	require.True(ok)
	assert.Equal(original.Voter, deserialized.Voter)
	assert.Equal(original.ProposalID, deserialized.ProposalID)
	assert.Equal(original.Support, deserialized.Support)
	assert.Equal(original.VotingPower, deserialized.VotingPower)
}

// ============================================================================
// Delegate Tests
// ============================================================================

func TestDelegate_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.Delegate{
		To: createTestAddress(),
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalDelegate(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.Delegate)
	require.True(ok)
	assert.Equal(original.To, deserialized.To)
}

func TestDelegateResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.DelegateResult{
		Delegator: createTestAddress(),
		Delegatee: createTestAddress(),
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalDelegateResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.DelegateResult)
	require.True(ok)
	assert.Equal(original.Delegator, deserialized.Delegator)
	assert.Equal(original.Delegatee, deserialized.Delegatee)
}

// ============================================================================
// WithdrawStake Tests
// ============================================================================

func TestWithdrawStake_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.WithdrawStake{
		Amount: 250000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalWithdrawStake(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.WithdrawStake)
	require.True(ok)
	assert.Equal(original.Amount, deserialized.Amount)
}

func TestWithdrawStakeResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.WithdrawStakeResult{
		Staker: createTestAddress(),
		Amount: 250000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalWithdrawStakeResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.WithdrawStakeResult)
	require.True(ok)
	assert.Equal(original.Staker, deserialized.Staker)
	assert.Equal(original.Amount, deserialized.Amount)
}

// ============================================================================
// Task Tests
// ============================================================================

func TestCreateTask_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.CreateTask{
		Description:    "Test task",
		BountyAmount:   100000,
		RequireZKProof: false,
		ProofRequirements: []byte{0x01, 0x02, 0x03},
		Deadline:       1000000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalCreateTask(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.CreateTask)
	require.True(ok)
	assert.Equal(original.Description, deserialized.Description)
	assert.Equal(original.BountyAmount, deserialized.BountyAmount)
	assert.Equal(original.ProofRequirements, deserialized.ProofRequirements)
}

func TestCreateTaskResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.CreateTaskResult{
		TaskID:       ids.GenerateTestID(),
		Creator:      createTestAddress(),
		BountyAmount: 100000,
		Deadline:     1000000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalCreateTaskResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.CreateTaskResult)
	require.True(ok)
	assert.Equal(original.TaskID, deserialized.TaskID)
	assert.Equal(original.BountyAmount, deserialized.BountyAmount)
}

func TestSubmitTaskResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.SubmitTaskResult{
		TaskID:          ids.GenerateTestID(),
		Submitter:       createTestAddress(),
		BountyAmount:    100000,
		ReputationBoost: 10,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalSubmitTaskResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.SubmitTaskResult)
	require.True(ok)
	assert.Equal(original.TaskID, deserialized.TaskID)
	assert.Equal(original.BountyAmount, deserialized.BountyAmount)
}

// ============================================================================
// Prediction Market Tests
// ============================================================================

func TestCreatePredictionMarket_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.CreatePredictionMarket{
		Description:    "Will it rain?",
		Outcomes:       []string{"YES", "NO"},
		ResolutionTime: 1000000,
		Oracle:         createTestAddress(),
		Tier:           1,
		BondAmount:     100000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalCreatePredictionMarket(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.CreatePredictionMarket)
	require.True(ok)
	assert.Equal(original.Description, deserialized.Description)
	assert.Equal(original.Tier, deserialized.Tier)
}

func TestCreatePredictionMarketResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.CreatePredictionMarketResult{
		MarketID:       ids.GenerateTestID(),
		Creator:        createTestAddress(),
		Outcomes:       []string{"YES", "NO"},
		BondAmount:     100000,
		Tier:           1,
		ResolutionTime: 1000000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalCreatePredictionMarketResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.CreatePredictionMarketResult)
	require.True(ok)
	assert.Equal(original.MarketID, deserialized.MarketID)
	assert.Equal(original.Tier, deserialized.Tier)
}

func TestPlaceBet_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.PlaceBet{
		MarketID: ids.GenerateTestID(),
		Outcome:  "YES",
		Amount:   10000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalPlaceBet(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.PlaceBet)
	require.True(ok)
	assert.Equal(original.Outcome, deserialized.Outcome)
	assert.Equal(original.Amount, deserialized.Amount)
}

func TestPlaceBetResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.PlaceBetResult{
		MarketID: ids.GenerateTestID(),
		Bettor:   createTestAddress(),
		Outcome:  "YES",
		Amount:   10000,
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalPlaceBetResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.PlaceBetResult)
	require.True(ok)
	assert.Equal(original.Outcome, deserialized.Outcome)
	assert.Equal(original.Amount, deserialized.Amount)
}

func TestResolvePrediction_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.ResolvePrediction{
		MarketID: ids.GenerateTestID(),
		Outcome:  "YES",
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalResolvePrediction(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.ResolvePrediction)
	require.True(ok)
	assert.Equal(original.Outcome, deserialized.Outcome)
}

func TestResolvePredictionResult_Bytes_Unmarshal(t *testing.T) {
	assert := assert.New(t)
	require := require.New(t)

	original := &actions.ResolvePredictionResult{
		MarketID: ids.GenerateTestID(),
		Outcome:  "YES",
	}

	bytes := original.Bytes()
	require.NotEmpty(bytes)

	unmarshaled, err := actions.UnmarshalResolvePredictionResult(bytes)
	require.NoError(err)

	deserialized, ok := unmarshaled.(*actions.ResolvePredictionResult)
	require.True(ok)
	assert.Equal(original.Outcome, deserialized.Outcome)
}

// ============================================================================
// Main Test Runner
// ============================================================================

func TestAll(t *testing.T) {
	// AgentRegister tests
	t.Run("AgentRegister_Bytes_Unmarshal", TestAgentRegister_Bytes_Unmarshal)
	t.Run("AgentRegister_ComputeUnits", TestAgentRegister_ComputeUnits)
	t.Run("AgentRegister_ValidRange", TestAgentRegister_ValidRange)
	t.Run("AgentRegisterResult_Bytes_Unmarshal", TestAgentRegisterResult_Bytes_Unmarshal)

	// Transfer tests
	t.Run("Transfer_Bytes_Unmarshal", TestTransfer_Bytes_Unmarshal)
	t.Run("Transfer_ComputeUnits", TestTransfer_ComputeUnits)
	t.Run("TransferResult_Bytes_Unmarshal", TestTransferResult_Bytes_Unmarshal)

	// Stake tests
	t.Run("Stake_Bytes_Unmarshal", TestStake_Bytes_Unmarshal)
	t.Run("StakeResult_Bytes_Unmarshal", TestStakeResult_Bytes_Unmarshal)

	// Vote tests
	t.Run("Vote_Bytes_Unmarshal", TestVote_Bytes_Unmarshal)
	t.Run("VoteResult_Bytes_Unmarshal", TestVoteResult_Bytes_Unmarshal)

	// Delegate tests
	t.Run("Delegate_Bytes_Unmarshal", TestDelegate_Bytes_Unmarshal)
	t.Run("DelegateResult_Bytes_Unmarshal", TestDelegateResult_Bytes_Unmarshal)

	// WithdrawStake tests
	t.Run("WithdrawStake_Bytes_Unmarshal", TestWithdrawStake_Bytes_Unmarshal)
	t.Run("WithdrawStakeResult_Bytes_Unmarshal", TestWithdrawStakeResult_Bytes_Unmarshal)

	// Task tests
	t.Run("CreateTask_Bytes_Unmarshal", TestCreateTask_Bytes_Unmarshal)
	t.Run("CreateTaskResult_Bytes_Unmarshal", TestCreateTaskResult_Bytes_Unmarshal)
	t.Run("SubmitTaskResult_Bytes_Unmarshal", TestSubmitTaskResult_Bytes_Unmarshal)

	// Prediction tests
	t.Run("CreatePredictionMarket_Bytes_Unmarshal", TestCreatePredictionMarket_Bytes_Unmarshal)
	t.Run("CreatePredictionMarketResult_Bytes_Unmarshal", TestCreatePredictionMarketResult_Bytes_Unmarshal)
	t.Run("PlaceBet_Bytes_Unmarshal", TestPlaceBet_Bytes_Unmarshal)
	t.Run("PlaceBetResult_Bytes_Unmarshal", TestPlaceBetResult_Bytes_Unmarshal)
	t.Run("ResolvePrediction_Bytes_Unmarshal", TestResolvePrediction_Bytes_Unmarshal)
	t.Run("ResolvePredictionResult_Bytes_Unmarshal", TestResolvePredictionResult_Bytes_Unmarshal)
}
