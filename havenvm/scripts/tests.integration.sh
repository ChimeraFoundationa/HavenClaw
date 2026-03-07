#!/bin/bash
set -euo pipefail

# Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

# HavenVM Integration Test Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
TIMEOUT="10m"
VERBOSE=false
PARALLEL=2

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v    Verbose output"
            echo "  --timeout        Test timeout (default: 10m)"
            echo "  --parallel N     Run tests in parallel (default: 2)"
            echo "  --help           Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if VM binary exists
    if [ ! -f "$PROJECT_DIR/build/havenvm" ]; then
        log_warn "VM binary not found. Building first..."
        "$SCRIPT_DIR/build.sh"
    fi
    
    # Check Go
    if ! command -v go &> /dev/null; then
        log_error "Go is not installed"
        exit 1
    fi
}

run_integration_tests() {
    log_info "Running integration tests (timeout: $TIMEOUT)..."
    
    cd "$PROJECT_DIR"
    
    TEST_FLAGS="-timeout=$TIMEOUT -p=$PARALLEL"
    
    if [ "$VERBOSE" = true ]; then
        TEST_FLAGS="$TEST_FLAGS -v"
    fi
    
    # Run integration tests
    go test $TEST_FLAGS ./tests/integration/...
    
    if [ $? -eq 0 ]; then
        log_info "Integration tests passed!"
    else
        log_error "Integration tests failed!"
        exit 1
    fi
}

main() {
    log_info "Starting HavenVM integration tests..."
    
    check_prerequisites
    run_integration_tests
    
    log_info "Integration tests complete!"
}

main "$@"
