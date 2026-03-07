// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
)

const (
	appName      = "haven-cli"
	defaultRPC   = "http://127.0.0.1:9650/ext/bc/havenvm"
	defaultChain = "havenvm"
)

var (
	dbDir    string
	rpcURL   string
	chainID  string
	logLevel string
)

func main() {
	rootCmd := &cobra.Command{
		Use:   appName,
		Short: "HavenVM CLI",
		Long:  `Command Line Interface for HavenVM blockchain`,
	}

	rootCmd.PersistentFlags().StringVar(&dbDir, "database", ".haven-cli", "database directory")
	rootCmd.PersistentFlags().StringVar(&rpcURL, "rpc", defaultRPC, "RPC URL")
	rootCmd.PersistentFlags().StringVar(&chainID, "chain", defaultChain, "chain ID")
	rootCmd.PersistentFlags().StringVar(&logLevel, "log", "info", "log level")

	rootCmd.AddCommand(
		keyCmd(),
		versionCmd(),
	)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func initDB() error {
	return os.MkdirAll(dbDir, 0700)
}

func saveKey(name string, priv ed25519.PrivateKey) error {
	if err := initDB(); err != nil {
		return err
	}
	path := filepath.Join(dbDir, name+".json")
	pub := priv.PublicKey()
	data := map[string]string{
		"private_key": hex.EncodeToString(priv[:]),
		"public_key":  hex.EncodeToString(pub[:]),
	}
	bytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, bytes, 0600)
}

func loadKey(name string) (ed25519.PrivateKey, error) {
	path := filepath.Join(dbDir, name+".json")
	bytes, err := os.ReadFile(path)
	if err != nil {
		return ed25519.PrivateKey{}, err
	}
	var data map[string]string
	if err := json.Unmarshal(bytes, &data); err != nil {
		return ed25519.PrivateKey{}, err
	}
	privBytes, err := hex.DecodeString(data["private_key"])
	if err != nil {
		return ed25519.PrivateKey{}, err
	}
	var priv ed25519.PrivateKey
	copy(priv[:], privBytes)
	return priv, nil
}

func listKeys() ([]string, error) {
	if err := initDB(); err != nil {
		return nil, err
	}
	var names []string
	entries, err := os.ReadDir(dbDir)
	if err != nil {
		return names, nil
	}
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".json" {
			names = append(names, e.Name()[:len(e.Name())-5])
		}
	}
	return names, nil
}

func getAddress(priv ed25519.PrivateKey) codec.Address {
	pub := priv.PublicKey()
	var addr codec.Address
	copy(addr[:], pub[:])
	return addr
}

// ============================================================================
// Key Commands
// ============================================================================

func keyCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "key",
		Short: "Manage keys",
	}
	cmd.AddCommand(
		keyGenerateCmd(),
		keyImportCmd(),
		keyExportCmd(),
		keyListCmd(),
		keyAddressCmd(),
	)
	return cmd
}

func keyGenerateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "generate [name]",
		Short: "Generate new key",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			name := args[0]
			priv, err := ed25519.GeneratePrivateKey()
			if err != nil {
				return err
			}
			if err := saveKey(name, priv); err != nil {
				return err
			}
			addr := getAddress(priv)
			fmt.Printf("Generated key '%s'\n", name)
			fmt.Printf("Address: %s\n", addr)
			return nil
		},
	}
}

func keyImportCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "import [name] [private-key]",
		Short: "Import key",
		Args:  cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			name, hexKey := args[0], args[1]
			privBytes, err := hex.DecodeString(hexKey)
			if err != nil {
				return err
			}
			var priv ed25519.PrivateKey
			copy(priv[:], privBytes)
			if err := saveKey(name, priv); err != nil {
				return err
			}
			addr := getAddress(priv)
			fmt.Printf("Imported key '%s'\n", name)
			fmt.Printf("Address: %s\n", addr)
			return nil
		},
	}
}

func keyExportCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "export [name]",
		Short: "Export key",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			priv, err := loadKey(args[0])
			if err != nil {
				return err
			}
			fmt.Printf("Private Key: %s\n", hex.EncodeToString(priv[:]))
			return nil
		},
	}
}

func keyListCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List keys",
		RunE: func(cmd *cobra.Command, args []string) error {
			names, err := listKeys()
			if err != nil {
				return err
			}
			if len(names) == 0 {
				fmt.Println("No keys found")
				return nil
			}
			fmt.Println("Keys:")
			for _, name := range names {
				fmt.Printf("  - %s\n", name)
			}
			return nil
		},
	}
}

func keyAddressCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "address [name]",
		Short: "Get address",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			priv, err := loadKey(args[0])
			if err != nil {
				return err
			}
			addr := getAddress(priv)
			fmt.Printf("Address: %s\n", addr)
			return nil
		},
	}
}

// ============================================================================
// Version Command
// ============================================================================

func versionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("HavenVM CLI v1.0.0")
			fmt.Println("Go 1.23.7")
			fmt.Println("Production Ready")
		},
	}
}
