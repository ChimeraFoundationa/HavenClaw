#!/bin/bash
set -euo pipefail

# Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

# HavenVM Build Script
# Builds the HavenVM binary for production deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Build configuration
BUILD_DIR="${PROJECT_DIR}/build"
BINARY_NAME="havenvm"
DEBUG_MODE=false
RACE_MODE=false
LDFLAGS="-s -w"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            DEBUG_MODE=true
            LDFLAGS=""
            shift
            ;;
        --race)
            RACE_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --debug    Build with debug symbols"
            echo "  --race     Build with race detector"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Go version
    if ! command -v go &> /dev/null; then
        log_error "Go is not installed. Please install Go 1.22.0 or higher."
        exit 1
    fi
    
    GO_VERSION=$(go version | cut -d' ' -f3)
    REQUIRED_VERSION="go1.22"
    if [[ ! "$GO_VERSION" > "$REQUIRED_VERSION" ]]; then
        log_error "Go version $GO_VERSION is not sufficient. Required: $REQUIRED_VERSION"
        exit 1
    fi
    
    log_info "Go version: $GO_VERSION"
}

build_vm() {
    log_info "Building HavenVM..."
    
    # Create build directory
    mkdir -p "$BUILD_DIR"
    
    # Set build flags
    BUILD_FLAGS="-trimpath"
    if [ "$DEBUG_MODE" = true ]; then
        BUILD_FLAGS="-gcflags='all=-N -l'"
        log_warn "Debug mode enabled - binary will be larger and slower"
    fi
    
    if [ "$RACE_MODE" = true ]; then
        BUILD_FLAGS="$BUILD_FLAGS -race"
        log_warn "Race detector enabled - for testing only"
    fi
    
    # Build
    cd "$PROJECT_DIR"
    go build \
        $BUILD_FLAGS \
        -ldflags "$LDFLAGS" \
        -o "$BUILD_DIR/$BINARY_NAME" \
        ./cmd/havenvm
    
    if [ $? -eq 0 ]; then
        log_info "Build successful!"
        log_info "Binary: $BUILD_DIR/$BINARY_NAME"
        
        # Show binary info
        ls -lh "$BUILD_DIR/$BINARY_NAME"
    else
        log_error "Build failed!"
        exit 1
    fi
}

verify_build() {
    log_info "Verifying build..."
    
    if [ ! -f "$BUILD_DIR/$BINARY_NAME" ]; then
        log_error "Binary not found after build"
        exit 1
    fi
    
    # Check if binary is executable
    if [ ! -x "$BUILD_DIR/$BINARY_NAME" ]; then
        log_warn "Binary is not executable, fixing permissions..."
        chmod +x "$BUILD_DIR/$BINARY_NAME"
    fi
    
    log_info "Build verification complete"
}

# Main
main() {
    log_info "Starting HavenVM build..."
    log_info "Project directory: $PROJECT_DIR"
    
    check_prerequisites
    build_vm
    verify_build
    
    log_info "Build complete!"
}

main "$@"
