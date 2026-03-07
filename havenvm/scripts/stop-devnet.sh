#!/bin/bash
# HavenVM Devnet Stop Script

echo "🛑 Stopping HavenVM Devnet..."

# Stop AvalancheGo
pkill -f avalanchego 2>/dev/null || true

# Wait for process to stop
sleep 2

# Check if stopped
if pgrep -f avalanchego > /dev/null; then
    echo "❌ Failed to stop AvalancheGo"
    echo "Try: killall -9 avalanchego"
    exit 1
else
    echo "✅ HavenVM Devnet stopped successfully!"
    echo ""
    echo "📊 To restart:"
    echo "   ./scripts/start-devnet.sh"
fi
