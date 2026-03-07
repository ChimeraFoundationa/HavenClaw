// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package auth

import (
	"context"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/ava-labs/hypersdk/examples/havenvm/consts"
)

var _ chain.Auth = (*TokenBoundAccount)(nil)

type TokenBoundAccount struct {
	NFTContract codec.Address       `json:"nft_contract"`
	TokenID     uint64              `json:"token_id"`
	ChainID     uint32              `json:"chain_id"`
	Signature   ed25519.Signature   `json:"signature"`
}

func (t *TokenBoundAccount) GetTypeID() uint8 {
	return consts.TokenBoundAccountAuthID
}

func (t *TokenBoundAccount) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

func (t *TokenBoundAccount) Actor() codec.Address {
	addr, _ := deriveTBAAddress(t.NFTContract, t.TokenID, t.ChainID)
	return addr
}

func (t *TokenBoundAccount) Sponsor() codec.Address {
	return t.Actor()
}

func (t *TokenBoundAccount) Bytes() []byte {
	p := codec.NewWriter(128, 256)
	p.PackByte(consts.TokenBoundAccountAuthID)
	p.PackAddress(t.NFTContract)
	p.PackUint64(t.TokenID)
	p.PackUint64(uint64(t.ChainID))
	p.PackFixedBytes(t.Signature[:])
	return p.Bytes()
}

func (t *TokenBoundAccount) AsyncVerify(ctx context.Context) error {
	if t.Signature == (ed25519.Signature{}) {
		return consts.ErrInvalidSignature
	}
	return nil
}

func (t *TokenBoundAccount) Verify(ctx context.Context, txBytes []byte) error {
	var pk ed25519.PublicKey
	copy(pk[:], t.NFTContract[:])
	if !ed25519.Verify(txBytes, pk, t.Signature) {
		return consts.ErrInvalidSignature
	}
	return nil
}

func (t *TokenBoundAccount) ComputeUnits(chain.Rules) uint64 {
	return consts.TBAAuthComputeUnits
}

func UnmarshalTokenBoundAccount(bytes []byte) (chain.Auth, error) {
	if len(bytes) == 0 || bytes[0] != consts.TokenBoundAccountAuthID {
		return nil, consts.ErrInvalidInput
	}

	t := &TokenBoundAccount{}
	p := codec.NewReader(bytes[1:], 256)

	p.UnpackAddress(&t.NFTContract)
	t.TokenID = p.UnpackUint64(true)
	t.ChainID = uint32(p.UnpackUint64(true))
	var sigBytes []byte
	p.UnpackFixedBytes(ed25519.SignatureLen, &sigBytes)
	copy(t.Signature[:], sigBytes)

	if p.Err() != nil {
		return nil, fmt.Errorf("unpack error: %w", p.Err())
	}

	return t, nil
}

func deriveTBAAddress(nftContract codec.Address, tokenID uint64, chainID uint32) (codec.Address, error) {
	p := codec.NewWriter(128, 256)
	p.PackAddress(nftContract)
	p.PackUint64(tokenID)
	p.PackUint64(uint64(chainID))
	data := p.Bytes()
	hash := ids.ID(data)
	var addr codec.Address
	copy(addr[:], hash[:])
	return addr, nil
}
