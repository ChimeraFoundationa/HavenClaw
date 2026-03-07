// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package vm

import (
	"errors"

	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/examples/havenvm/actions"
	havenauth "github.com/ava-labs/hypersdk/examples/havenvm/auth"
	"github.com/ava-labs/hypersdk/examples/havenvm/genesis"
	"github.com/ava-labs/hypersdk/examples/havenvm/storage"
	"github.com/ava-labs/hypersdk/state/metadata"
	"github.com/ava-labs/hypersdk/vm"
	"github.com/ava-labs/hypersdk/vm/defaultvm"
)

var (
	ActionParser   *codec.TypeParser[chain.Action]
	AuthParser     *codec.TypeParser[chain.Auth]
	OutputParser   *codec.TypeParser[codec.Typed]
	Parser         *chain.TxTypeParser
)

func init() {
	ActionParser = codec.NewTypeParser[chain.Action]()
	AuthParser = codec.NewTypeParser[chain.Auth]()
	OutputParser = codec.NewTypeParser[codec.Typed]()

	// Register Actions
	if err := errors.Join(
		ActionParser.Register(&actions.AgentRegister{}, actions.UnmarshalAgentRegister),
		ActionParser.Register(&actions.AgentUpdate{}, actions.UnmarshalAgentUpdate),
		ActionParser.Register(&actions.Transfer{}, actions.UnmarshalTransfer),
		ActionParser.Register(&actions.CreateTask{}, actions.UnmarshalCreateTask),
		ActionParser.Register(&actions.SubmitTask{}, actions.UnmarshalSubmitTask),
		ActionParser.Register(&actions.CreatePredictionMarket{}, actions.UnmarshalCreatePredictionMarket),
		ActionParser.Register(&actions.PlaceBet{}, actions.UnmarshalPlaceBet),
		ActionParser.Register(&actions.ResolvePrediction{}, actions.UnmarshalResolvePrediction),
		ActionParser.Register(&actions.Stake{}, actions.UnmarshalStake),
		ActionParser.Register(&actions.Vote{}, actions.UnmarshalVote),
		ActionParser.Register(&actions.Delegate{}, actions.UnmarshalDelegate),
		ActionParser.Register(&actions.WithdrawStake{}, actions.UnmarshalWithdrawStake),
	); err != nil {
		panic(err)
	}

	// Register Auth
	if err := errors.Join(
		AuthParser.Register(&auth.ED25519{}, auth.UnmarshalED25519),
		AuthParser.Register(&auth.SECP256R1{}, auth.UnmarshalSECP256R1),
		AuthParser.Register(&havenauth.TokenBoundAccount{}, havenauth.UnmarshalTokenBoundAccount),
		AuthParser.Register(&havenauth.MultiSig{}, havenauth.UnmarshalMultiSig),
	); err != nil {
		panic(err)
	}

	// Register Outputs
	if err := errors.Join(
		OutputParser.Register(&actions.TransferResult{}, actions.UnmarshalTransferResult),
		OutputParser.Register(&actions.AgentRegisterResult{}, actions.UnmarshalAgentRegisterResult),
	); err != nil {
		panic(err)
	}

	Parser = chain.NewTxTypeParser(ActionParser, AuthParser)
}

func New(options ...vm.Option) (*vm.VM, error) {
	factory := NewFactory()
	return factory.New(options...)
}

func NewFactory() *vm.Factory {
	options := append(defaultvm.NewDefaultOptions())
	return vm.NewFactory(
		&genesis.GenesisFactory{},
		storage.NewHAVENBalanceHandler(),
		metadata.NewDefaultManager(),
		ActionParser,
		AuthParser,
		OutputParser,
		auth.DefaultEngines(),
		options...,
	)
}
