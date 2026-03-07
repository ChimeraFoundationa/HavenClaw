/**
 * @title ZK Setup Script
 * @notice Performs the trusted setup ceremony for the capability proof circuit
 * 
 * This script:
 * 1. Compiles the Circom circuit
 * 2. Generates a powers of tau (phase 1)
 * 3. Performs circuit-specific setup (phase 2)
 * 4. Exports the verification key
 * 
 * Usage:
 *   npm run setup
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'zk', 'build');
const CIRCUIT_NAME = 'minimal_capability';

async function main() {
    console.log('🔐 Starting ZK Trusted Setup Ceremony...\n');

    // Ensure build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    // Step 1: Compile the circuit
    console.log('📝 Step 1: Compiling circuit...');
    try {
        execSync(
            `circom ${path.join(__dirname, '..', 'zk', 'circuits', `${CIRCUIT_NAME}.circom`)} ` +
            `--r1cs --wasm --sym --output-dir ${BUILD_DIR}`,
            { stdio: 'inherit' }
        );
        console.log('✅ Circuit compiled successfully\n');
    } catch (error) {
        console.error('❌ Failed to compile circuit');
        console.error('Make sure circom is installed: npm install -g circom');
        process.exit(1);
    }

    // Step 2: Generate Powers of Tau (Phase 1)
    console.log('🎲 Step 2: Generating Powers of Tau (Phase 1)...');
    await snarkjs.pow.new(
        path.join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`),
        12, // Security parameter
        path.join(BUILD_DIR, 'circuit_0000.zkey')
    );
    console.log('✅ Powers of Tau generated\n');

    // Step 3: Contribute to Phase 2 (Circuit-specific)
    console.log('🔑 Step 3: Phase 2 - Circuit specific setup...');
    await snarkjs.zKey.contribute(
        path.join(BUILD_DIR, 'circuit_0000.zkey'),
        path.join(BUILD_DIR, 'circuit_final.zkey'),
        'Phase 2 Contribution',
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
    console.log('✅ Phase 2 completed\n');

    // Step 4: Export Verification Key
    console.log('📤 Step 4: Exporting verification key...');
    const vKey = await snarkjs.zKey.exportVerificationKey(
        path.join(BUILD_DIR, 'circuit_final.zkey')
    );
    
    fs.writeFileSync(
        path.join(BUILD_DIR, 'vkey.json'),
        JSON.stringify(vKey, null, 2)
    );
    console.log('✅ Verification key exported to zk/build/vkey.json\n');

    // Step 5: Export Solidity Verifier
    console.log('📜 Step 5: Exporting Solidity verifier...');
    const verifierCode = await snarkjs.zKey.exportSolidityVerifier(
        path.join(BUILD_DIR, 'circuit_final.zkey'),
        path.join(BUILD_DIR, 'verifier.sol')
    );
    console.log('✅ Solidity verifier exported to zk/build/verifier.sol\n');

    // Step 6: Export IC (Input Coefficients) for on-chain verifier
    console.log('📊 Step 6: Extracting IC points...');
    const zkeyData = await snarkjs.zKey.exportSolidityCalldata(
        path.join(BUILD_DIR, 'circuit_final.zkey')
    );
    
    // Parse IC points from zkey
    const zkey = await snarkjs.zKey.exportJson(path.join(BUILD_DIR, 'circuit_final.zkey'));
    
    fs.writeFileSync(
        path.join(BUILD_DIR, 'ic_points.json'),
        JSON.stringify({
            IC: zkey.elements.map(e => ({
                x: e.x,
                y: e.y
            }))
        }, null, 2)
    );
    console.log('✅ IC points exported to zk/build/ic_points.json\n');

    console.log('🎉 Trusted Setup Ceremony completed successfully!');
    console.log('\nGenerated files:');
    console.log(`  - ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs`);
    console.log(`  - ${BUILD_DIR}/${CIRCUIT_NAME}.wasm`);
    console.log(`  - ${BUILD_DIR}/circuit_final.zkey`);
    console.log(`  - ${BUILD_DIR}/vkey.json`);
    console.log(`  - ${BUILD_DIR}/verifier.sol`);
    console.log(`  - ${BUILD_DIR}/ic_points.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
