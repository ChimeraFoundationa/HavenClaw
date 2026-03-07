#!/bin/bash

# HavenClaw Test Script
set -e

echo "🏛️ Running HavenClaw Tests..."

# Run tests
if command -v pnpm &> /dev/null; then
    pnpm test "$@"
elif command -v npx &> /dev/null; then
    npx vitest run "$@"
else
    echo "Error: pnpm or npx required"
    exit 1
fi

echo ""
echo "✅ Tests complete!"
