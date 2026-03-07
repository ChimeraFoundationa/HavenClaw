#!/bin/bash
set -euo pipefail

# Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

# HavenVM Stop Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo "[INFO] Stopping HavenVM processes..."
}

# Stop AvalancheGo processes
pkill -f avalanchego 2>/dev/null || true

# Clean up temporary files
rm -rf /tmp/havenvm-* 2>/dev/null || true

log_info "HavenVM network stopped"
