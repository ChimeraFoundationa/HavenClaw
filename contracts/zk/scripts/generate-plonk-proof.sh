#!/bin/bash
# Generate PLONK Proof
# Run after setup-plonk.sh

set -e

BUILD_DIR="/root/soft/contracts/zk/build"
CIRCUIT_NAME="6g_capability_proof"

cd "$BUILD_DIR"

echo "========================================"
echo "Generating PLONK Proof"
echo "========================================"

echo ""
echo "[1/3] Generating Witness..."
cd ${CIRCUIT_NAME}_js
node generate_witness.js ${CIRCUIT_NAME}.wasm ../input.json ../witness.wtns

echo ""
echo "[2/3] Generating PLONK Proof..."
cd ..
npx snarkjs plonk prove ${CIRCUIT_NAME}_plonk.zkey witness.wtns proof_plonk.json public_plonk.json

echo ""
echo "[3/3] Verifying Proof..."
npx snarkjs plonk verify vkey_plonk.json public_plonk.json proof_plonk.json

echo ""
echo "========================================"
echo "PLONK Proof Generated!"
echo "========================================"
echo ""
echo "Generated files:"
echo "  - proof_plonk.json"
echo "  - public_plonk.json"
