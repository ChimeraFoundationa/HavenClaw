#!/bin/bash
# HavenClaw Build Script using tsup
set -e

echo "🏛️ Building HavenClaw with tsup..."

# Clean previous build
rm -rf dist

# Run tsup
npx tsup --config tsup.config.ts

# Make entry script executable
chmod +x havenclaw.mjs

echo ""
echo "✅ Build complete!"
echo ""
echo "Output directory: dist/"
ls -la dist/
