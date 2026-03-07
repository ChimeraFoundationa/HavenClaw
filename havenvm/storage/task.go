// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package storage

import (
	"context"
	"errors"
	"fmt"

	"github.com/ava-labs/avalanchego/database"
	"github.com/ava-labs/avalanchego/ids"
	smath "github.com/ava-labs/avalanchego/utils/math"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

// ============================================================================
// Task Storage Functions
// ============================================================================

// GetTask retrieves a task from storage
func GetTask(ctx context.Context, mu state.Immutable, taskID ids.ID) (*Task, error) {
	key := TaskKey(taskID)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	task, err := UnmarshalTask(val)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal task: %w", err)
	}

	return task, nil
}

// SetTask stores a task with validation
func SetTask(ctx context.Context, mu state.Mutable, taskID ids.ID, task *Task) error {
	if task == nil {
		return fmt.Errorf("task cannot be nil: %w", ErrInvalidTaskData)
	}

	if err := task.Validate(); err != nil {
		return fmt.Errorf("invalid task: %w", err)
	}

	key := TaskKey(taskID)
	data := task.Bytes()

	return mu.Insert(ctx, key, data)
}

// DeleteTask removes a task from storage
func DeleteTask(ctx context.Context, mu state.Mutable, taskID ids.ID) error {
	key := TaskKey(taskID)
	return mu.Remove(ctx, key)
}

// TaskExists checks if a task exists
func TaskExists(ctx context.Context, mu state.Immutable, taskID ids.ID) (bool, error) {
	key := TaskKey(taskID)
	_, err := mu.GetValue(ctx, key)

	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check task existence: %w", err)
	}

	return true, nil
}

// CreateTask creates a new task with bounty escrow
func CreateTask(
	ctx context.Context,
	mu state.Mutable,
	taskID ids.ID,
	creator codec.Address,
	description string,
	bountyAmount uint64,
	requireZKProof bool,
	proofRequirements []byte,
	deadline int64,
	timestamp int64,
) error {
	// 1. Validate bounty amount
	if bountyAmount == 0 {
		return ErrInsufficientBounty
	}

	// 2. Lock bounty from creator - use task escrow
	// Create escrow address from taskID (use first 20 bytes as address)
	var escrowAddress codec.Address
	copy(escrowAddress[:], taskID[:])
	
	bountyKey := BalanceKey(escrowAddress)
	fromKey := BalanceKey(creator)
	fromBalance, err := getBalance(ctx, mu, fromKey)
	if err != nil {
		return fmt.Errorf("failed to get creator balance: %w", err)
	}
	if fromBalance < bountyAmount {
		return fmt.Errorf("insufficient creator balance: %w", ErrInsufficientBalance)
	}
	newFromBalance := fromBalance - bountyAmount
	if err := setBalance(ctx, mu, fromKey, newFromBalance); err != nil {
		return fmt.Errorf("failed to update creator balance: %w", err)
	}
	// Store bounty in escrow
	if err := setBalance(ctx, mu, bountyKey, bountyAmount); err != nil {
		return fmt.Errorf("failed to store bounty: %w", err)
	}

	// 3. Create task record
	task := &Task{
		ID:                taskID,
		Creator:           creator,
		Description:       description,
		BountyAmount:      bountyAmount,
		RequireZKProof:    requireZKProof,
		ProofRequirements: proofRequirements,
		Deadline:          deadline,
		Status:            TaskStatusOpen,
		CompletedBy:       codec.Address{},
		CompletedAt:       0,
		Result:            nil,
		CreatedAt:         timestamp,
	}

	// 4. Store task
	return SetTask(ctx, mu, taskID, task)
}

// SubmitTaskCompletion marks a task as completed
func SubmitTaskCompletion(
	ctx context.Context,
	mu state.Mutable,
	taskID ids.ID,
	submitter codec.Address,
	result []byte,
	timestamp int64,
) error {
	// 1. Get task
	task, err := GetTask(ctx, mu, taskID)
	if err != nil {
		return fmt.Errorf("failed to get task: %w", err)
	}

	// 2. Validate task status
	if task.Status != TaskStatusOpen {
		return ErrTaskAlreadyCompleted
	}

	// 3. Validate deadline
	if timestamp > task.Deadline {
		task.Status = TaskStatusExpired
		return SetTask(ctx, mu, taskID, task)
	}

	// 4. Validate submitter is not creator
	if submitter == task.Creator {
		return ErrTaskCreatorCannotSubmit
	}

	// 5. Update task
	task.Status = TaskStatusCompleted
	task.CompletedBy = submitter
	task.CompletedAt = timestamp
	task.Result = result

	return SetTask(ctx, mu, taskID, task)
}

// ReleaseBounty transfers bounty to task submitter
func ReleaseBounty(
	ctx context.Context,
	mu state.Mutable,
	taskID ids.ID,
) error {
	// Get task to find creator and bounty amount
	task, err := GetTask(ctx, mu, taskID)
	if err != nil {
		return fmt.Errorf("failed to get task: %w", err)
	}

	// Create escrow address from taskID
	var escrowAddress codec.Address
	copy(escrowAddress[:], taskID[:])
	
	// Transfer bounty to submitter
	bountyKey := BalanceKey(escrowAddress)
	bountyBalance, err := getBalance(ctx, mu, bountyKey)
	if err != nil {
		return fmt.Errorf("failed to get bounty balance: %w", err)
	}
	if bountyBalance == 0 {
		return fmt.Errorf("no bounty available")
	}
	
	// Transfer to submitter
	submitterKey := BalanceKey(task.CompletedBy)
	newSubmitterBalance, err := smath.Add(bountyBalance, task.BountyAmount)
	if err != nil {
		return fmt.Errorf("bounty overflow: %w", err)
	}
	
	// Clear escrow and pay submitter
	if err := setBalance(ctx, mu, bountyKey, 0); err != nil {
		return fmt.Errorf("failed to clear bounty: %w", err)
	}
	return setBalance(ctx, mu, submitterKey, newSubmitterBalance)
}

// ============================================================================
// Task Serialization
// ============================================================================

// Bytes serializes task to binary
func (t *Task) Bytes() []byte {
	// Calculate approximate size
	size := ids.IDLen + codec.AddressLen*2 + 8*4 + 1 + 1 // Fixed fields
	size += 4 + len(t.Description)                        // Description
	size += 4 + len(t.ProofRequirements)                  // Proof requirements
	size += 4 + len(t.Result)                             // Result

	p := codec.NewWriter(size, size*2)

	// Fixed-size fields
	p.PackID(t.ID)
	p.PackAddress(t.Creator)
	p.PackString(t.Description)
	p.PackUint64(t.BountyAmount)
	p.PackBool(t.RequireZKProof)
	p.PackUint64(uint64(len(t.ProofRequirements)))
	p.PackFixedBytes(t.ProofRequirements)
	p.PackInt64(t.Deadline)
	p.PackByte(uint8(t.Status))
	p.PackAddress(t.CompletedBy)
	p.PackInt64(t.CompletedAt)
	p.PackUint64(uint64(len(t.Result)))
	p.PackFixedBytes(t.Result)
	p.PackInt64(t.CreatedAt)

	return p.Bytes()
}

// UnmarshalTask deserializes task from binary
func UnmarshalTask(b []byte) (*Task, error) {
	if len(b) == 0 {
		return nil, fmt.Errorf("empty task data: %w", ErrDeserialization)
	}

	t := &Task{}
	p := codec.NewReader(b, 8192)

	// Fixed-size fields
	p.UnpackID(true, &t.ID)
	p.UnpackAddress(&t.Creator)
	t.Description = p.UnpackString(true)
	t.BountyAmount = p.UnpackUint64(true)
	t.RequireZKProof = p.UnpackBool()
	proofReqLen := p.UnpackUint64(true)
	if proofReqLen > 0 {
		t.ProofRequirements = make([]byte, proofReqLen)
		p.UnpackFixedBytes(int(proofReqLen), &t.ProofRequirements)
	}
	t.Deadline = p.UnpackInt64(true)
	status := p.UnpackByte()
	t.Status = TaskStatus(status)
	p.UnpackAddress(&t.CompletedBy)
	t.CompletedAt = p.UnpackInt64(true)
	resultLen := p.UnpackUint64(true)
	if resultLen > 0 {
		t.Result = make([]byte, resultLen)
		p.UnpackFixedBytes(int(resultLen), &t.Result)
	}
	t.CreatedAt = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return t, nil
}

// Validate validates task data
func (t *Task) Validate() error {
	if t.ID == ids.Empty {
		return fmt.Errorf("invalid task ID: %w", ErrInvalidTaskData)
	}

	if t.Creator == (codec.Address{}) {
		return fmt.Errorf("invalid creator address: %w", ErrInvalidTaskData)
	}

	if len(t.Description) == 0 {
		return fmt.Errorf("description required: %w", ErrInvalidTaskData)
	}

	if t.BountyAmount == 0 {
		return fmt.Errorf("bounty must be positive: %w", ErrInvalidTaskData)
	}

	if t.Deadline <= 0 {
		return fmt.Errorf("invalid deadline: %w", ErrInvalidTaskData)
	}

	if t.Status > TaskStatusCancelled {
		return fmt.Errorf("invalid task status: %w", ErrInvalidTaskData)
	}

	return nil
}

// UpdateReputation updates agent reputation after task completion
func UpdateReputation(
	ctx context.Context,
	mu state.Mutable,
	address codec.Address,
	success bool,
	timestamp int64,
) error {
	// Get existing reputation
	rep, err := GetReputation(ctx, mu, address)
	if err != nil && !errors.Is(err, database.ErrNotFound) {
		return fmt.Errorf("failed to get reputation: %w", err)
	}

	if rep == nil {
		rep = &Reputation{
			Score:          0,
			LastActivity:   timestamp,
			TotalTasks:     0,
			CompletedTasks: 0,
			FailedTasks:    0,
			Streak:         0,
		}
	}

	// Update stats
	rep.TotalTasks++
	if success {
		rep.CompletedTasks++
		rep.Streak++
		rep.Score += 10 // Base points for success
	} else {
		rep.FailedTasks++
		rep.Streak = 0
		rep.Score -= 5 // Penalty for failure
	}

	rep.LastActivity = timestamp

	// Clamp reputation
	if rep.Score > 1000000 {
		rep.Score = 1000000
	}
	if rep.Score < -1000000 {
		rep.Score = -1000000
	}

	return SetReputation(ctx, mu, address, rep)
}

// GetReputation retrieves reputation
func GetReputation(ctx context.Context, mu state.Immutable, address codec.Address) (*Reputation, error) {
	key := ReputationKey(address)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get reputation: %w", err)
	}

	return UnmarshalReputation(val)
}

// SetReputation stores reputation
func SetReputation(ctx context.Context, mu state.Mutable, address codec.Address, rep *Reputation) error {
	if rep == nil {
		return fmt.Errorf("reputation cannot be nil: %w", ErrInvalidReputation)
	}

	key := ReputationKey(address)
	data := rep.Bytes()

	return mu.Insert(ctx, key, data)
}

// Bytes serializes reputation
func (r *Reputation) Bytes() []byte {
	p := codec.NewWriter(64, 128)

	p.PackInt64(r.Score)
	p.PackInt64(r.LastActivity)
	p.PackUint64(uint64(r.TotalTasks))
	p.PackUint64(uint64(r.CompletedTasks))
	p.PackUint64(uint64(r.FailedTasks))
	p.PackUint64(uint64(r.Streak))

	return p.Bytes()
}

// UnmarshalReputation deserializes reputation
func UnmarshalReputation(b []byte) (*Reputation, error) {
	if len(b) < 48 {
		return nil, fmt.Errorf("reputation data too short: %w", ErrDeserialization)
	}

	r := &Reputation{}
	p := codec.NewReader(b, 128)

	r.Score = p.UnpackInt64(true)
	r.LastActivity = p.UnpackInt64(true)
	totalTasks := p.UnpackUint64(true)
	r.TotalTasks = uint32(totalTasks)
	completedTasks := p.UnpackUint64(true)
	r.CompletedTasks = uint32(completedTasks)
	failedTasks := p.UnpackUint64(true)
	r.FailedTasks = uint32(failedTasks)
	streak := p.UnpackUint64(true)
	r.Streak = uint32(streak)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// InitializeReputation initializes reputation for a new agent
func InitializeReputation(ctx context.Context, mu state.Mutable, address codec.Address) error {
	key := ReputationKey(address)
	rep := &Reputation{
		Score:          0,
		LastActivity:   0,
		TotalTasks:     0,
		CompletedTasks: 0,
		FailedTasks:    0,
		Streak:         0,
	}
	data := rep.Bytes()
	return mu.Insert(ctx, key, data)
}

// GetAgent retrieves an agent from storage
func GetAgent(ctx context.Context, mu state.Immutable, address codec.Address) (*Agent, error) {
	key := AgentKey(address)
	val, err := mu.GetValue(ctx, key)
	if err != nil {
		if errors.Is(err, database.ErrNotFound) {
			return nil, database.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get agent: %w", err)
	}
	return UnmarshalAgent(val)
}

// SetAgent stores an agent
func SetAgent(ctx context.Context, mu state.Mutable, address codec.Address, agent *Agent) error {
	if agent == nil {
		return ErrInvalidAgentData
	}
	key := AgentKey(address)
	data := agent.Bytes()
	return mu.Insert(ctx, key, data)
}

// AgentExists checks if an agent exists
func AgentExists(ctx context.Context, mu state.Immutable, address codec.Address) (bool, error) {
	key := AgentKey(address)
	_, err := mu.GetValue(ctx, key)
	if errors.Is(err, database.ErrNotFound) {
		return false, nil
	}
	return err == nil, err
}
