#!/bin/bash
set -euo pipefail

# Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

# HavenVM Unit Test Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
COVERAGE=false
COVERAGE_FILE="coverage.out"
COVERAGE_HTML="coverage.html"
VERBOSE=false
PARALLEL=4

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --parallel)
            PARALLEL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --coverage         Generate coverage report"
            echo "  --verbose, -v      Verbose output"
            echo "  --parallel N       Run tests in parallel (default: 4)"
            echo "  --help             Show this help"
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

run_tests() {
    log_info "Running unit tests..."
    
    cd "$PROJECT_DIR"
    
    TEST_FLAGS="-timeout=5m -p=$PARALLEL"
    
    if [ "$VERBOSE" = true ]; then
        TEST_FLAGS="$TEST_FLAGS -v"
    fi
    
    if [ "$COVERAGE" = true ]; then
        TEST_FLAGS="$TEST_FLAGS -coverprofile=$COVERAGE_FILE"
    fi
    
    # Run tests
    go test $TEST_FLAGS ./...
    
    if [ $? -eq 0 ]; then
        log_info "All tests passed!"
    else
        log_error "Some tests failed!"
        exit 1
    fi
    
    # Generate coverage report
    if [ "$COVERAGE" = true ]; then
        log_info "Generating coverage report..."
        
        # HTML report
        go tool cover -html="$COVERAGE_FILE" -o "$COVERAGE_HTML"
        
        # Console summary
        go tool cover -func="$COVERAGE_FILE" | tail -1
        
        log_info "Coverage report: $COVERAGE_HTML"
    fi
}

main() {
    log_info "Starting HavenVM unit tests..."
    run_tests
    log_info "Tests complete!"
}

main "$@"
