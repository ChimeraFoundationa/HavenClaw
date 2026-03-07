#!/bin/bash
# 6G Capability Proof - PLONK Setup Script
# PLONK uses universal trusted setup - can be reused for any circuit

set -e

CIRCOM="/root/.cargo/bin/circom"
BUILD_DIR="/root/soft/contracts/zk/build"
CIRCUIT_NAME="6g_capability_proof"

echo "========================================"
echo "6G Capability Proof - PLONK Setup"
echo "========================================"

cd "$BUILD_DIR"

echo ""
echo "[1/6] Generating Universal Trusted Setup (Phase 1)..."
echo "      This is reusable for any circuit up to 2^14 constraints"
npx snarkjs powersoftau new bn128 14 pot14_0000.ptau -v

echo ""
echo "[2/6] Contributing to Phase 1..."
echo "6g_capability_proof_plonk_contribution" | npx snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="PLONK 6G Capability" -v

echo ""
echo "[3/6] Preparing Phase 1 (final)..."
npx snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v

echo ""
echo "[4/6] Running PLONK Setup (circuit-specific)..."
npx snarkjs plonk setup ${CIRCUIT_NAME}.r1cs pot14_final.ptau ${CIRCUIT_NAME}_plonk.zkey -v

echo ""
echo "[5/6] Exporting Verification Key..."
npx snarkjs zkey export verificationkey ${CIRCUIT_NAME}_plonk.zkey vkey_plonk.json

echo ""
echo "[6/6] Exporting Solidity Verifier..."
npx snarkjs zkey export solidityverifier ${CIRCUIT_NAME}_plonk.zkey verifier_plonk.sol

echo ""
echo "========================================"
echo "PLONK Setup Complete!"
echo "========================================"
echo ""
echo "Generated files in ${BUILD_DIR}:"
echo "  - pot14_final.ptau (universal trusted setup)"
echo "  - ${CIRCUIT_NAME}_plonk.zkey (PLONK proving key)"
echo "  - vkey_plonk.json (verification key)"
echo "  - verifier_plonk.sol (Solidity verifier)"
echo ""
echo "Next: Generate proof with 'node zk/scripts/generate-plonk-proof.js'"
