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

var _ chain.Action = (*AgentUpdate)(nil)

// AgentUpdate updates agent metadata or capabilities
type AgentUpdate struct {
	MetadataURI  string   `json:"metadata_uri"`
	Capabilities []string `json:"capabilities"`
}

func (*AgentUpdate) GetTypeID() uint8 {
	return consts.AgentUpdateID
}

func (a *AgentUpdate) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.AgentKey(actor)): state.Read | state.Write,
	}
}

func (a *AgentUpdate) Bytes() []byte {
	p := codec.NewWriter(1024, 4096)
	p.PackByte(consts.AgentUpdateID)
	p.PackString(a.MetadataURI)
	p.PackUint64(uint64(len(a.Capabilities)))
	for _, cap := range a.Capabilities {
		p.PackString(cap)
	}
	return p.Bytes()
}

func UnmarshalAgentUpdate(bytes []byte) (chain.Action, error) {
	if len(bytes) == 0 || bytes[0] != consts.AgentUpdateID {
		return nil, consts.ErrInvalidInput
	}

	a := &AgentUpdate{}
	p := codec.NewReader(bytes[1:], 4096)

	a.MetadataURI = p.UnpackString(true)
	numCaps := p.UnpackUint64(true)

	if numCaps > uint64(consts.MaxCapabilities) {
		return nil, consts.ErrTooManyCapabilities
	}

	a.Capabilities = make([]string, numCaps)
	for i := 0; i < int(numCaps); i++ {
		a.Capabilities[i] = p.UnpackString(true)
		if p.Err() != nil {
			return nil, fmt.Errorf("failed to unpack capability %d: %w", i, p.Err())
		}
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return a, nil
}

func (a *AgentUpdate) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	timestamp int64,
	actor codec.Address,
	_ ids.ID,
) ([]byte, error) {
	agent, err := storage.GetAgent(ctx, mu, actor)
	if err != nil {
		return nil, consts.ErrAgentNotFound
	}

	if a.MetadataURI != "" {
		if err := validateMetadataURI(a.MetadataURI); err != nil {
			return nil, fmt.Errorf("invalid metadata URI: %w", err)
		}
		agent.MetadataURI = a.MetadataURI
	}

	if len(a.Capabilities) > 0 {
		if err := validateCapabilities(a.Capabilities); err != nil {
			return nil, fmt.Errorf("invalid capabilities: %w", err)
		}
		if hasDuplicate(a.Capabilities) {
			return nil, consts.ErrDuplicateCapability
		}
		agent.Capabilities = make([]string, len(a.Capabilities))
		copy(agent.Capabilities, a.Capabilities)
	}

	agent.UpdatedAt = timestamp

	if err := storage.SetAgent(ctx, mu, actor, agent); err != nil {
		return nil, fmt.Errorf("failed to store updated agent: %w", err)
	}

	result := &AgentUpdateResult{
		AgentAddress: actor,
		MetadataURI:  agent.MetadataURI,
		Capabilities: agent.Capabilities,
		UpdatedAt:    timestamp,
	}

	return result.Bytes(), nil
}

func (*AgentUpdate) ComputeUnits(chain.Rules) uint64 {
	return consts.AgentUpdateComputeUnits
}

func (*AgentUpdate) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

type AgentUpdateResult struct {
	AgentAddress codec.Address `json:"agent_address"`
	MetadataURI  string        `json:"metadata_uri"`
	Capabilities []string      `json:"capabilities"`
	UpdatedAt    int64         `json:"updated_at"`
}

func (*AgentUpdateResult) GetTypeID() uint8 {
	return consts.AgentUpdateID
}

func (r *AgentUpdateResult) Bytes() []byte {
	p := codec.NewWriter(1024, 4096)
	p.PackByte(consts.AgentUpdateID)
	p.PackAddress(r.AgentAddress)
	p.PackString(r.MetadataURI)
	p.PackUint64(uint64(len(r.Capabilities)))
	for _, cap := range r.Capabilities {
		p.PackString(cap)
	}
	p.PackInt64(r.UpdatedAt)
	return p.Bytes()
}

func UnmarshalAgentUpdateResult(b []byte) (codec.Typed, error) {
	if len(b) == 0 || b[0] != consts.AgentUpdateID {
		return nil, consts.ErrInvalidInput
	}

	r := &AgentUpdateResult{}
	p := codec.NewReader(b[1:], 4096)

	p.UnpackAddress(&r.AgentAddress)
	r.MetadataURI = p.UnpackString(true)

	numCaps := p.UnpackUint64(true)
	r.Capabilities = make([]string, numCaps)
	for i := 0; i < int(numCaps); i++ {
		r.Capabilities[i] = p.UnpackString(true)
	}

	r.UpdatedAt = p.UnpackInt64(true)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return r, nil
}

