// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/ava-labs/avalanchego/utils/logging"
	"github.com/ava-labs/avalanchego/utils/ulimit"
	"github.com/ava-labs/avalanchego/vms/rpcchainvm"
	"github.com/spf13/cobra"

	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/snow"

	hvm "github.com/ava-labs/hypersdk/examples/havenvm/vm"
)

var rootCmd = &cobra.Command{
	Use:        "havenvm",
	Short:      "HavenVM",
	SuggestFor: []string{"havenvm"},
	RunE:       runFunc,
}

func init() {
	cobra.EnablePrefixMatching = true
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "havenvm failed %v\n", err)
		os.Exit(1)
	}
	os.Exit(0)
}

func runFunc(*cobra.Command, []string) error {
	if err := ulimit.Set(ulimit.DefaultFDLimit, logging.NoLog{}); err != nil {
		return fmt.Errorf("%w: failed to set fd limit", err)
	}

	factory, err := hvm.New()
	if err != nil {
		return err
	}

	return rpcchainvm.Serve(context.TODO(), snow.NewSnowVM[*chain.ExecutionBlock, *chain.OutputBlock, *chain.OutputBlock]("v1.0.0", factory))
}
