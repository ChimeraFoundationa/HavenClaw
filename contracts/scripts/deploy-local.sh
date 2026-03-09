#!/bin/bash
# OpenClaw Protocol - Local Anvil Deployment Script
# Usage: ./scripts/deploy-local.sh

set -e

echo "========================================"
echo "  OpenClaw Protocol - Local Deployment"
echo "========================================"
echo ""

# Check if anvil is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo "❌ Anvil is not running. Starting anvil..."
    anvil --port 8545 --mnemonic "test test test test test test test test test test test junk" &
    ANVIL_PID=$!
    sleep 3
    echo "✓ Anvil started (PID: $ANVIL_PID)"
else
    echo "✓ Anvil is already running"
fi

echo ""
echo "📋 Deployment Configuration:"
echo "  - RPC URL: http://localhost:8545"
echo "  - Chain ID: 31337"
echo "  - Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""

# Set environment variables
export RPC_URL="http://localhost:8545"
export DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Deploy mock token first
echo "📦 Step 1: Deploying Mock HAVEN Token..."
cat > /tmp/MockToken.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MockToken is ERC20 {
    constructor() ERC20("HAVEN", "HAVEN") {
        _mint(msg.sender, 10000000 * 1e18);
    }
}
EOF

forge create /tmp/MockToken.sol:MockToken \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --json > /tmp/deploy_output.json 2>/dev/null

TOKEN_ADDRESS=$(cat /tmp/deploy_output.json | grep -o '"deployedTo":"[^"]*"' | cut -d'"' -f4)
echo "  ✓ Mock Token deployed at: $TOKEN_ADDRESS"

# Export staking token address
export STAKING_TOKEN_ADDRESS=$TOKEN_ADDRESS

# Deploy OpenClaw Protocol
echo ""
echo "📦 Step 2: Deploying OpenClaw Protocol..."
forge script script/DeployOpenClaw.s.sol:DeployOpenClaw \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast \
    --json > /tmp/protocol_deploy.json 2>/dev/null

echo "  ✓ OpenClaw Protocol deployed"

# Parse deployment output
echo ""
echo "========================================"
echo "  🎉 Deployment Complete!"
echo "========================================"
echo ""

# Clean up
rm -f /tmp/MockToken.sol /tmp/deploy_output.json

echo "📝 Contract Addresses (Local Anvil):"
echo "  ┌─────────────────────────────────────────────────┐"
echo "  │ Token:            $TOKEN_ADDRESS │"
echo "  └─────────────────────────────────────────────────┘"
echo ""
echo "🔧 To interact with contracts:"
echo "  - Use cast with --rpc-url http://localhost:8545"
echo "  - Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "🧪 Run tests:"
echo "  forge test --rpc-url http://localhost:8545"
echo ""
echo "========================================"

# Keep anvil running if we started it
if [ ! -z "$ANVIL_PID" ]; then
    echo ""
    echo "ℹ️  Anvil is running in background (PID: $ANVIL_PID)"
    echo "   To stop: kill $ANVIL_PID"
fi
