#!/bin/bash

# HavenClaw Non-Interactive Test Script
# Tests all major CLI commands without user interaction

echo "🏛️ HavenClaw Non-Interactive Test Suite"
echo "========================================"
echo ""

# Configuration
export HAVENCLAW_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export HAVENCLAW_NETWORK="fuji"
HAVENCLAW_BIN="node dist/cli/entry.mjs"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing: $test_name... "
    
    set +e
    output=$(eval "$command" 2>&1)
    exit_code=$?
    set -e
    
    if [ $exit_code -eq 0 ]; then
        if [ -z "$expected_pattern" ] || echo "$output" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✓ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (pattern not found: $expected_pattern)"
            echo "  Output: $output"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (command failed)"
        echo "  Error: $output"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

cd /root/soft/havenclaw

echo "📋 Running CLI Tests..."
echo ""

# Basic Commands
echo -e "${YELLOW}=== Basic Commands ===${NC}"
run_test "Version" "$HAVENCLAW_BIN --version" "1.0.0"
run_test "Help" "$HAVENCLAW_BIN --help" "HavenClaw"
run_test "Doctor" "$HAVENCLAW_BIN doctor" "Health Check"

# Agent Commands
echo ""
echo -e "${YELLOW}=== Agent Commands ===${NC}"
run_test "Agent Help" "$HAVENCLAW_BIN agent --help" "Agent management"
run_test "Agent Info" "$HAVENCLAW_BIN agent info --address 0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC" "Agent Information"

# Task Commands
echo ""
echo -e "${YELLOW}=== Task Commands ===${NC}"
run_test "Task Help" "$HAVENCLAW_BIN task --help" "marketplace"
run_test "Task List" "$HAVENCLAW_BIN task list" "tasks"

# Prediction Commands
echo ""
echo -e "${YELLOW}=== Prediction Commands ===${NC}"
run_test "Prediction Help" "$HAVENCLAW_BIN prediction --help" "market"
run_test "Prediction List" "$HAVENCLAW_BIN prediction list" "markets"

# Governance Commands
echo ""
echo -e "${YELLOW}=== Governance Commands ===${NC}"
run_test "Governance Help" "$HAVENCLAW_BIN governance --help" "governance"
run_test "Governance Stake Help" "$HAVENCLAW_BIN governance stake --help" "stake"

# ZK Commands
echo ""
echo -e "${YELLOW}=== ZK Commands ===${NC}"
run_test "ZK Help" "$HAVENCLAW_BIN zk --help" "knowledge"
run_test "ZK Prove Help" "$HAVENCLAW_BIN zk prove --help" "circuit"

# TBA Commands
echo ""
echo -e "${YELLOW}=== TBA Commands ===${NC}"
run_test "TBA Help" "$HAVENCLAW_BIN tba --help" "Token Bound Account"
run_test "TBA Get" "$HAVENCLAW_BIN tba get" "TBA Address"

# Wallet Commands
echo ""
echo -e "${YELLOW}=== Wallet Commands ===${NC}"
run_test "Wallet Help" "$HAVENCLAW_BIN wallet --help" "Wallet management"
run_test "Wallet Balance" "$HAVENCLAW_BIN wallet balance" "Balance"

# Channels Commands
echo ""
echo -e "${YELLOW}=== Channels Commands ===${NC}"
run_test "Channels Help" "$HAVENCLAW_BIN channels --help" "Messaging channel"
run_test "Channels List" "$HAVENCLAW_BIN channels list" "channel"

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo "  Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
