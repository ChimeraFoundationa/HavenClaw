#!/bin/bash
set -euo pipefail

# Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

# HavenVM Local Network Runner

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NETWORK_NAME="havenvm-local"
NUM_VALIDATORS=2
GENESIS_FILE="/tmp/havenvm-genesis.json"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check VM binary
    if [ ! -f "$PROJECT_DIR/build/havenvm" ]; then
        log_warn "VM binary not found. Building..."
        "$SCRIPT_DIR/build.sh"
    fi
    
    # Check AvalancheGo
    if ! command -v avalanchego &> /dev/null; then
        log_error "AvalancheGo is not installed"
        log_error "Please install AvalancheGo: https://docs.avax.network/nodes/build/install-avalanchego"
        exit 1
    fi
}

create_genesis() {
    log_step "Creating genesis configuration..."
    
    cat > "$GENESIS_FILE" << 'EOF'
{
  "stateBranchFactor": 16,
  "customAllocation": [
    {
      "address": "0x00c4cb545f748a28770042f893784ce85b107389004d6a0e0d6d7518eeae1292d9",
      "balance": 1000000000000000
    },
    {
      "address": "0x00bd82f4be137f29222695f693e72a9e85e83510e575a3e485eb306a8ad5999010",
      "balance": 500000000000000
    }
  ],
  "initialRules": {
    "minUnitPrice": {
      "bandwidth": 100,
      "compute": 100,
      "storageRead": 100,
      "storageAllocate": 100,
      "storageWrite": 100
    },
    "unitPriceChangeDenominator": {
      "bandwidth": 48,
      "compute": 48,
      "storageRead": 48,
      "storageAllocate": 48,
      "storageWrite": 48
    },
    "windowTargetUnits": {
      "bandwidth": 20000000,
      "compute": 1000,
      "storageRead": 1000,
      "storageAllocate": 1000,
      "storageWrite": 1000
    },
    "maxBlockUnits": {
      "bandwidth": 1800000,
      "compute": 2000,
      "storageRead": 2000,
      "storageAllocate": 2000,
      "storageWrite": 2000
    },
    "baseComputeUnits": 1,
    "storageKeyReadUnits": 5,
    "storageValueReadUnits": 2,
    "storageKeyAllocateUnits": 20,
    "storageValueAllocateUnits": 5,
    "storageKeyWriteUnits": 10,
    "storageValueWriteUnits": 3,
    "minAgentRegistrationBond": 1000000000000,
    "minPredictionBond": 10000000000000,
    "maxTaskDuration": 1209600,
    "stakeLockPeriod": 604800,
    "minStakeAmount": 100000000000000,
    "proposalBond": 1000000000000000
  }
}
EOF
    
    log_info "Genesis file created: $GENESIS_FILE"
}

start_network() {
    log_step "Starting local network..."
    
    log_info "Network configuration:"
    echo "  - Network name: $NETWORK_NAME"
    echo "  - Validators: $NUM_VALIDATORS"
    echo "  - Genesis: $GENESIS_FILE"
    echo ""
    
    log_warn "This script is a template. For full local network setup, see docs/LOCAL_NETWORK.md"
    log_info "VM binary ready at: $PROJECT_DIR/build/havenvm"
    log_info "To run with AvalancheGo:"
    echo ""
    echo "  avalanchego --chain-config-dir=$GENESIS_FILE"
    echo ""
}

main() {
    log_info "Starting HavenVM local network..."
    
    check_prerequisites
    create_genesis
    start_network
    
    log_info "Local network setup complete!"
}

main "$@"
