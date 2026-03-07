#!/bin/bash
# HavenVM Devnet Startup Script

set -e

echo "🚀 Starting HavenVM Devnet..."

# Check if AvalancheGo is installed
if ! command -v avalanchego &> /dev/null; then
    echo "❌ AvalancheGo not found. Please install it first."
    echo "   git clone https://github.com/ava-labs/avalanchego.git"
    echo "   cd avalanchego && ./scripts/build.sh"
    echo "   sudo cp build/avalanchego /usr/local/bin/"
    exit 1
fi

# Check if HavenVM binary exists
if [ ! -f ~/.avalanchego/plugins/havenvm ]; then
    echo "❌ HavenVM binary not found in plugins directory"
    exit 1
fi

# Create necessary directories
mkdir -p ~/.avalanchego/db
mkdir -p ~/.avalanchego/logs

# Stop any existing AvalancheGo processes
echo "📋 Stopping existing AvalancheGo processes..."
pkill -f avalanchego 2>/dev/null || true
sleep 2

# Start AvalancheGo in background
echo "🔗 Starting AvalancheGo with HavenVM..."
nohup avalanchego > ~/.avalanchego/logs/avalanche.log 2>&1 &

# Wait for AvalancheGo to start
echo "⏳ Waiting for AvalancheGo to start..."
sleep 10

# Check if AvalancheGo is running
if pgrep -f avalanchego > /dev/null; then
    echo "✅ AvalancheGo is running!"
    echo ""
    echo "📊 HavenVM Devnet Status:"
    echo "   - HTTP RPC: http://127.0.0.1:9650"
    echo "   - Staking Port: 9651"
    echo "   - Network ID: local"
    echo ""
    echo "🔍 Useful Commands:"
    echo "   # Check node health"
    echo "   curl -X POST http://127.0.0.1:9650/ext/health -H 'content-type:application/json'"
    echo ""
    echo "   # Check if HavenVM is loaded"
    echo "   curl -X POST -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"info.getVMs\"}' -H 'content-type:application/json;' http://127.0.0.1:9650/ext/info"
    echo ""
    echo "   # View logs"
    echo "   tail -f ~/.avalanchego/logs/avalanche.log"
    echo ""
    echo "   # Stop devnet"
    echo "   ./scripts/stop-devnet.sh"
    echo ""
else
    echo "❌ Failed to start AvalancheGo"
    echo "Check logs: tail -f ~/.avalanchego/logs/avalanche.log"
    exit 1
fi
