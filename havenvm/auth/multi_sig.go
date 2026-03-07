// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package auth

import (
	"bytes"
	"context"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/ava-labs/hypersdk/examples/havenvm/consts"
)

var _ chain.Auth = (*MultiSig)(nil)

type MultiSig struct {
	Threshold  uint8           `json:"threshold"`
	Signers    []codec.Address `json:"signers"`
	Signatures []ed25519.Signature `json:"signatures"`
}

func (m *MultiSig) GetTypeID() uint8 {
	return consts.MultiSigAuthID
}

func (m *MultiSig) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (m *MultiSig) Actor() codec.Address {
	addr, _ := deriveMultiSigAddress(m.Signers, m.Threshold)
	return addr
}

func (m *MultiSig) Sponsor() codec.Address {
	return m.Actor()
}

func (m *MultiSig) Bytes() []byte {
	p := codec.NewWriter(256, 1024)
	p.PackByte(consts.MultiSigAuthID)
	p.PackUint64(uint64(m.Threshold))
	p.PackUint64(uint64(len(m.Signers)))
	for _, signer := range m.Signers {
		p.PackAddress(signer)
	}
	p.PackUint64(uint64(len(m.Signatures)))
	for _, sig := range m.Signatures {
		p.PackFixedBytes(sig[:])
	}
	return p.Bytes()
}

func (m *MultiSig) AsyncVerify(ctx context.Context) error {
	if m.Threshold == 0 {
		return fmt.Errorf("threshold must be positive: %w", consts.ErrInvalidMultiSigThreshold)
	}
	if int(m.Threshold) > len(m.Signers) {
		return fmt.Errorf("threshold > signers: %w", consts.ErrInvalidMultiSigThreshold)
	}
	if len(m.Signatures) < int(m.Threshold) {
		return fmt.Errorf("insufficient signatures: %w", consts.ErrInsufficientSignatures)
	}
	if !areAddressesSorted(m.Signers) {
		return consts.ErrInvalidSignerOrder
	}
	if hasDuplicateAddress(m.Signers) {
		return consts.ErrDuplicateSigner
	}
	for i, sig := range m.Signatures {
		if sig == (ed25519.Signature{}) {
			return fmt.Errorf("signature %d invalid: %w", i, consts.ErrInvalidSignature)
		}
	}
	return nil
}

func (m *MultiSig) Verify(ctx context.Context, txBytes []byte) error {
	for i, sig := range m.Signatures {
		if i >= len(m.Signers) {
			break
		}
		var pk ed25519.PublicKey
		copy(pk[:], m.Signers[i][:])
		if !ed25519.Verify(txBytes, pk, sig) {
			return fmt.Errorf("signature %d failed: %w", i, consts.ErrInvalidSignature)
		}
	}
	return nil
}

func (m *MultiSig) ComputeUnits(chain.Rules) uint64 {
	return consts.MultiSigBaseComputeUnits + uint64(len(m.Signers))*consts.MultiSigPerSignerUnits
}

func UnmarshalMultiSig(bytes []byte) (chain.Auth, error) {
	if len(bytes) == 0 || bytes[0] != consts.MultiSigAuthID {
		return nil, consts.ErrInvalidInput
	}

	m := &MultiSig{}
	p := codec.NewReader(bytes[1:], 1024)

	m.Threshold = uint8(p.UnpackUint64(true))
	numSigners := p.UnpackUint64(true)
	m.Signers = make([]codec.Address, numSigners)
	for i := 0; i < int(numSigners); i++ {
		p.UnpackAddress(&m.Signers[i])
	}

	numSigs := p.UnpackUint64(true)
	m.Signatures = make([]ed25519.Signature, numSigs)
	for i := 0; i < int(numSigs); i++ {
		var sigBytes []byte
		p.UnpackFixedBytes(ed25519.SignatureLen, &sigBytes)
		copy(m.Signatures[i][:], sigBytes)
	}

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return m, nil
}

func deriveMultiSigAddress(signers []codec.Address, threshold uint8) (codec.Address, error) {
	p := codec.NewWriter(256, 1024)
	p.PackByte(threshold)
	p.PackUint64(uint64(len(signers)))
	for _, signer := range signers {
		p.PackAddress(signer)
	}
	data := p.Bytes()
	hash := ids.ID(data)
	var addr codec.Address
	copy(addr[:], hash[:])
	return addr, nil
}

func areAddressesSorted(addrs []codec.Address) bool {
	for i := 1; i < len(addrs); i++ {
		if bytes.Compare(addrs[i-1][:], addrs[i][:]) >= 0 {
			return false
		}
	}
	return true
}

func hasDuplicateAddress(addrs []codec.Address) bool {
	seen := make(map[string]bool)
	for _, addr := range addrs {
		key := string(addr[:])
		if seen[key] {
			return true
		}
		seen[key] = true
	}
	return false
}
