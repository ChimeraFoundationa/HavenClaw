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
	_ chain.Action = (*CreateTask)(nil)
	_ chain.Action = (*SubmitTask)(nil)
)

// ============================================================================
// CreateTask Action
// ============================================================================

// CreateTask creates a new task with bounty
type CreateTask struct {
	Description       string `json:"description"`
	BountyAmount      uint64 `json:"bounty_amount"`
	RequireZKProof    bool   `json:"require_zk_proof"`
	ProofRequirements []byte `json:"proof_requirements"`
	Deadline          int64  `json:"deadline"`
}

func (*CreateTask) GetTypeID() uint8 {
	return consts.CreateTaskID
}

func (c *CreateTask) StateKeys(actor codec.Address, taskID ids.ID) state.Keys {
	return state.Keys{
		string(storage.TaskKey(taskID)): state.All,
		string(storage.BalanceKey(actor)): state.Read | state.Write,
	}
}

func (c *CreateTask) Bytes() []byte {
	p := codec.NewWriter(2048, 8192)
	p.PackByte(consts.CreateTaskID)
	p.PackString(c.Description)
	p.PackUint64(c.BountyAmount)
	p.PackBool(c.RequireZKProof)
	p.PackUint64(uint64(len(c.ProofRequirements)))
	if len(c.ProofRequirements) > 0 {
		p.PackFixedBytes(c.ProofRequirements)
	}
	p.PackInt64(c.Deadline)
	return p.Bytes()
}

func UnmarshalCreateTask(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.CreateTaskID {
		return nil, consts.ErrInvalidInput
	}

	c := &CreateTask{}
	p := codec.NewReader(bytes[1:], 8192)

	c.Description = p.UnpackString(true)
	c.BountyAmount = p.UnpackUint64(true)
	c.RequireZKProof = p.UnpackBool()
	proofLen := p.UnpackUint64(true)
	if proofLen > 0 {
		c.ProofRequirements = make([]byte, proofLen)
		p.UnpackFixedBytes(int(proofLen), &c.ProofRequirements)
	}
	c.Deadline = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return c, nil
}

func (c *CreateTask) Execute(
	ctx context.Context,
	rules chain.Rules,
	mu state.Mutable,
	timestamp int64,
	actor codec.Address,
	taskID ids.ID,
) ([]byte, error) {
	// ===== VALIDATION PHASE =====

	// 1. Validate description
	if len(c.Description) == 0 {
		return nil, consts.ErrEmptyInput
	}
	if len(c.Description) > 4096 {
		return nil, consts.ErrInputTooLarge
	}

	// 2. Validate bounty amount
	if c.BountyAmount == 0 {
		return nil, consts.ErrInsufficientBounty
	}

	// 3. Validate deadline
	if c.Deadline <= timestamp {
		return nil, consts.ErrResolutionTimeInPast
	}
	// Note: MaxTaskDuration check would require access to rules
	// For now, we validate in storage.CreateTask

	// 4. Validate ZK proof requirements
	if c.RequireZKProof && len(c.ProofRequirements) == 0 {
		return nil, consts.ErrProofRequirementsMismatch
	}
	if len(c.ProofRequirements) > consts.MaxProofSize {
		return nil, consts.ErrInputTooLarge
	}

	// ===== EXECUTION PHASE =====

	// 5. Create task with bounty escrow
	if err := storage.CreateTask(
		ctx, mu, taskID, actor, c.Description, c.BountyAmount,
		c.RequireZKProof, c.ProofRequirements, c.Deadline, timestamp,
	); err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	// 6. Return result
	result := &CreateTaskResult{
		TaskID:       taskID,
		Creator:      actor,
		BountyAmount: c.BountyAmount,
		Deadline:     c.Deadline,
	}

	return result.Bytes(), nil
}

func (*CreateTask) ComputeUnits(chain.Rules) uint64 {
	return consts.CreateTaskComputeUnits
}

func (*CreateTask) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

// CreateTaskResult is returned after task creation
type CreateTaskResult struct {
	TaskID       ids.ID        `json:"task_id"`
	Creator      codec.Address `json:"creator"`
	BountyAmount uint64        `json:"bounty_amount"`
	Deadline     int64         `json:"deadline"`
}

func (*CreateTaskResult) GetTypeID() uint8 {
	return consts.CreateTaskID
}

func (r *CreateTaskResult) Bytes() []byte {
	p := codec.NewWriter(128, 256)
	p.PackByte(consts.CreateTaskID)
	p.PackID(r.TaskID)
	p.PackAddress(r.Creator)
	p.PackUint64(r.BountyAmount)
	p.PackInt64(r.Deadline)
	return p.Bytes()
}

func UnmarshalCreateTaskResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.CreateTaskID {
		return nil, consts.ErrInvalidInput
	}

	r := &CreateTaskResult{}
	p := codec.NewReader(b[1:], 4096)

	p.UnpackID(true, &r.TaskID)
	p.UnpackAddress(&r.Creator)
	r.BountyAmount = p.UnpackUint64(true)
	r.Deadline = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

// ============================================================================
// SubmitTask Action
// ============================================================================

// SubmitTask submits task completion with optional ZK proof
type SubmitTask struct {
	TaskID       ids.ID `json:"task_id"`
	Result       []byte `json:"result"`
	ZKProof      []byte `json:"zk_proof"`
	PublicInputs []byte `json:"public_inputs"`
}

func (*SubmitTask) GetTypeID() uint8 {
	return consts.SubmitTaskID
}

func (s *SubmitTask) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.TaskKey(s.TaskID)): state.Read | state.Write,
		string(storage.ReputationKey(actor)): state.Read | state.Write,
	}
}

func (s *SubmitTask) Bytes() []byte {
	p := codec.NewWriter(4096, 8192)
	p.PackByte(consts.SubmitTaskID)
	p.PackID(s.TaskID)
	p.PackUint64(uint64(len(s.Result)))
	p.PackFixedBytes(s.Result)
	p.PackUint64(uint64(len(s.ZKProof)))
	p.PackFixedBytes(s.ZKProof)
	p.PackUint64(uint64(len(s.PublicInputs)))
	p.PackFixedBytes(s.PublicInputs)
	return p.Bytes()
}

func UnmarshalSubmitTask(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.SubmitTaskID {
		return nil, consts.ErrInvalidInput
	}

	s := &SubmitTask{}
	p := codec.NewReader(bytes[1:], 8192)

	p.UnpackID(true, &s.TaskID)
	resultLen := p.UnpackUint64(true)
	s.Result = make([]byte, resultLen)
	if resultLen > 0 {
		p.UnpackFixedBytes(int(resultLen), &s.Result)
	}
	proofLen := p.UnpackUint64(true)
	s.ZKProof = make([]byte, proofLen)
	if proofLen > 0 {
		p.UnpackFixedBytes(int(proofLen), &s.ZKProof)
	}
	inputsLen := p.UnpackUint64(true)
	s.PublicInputs = make([]byte, inputsLen)
	if inputsLen > 0 {
		p.UnpackFixedBytes(int(inputsLen), &s.PublicInputs)
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return s, nil
}

func (s *SubmitTask) Execute(
	ctx context.Context,
	rules chain.Rules,
	mu state.Mutable,
	timestamp int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	// ===== VALIDATION PHASE =====

	// 1. Get task
	task, err := storage.GetTask(ctx, mu, s.TaskID)
	if err != nil {
		return nil, consts.ErrTaskNotFound
	}

	// 2. Validate task status
	if task.Status != storage.TaskStatusOpen {
		return nil, consts.ErrTaskAlreadyCompleted
	}

	// 3. Validate deadline
	if timestamp > task.Deadline {
		// Mark task as expired
		task.Status = storage.TaskStatusExpired
		if err := storage.SetTask(ctx, mu, s.TaskID, task); err != nil {
			return nil, err
		}
		return nil, consts.ErrTaskExpired
	}

	// 4. Validate submitter is not creator
	if actor == task.Creator {
		return nil, consts.ErrTaskCreatorCannotSubmit
	}

	// 5. Validate ZK proof if required
	if task.RequireZKProof {
		if len(s.ZKProof) == 0 {
			return nil, consts.ErrInvalidProof
		}
		// TODO: Implement actual ZK proof verification
		// if err := verifyZKProof(s.ZKProof, s.PublicInputs, task.ProofRequirements); err != nil {
		// 	return nil, consts.ErrProofVerificationFailed
		// }
	}

	// ===== EXECUTION PHASE =====

	// 6. Mark task as completed
	if err := storage.SubmitTaskCompletion(ctx, mu, s.TaskID, actor, s.Result, timestamp); err != nil {
		return nil, fmt.Errorf("failed to submit task: %w", err)
	}

	// 7. Release bounty to submitter
	if err := storage.ReleaseBounty(ctx, mu, s.TaskID); err != nil {
		return nil, fmt.Errorf("failed to release bounty: %w", err)
	}

	// 8. Update reputation
	success := true
	if err := storage.UpdateReputation(ctx, mu, actor, success, timestamp); err != nil {
		return nil, fmt.Errorf("failed to update reputation: %w", err)
	}

	// 9. Return result
	result := &SubmitTaskResult{
		TaskID:      s.TaskID,
		Submitter:   actor,
		BountyAmount: task.BountyAmount,
		ReputationBoost: 10, // Base boost for task completion
	}

	return result.Bytes(), nil
}

func (*SubmitTask) ComputeUnits(chain.Rules) uint64 {
	return consts.SubmitTaskComputeUnits
}

func (*SubmitTask) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

// SubmitTaskResult is returned after task submission
type SubmitTaskResult struct {
	TaskID          ids.ID        `json:"task_id"`
	Submitter       codec.Address `json:"submitter"`
	BountyAmount    uint64        `json:"bounty_amount"`
	ReputationBoost int64         `json:"reputation_boost"`
}

func (*SubmitTaskResult) GetTypeID() uint8 {
	return consts.SubmitTaskID
}

func (r *SubmitTaskResult) Bytes() []byte {
	p := codec.NewWriter(128, 256)
	p.PackByte(consts.SubmitTaskID)
	p.PackID(r.TaskID)
	p.PackAddress(r.Submitter)
	p.PackUint64(r.BountyAmount)
	p.PackInt64(r.ReputationBoost)
	return p.Bytes()
}

func UnmarshalSubmitTaskResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.SubmitTaskID {
		return nil, consts.ErrInvalidInput
	}

	r := &SubmitTaskResult{}
	p := codec.NewReader(b[1:], 256)

	p.UnpackID(true, &r.TaskID)
	p.UnpackAddress(&r.Submitter)
	r.BountyAmount = p.UnpackUint64(true)
	r.ReputationBoost = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}
