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

// Ensure AgentRegister implements chain.Action
var _ chain.Action = (*AgentRegister)(nil)

// AgentRegister registers a new AI agent on HavenVM
// This is the primary action for creating agent identity
type AgentRegister struct {
	// MetadataURI is the IPFS/data URI for agent metadata (max 1024 bytes)
	MetadataURI string `json:"metadata_uri"`

	// Capabilities lists the agent's capabilities (1-100 items, max 64 bytes each)
	Capabilities []string `json:"capabilities"`

	// Owner is the address that controls this agent
	Owner codec.Address `json:"owner"`
}

// GetTypeID returns the unique type identifier for this action
func (*AgentRegister) GetTypeID() uint8 {
	return consts.AgentRegisterID
}

// StateKeys specifies which state keys this action will access
// This enables parallel execution by detecting conflicts
func (a *AgentRegister) StateKeys(actor codec.Address, actionID ids.ID) state.Keys {
	return state.Keys{
		// Agent registry storage - full access (create new agent)
		string(storage.AgentKey(actor)): state.All,
		// Initialize reputation - full access (create new record)
		string(storage.ReputationKey(actor)): state.All,
	}
}

// Bytes serializes the action to binary format
func (a *AgentRegister) Bytes() []byte {
	p := codec.NewWriter(2048, 4096)
	p.PackByte(consts.AgentRegisterID)
	p.PackString(a.MetadataURI)
	p.PackUint64(uint64(len(a.Capabilities)))
	for _, cap := range a.Capabilities {
		p.PackString(cap)
	}
	p.PackAddress(a.Owner)
	return p.Bytes()
}

// UnmarshalAgentRegister deserializes an AgentRegister action from binary
func UnmarshalAgentRegister(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 {
		return nil, consts.ErrEmptyInput
	}
	if bytes[0] != consts.AgentRegisterID {
		return nil, fmt.Errorf("invalid type ID %d, expected %d: %w", bytes[0], consts.AgentRegisterID, consts.ErrInvalidInput)
	}

	a := &AgentRegister{}
	p := codec.NewReader(bytes[1:], 4096)

	// Unpack metadata URI
	a.MetadataURI = p.UnpackString(true)
	if p.Err() != nil {
		return nil, fmt.Errorf("failed to unpack metadata URI: %w", p.Err())
	}

	// Unpack capabilities count
	numCaps := p.UnpackUint64(true)
	if numCaps > uint64(consts.MaxCapabilities) {
		return nil, fmt.Errorf("too many capabilities (%d > %d): %w", numCaps, consts.MaxCapabilities, consts.ErrTooManyCapabilities)
	}
	if numCaps == 0 {
		return nil, consts.ErrEmptyCapabilities
	}

	// Unpack each capability
	a.Capabilities = make([]string, numCaps)
	for i := 0; i < int(numCaps); i++ {
		cap := p.UnpackString(true)
		if p.Err() != nil {
			return nil, fmt.Errorf("failed to unpack capability %d: %w", i, p.Err())
		}
		if len(cap) == 0 {
			return nil, fmt.Errorf("capability %d cannot be empty: %w", i, consts.ErrInvalidInput)
		}
		a.Capabilities[i] = cap
	}

	// Unpack owner address
	p.UnpackAddress(&a.Owner)
	if p.Err() != nil {
		return nil, fmt.Errorf("failed to unpack owner address: %w", p.Err())
	}

	return a, nil
}

// Execute performs the state transition for agent registration
func (a *AgentRegister) Execute(
	ctx context.Context,
	rules chain.Rules,
	mu state.Mutable,
	timestamp int64,
	actor codec.Address,
	actionID ids.ID,
) ([]byte, error) {
	// ===== VALIDATION PHASE =====

	// 1. Validate metadata URI
	if err := validateMetadataURI(a.MetadataURI); err != nil {
		return nil, fmt.Errorf("invalid metadata URI: %w", err)
	}

	// 2. Validate capabilities
	if err := validateCapabilities(a.Capabilities); err != nil {
		return nil, fmt.Errorf("invalid capabilities: %w", err)
	}

	// 3. Check for duplicate capabilities
	if hasDuplicate(a.Capabilities) {
		return nil, consts.ErrDuplicateCapability
	}

	// 4. Check if agent already registered
	exists, err := storage.AgentExists(ctx, mu, actor)
	if err != nil {
		return nil, fmt.Errorf("failed to check agent existence: %w", err)
	}
	if exists {
		return nil, consts.ErrAgentAlreadyRegistered
	}

	// 5. Validate owner address
	if a.Owner == (codec.Address{}) {
		return nil, consts.ErrInvalidAddress
	}

	// ===== EXECUTION PHASE =====

	// 6. Create agent record
	agent := &storage.Agent{
		ID:           actionID,
		Owner:        a.Owner,
		MetadataURI:  a.MetadataURI,
		Capabilities: make([]string, len(a.Capabilities)),
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
		Reputation:   consts.InitialReputation,
		Verified:     false,
		TaskCount:    0,
		Earnings:     0,
	}
	copy(agent.Capabilities, a.Capabilities)

	// 7. Store agent
	if err := storage.SetAgent(ctx, mu, actor, agent); err != nil {
		return nil, fmt.Errorf("failed to store agent: %w", err)
	}

	// 8. Initialize reputation
	if err := storage.InitializeReputation(ctx, mu, actor); err != nil {
		return nil, fmt.Errorf("failed to initialize reputation: %w", err)
	}

	// 9. Return result with event data
	result := &AgentRegisterResult{
		AgentID:      actionID,
		AgentAddress: actor,
		Owner:        a.Owner,
		Timestamp:    timestamp,
		MetadataURI:  a.MetadataURI,
		Capabilities: a.Capabilities,
	}

	return result.Bytes(), nil
}

// ComputeUnits returns the compute cost for this action
func (*AgentRegister) ComputeUnits(rules chain.Rules) uint64 {
	return consts.AgentRegisterComputeUnits
}

// ValidRange returns the timestamp range when this action is valid
// -1, -1 means always valid
func (*AgentRegister) ValidRange(rules chain.Rules) (int64, int64) {
	return -1, -1
}

// ============================================================================
// Validation Helpers
// ============================================================================

// validateMetadataURI validates the metadata URI format
func validateMetadataURI(uri string) error {
	if len(uri) == 0 {
		return consts.ErrInvalidMetadataURI
	}
	if len(uri) > consts.MaxMetadataURILength {
		return consts.ErrInvalidMetadataURI
	}

	// Check for valid URI schemes
	validSchemes := []string{"ipfs://", "ipns://", "data:", "https://", "http://"}
	hasValidScheme := false
	for _, scheme := range validSchemes {
		if len(uri) >= len(scheme) && uri[:len(scheme)] == scheme {
			hasValidScheme = true
			break
		}
	}

	if !hasValidScheme {
		return fmt.Errorf("invalid URI scheme: %w", consts.ErrInvalidMetadataURI)
	}

	return nil
}

// validateCapabilities validates the capabilities list
func validateCapabilities(capabilities []string) error {
	if len(capabilities) == 0 {
		return consts.ErrEmptyCapabilities
	}
	if len(capabilities) > consts.MaxCapabilities {
		return consts.ErrTooManyCapabilities
	}

	for i, cap := range capabilities {
		if len(cap) == 0 {
			return fmt.Errorf("capability %d is empty: %w", i, consts.ErrInvalidInput)
		}
		if len(cap) > consts.MaxCapabilityLength {
			return fmt.Errorf("capability %d too long (%d > %d): %w", i, len(cap), consts.MaxCapabilityLength, consts.ErrCapabilityTooLong)
		}
	}

	return nil
}

// hasDuplicate checks for duplicate strings in a slice
func hasDuplicate(items []string) bool {
	seen := make(map[string]struct{}, len(items))
	for _, item := range items {
		if _, exists := seen[item]; exists {
			return true
		}
		seen[item] = struct{}{}
	}
	return false
}

// ============================================================================
// AgentRegisterResult - Action Output
// ============================================================================

// AgentRegisterResult is returned after successful agent registration
type AgentRegisterResult struct {
	AgentID      ids.ID        `json:"agent_id"`
	AgentAddress codec.Address `json:"agent_address"`
	Owner        codec.Address `json:"owner"`
	Timestamp    int64         `json:"timestamp"`
	MetadataURI  string        `json:"metadata_uri"`
	Capabilities []string      `json:"capabilities"`
}

// GetTypeID returns the type ID for this result
func (*AgentRegisterResult) GetTypeID() uint8 {
	return consts.AgentRegisterID
}

// Bytes serializes the result to binary
func (r *AgentRegisterResult) Bytes() []byte {
	p := codec.NewWriter(2048, 4096)
	p.PackByte(consts.AgentRegisterID)
	p.PackID(r.AgentID)
	p.PackAddress(r.AgentAddress)
	p.PackAddress(r.Owner)
	p.PackInt64(r.Timestamp)
	p.PackString(r.MetadataURI)
	p.PackUint64(uint64(len(r.Capabilities)))
	for _, cap := range r.Capabilities {
		p.PackString(cap)
	}
	return p.Bytes()
}

// UnmarshalAgentRegisterResult deserializes the result from binary
func UnmarshalAgentRegisterResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 {
		return nil, consts.ErrEmptyInput
	}
	if b[0] != consts.AgentRegisterID {
		return nil, consts.ErrInvalidInput
	}

	r := &AgentRegisterResult{}
	p := codec.NewReader(b[1:], 4096)

	p.UnpackID(true, &r.AgentID)
	p.UnpackAddress(&r.AgentAddress)
	p.UnpackAddress(&r.Owner)
	r.Timestamp = p.UnpackInt64(true)
	r.MetadataURI = p.UnpackString(true)

	numCaps := p.UnpackUint64(true)
	r.Capabilities = make([]string, numCaps)
	for i := 0; i < int(numCaps); i++ {
		r.Capabilities[i] = p.UnpackString(true)
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}
