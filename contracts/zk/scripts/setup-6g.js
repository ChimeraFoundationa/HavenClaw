/**
 * @title ZK Setup Script
 * @notice Performs the trusted setup ceremony for the 6G capability proof circuit
 * 
 * This script:
 * 1. Compiles the Circom circuit
 * 2. Generates a powers of tau (phase 1)
 * 3. Performs circuit-specific setup (phase 2)
 * 4. Exports the verification key
 * 5. Extracts IC points for Solidity deployment
 * 
 * Usage:
 *   npm run setup
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const CIRCUIT_NAME = 'simple_6g';

async function main() {
    console.log('🔐 Starting ZK Trusted Setup Ceremony for 6G Capability Proof...\n');
    console.log('   Circuit: 6G Capability Proof (6 capabilities verified simultaneously)');
    console.log('   Public Inputs: 6 (agentId, capabilityHash, avgAccuracy, timestamp, reserved1, reserved2)\n');

    // Ensure build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    // Step 1: Compile the circuit
    console.log('📝 Step 1: Compiling circuit...');
    try {
        execSync(
            `/usr/local/bin/circom ${path.join(__dirname, '..', 'circuits', `${CIRCUIT_NAME}.circom`)} ` +
            `--r1cs --wasm --sym --output-dir ${BUILD_DIR}`,
            { stdio: 'inherit' }
        );
        console.log('✅ Circuit compiled successfully\n');
    } catch (error) {
        console.error('❌ Failed to compile circuit');
        console.error('Make sure circom is installed: /usr/local/bin/circom --version');
        process.exit(1);
    }

    // Step 2: Generate Powers of Tau (Phase 1)
    console.log('🎲 Step 2: Generating Powers of Tau (Phase 1)...');
    await snarkjs.pow.new(
        path.join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`),
        14, // Security parameter (2^14 = 16384 constraints)
        path.join(BUILD_DIR, 'circuit_0000.zkey')
    );
    console.log('✅ Powers of Tau generated\n');

    // Step 3: Contribute to Phase 2 (Circuit-specific)
    console.log('🔑 Step 3: Phase 2 - Circuit specific setup...');
    await snarkjs.zKey.contribute(
        path.join(BUILD_DIR, 'circuit_0000.zkey'),
        path.join(BUILD_DIR, 'circuit_final.zkey'),
        '6G Capability Proof Phase 2',
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
    await snarkjs.zKey.exportSolidityVerifier(
        path.join(BUILD_DIR, 'circuit_final.zkey'),
        path.join(BUILD_DIR, 'verifier.sol')
    );
    console.log('✅ Solidity verifier exported to zk/build/verifier.sol\n');

    // Step 6: Export IC points for on-chain verifier
    console.log('📊 Step 6: Extracting IC points...');
    const zkeyJson = await snarkjs.zKey.exportJson(path.join(BUILD_DIR, 'circuit_final.zkey'));
    
    // Extract IC points in format suitable for Solidity
    const icPoints = {
        numPublicInputs: 6,
        IC: zkeyJson.elements.map(e => ({
            x: e.x,
            y: e.y
        }))
    };
    
    fs.writeFileSync(
        path.join(BUILD_DIR, 'ic_points.json'),
        JSON.stringify(icPoints, null, 2)
    );
    console.log('✅ IC points exported to zk/build/ic_points.json\n');

    // Step 7: Generate sample witness for testing
    console.log('📝 Step 7: Generating sample witness for testing...');
    const sampleInput = {
        agentId: "1234567890123456",
        capabilityHash: "9876543210987654",
        avgAccuracy: "92",
        timestamp: Math.floor(Date.now() / 1000).toString(),
        reserved1: "0",
        reserved2: "0",
        capabilityScores: ["95", "90", "92", "88", "94", "93"],
        thresholds: ["90", "85", "90", "85", "90", "90"],
        modelCommitment: "1111111111111111",
        secretKey: "9999999999999999",
        salt: "7777777777777777"
    };
    
    fs.writeFileSync(
        path.join(BUILD_DIR, 'sample_input.json'),
        JSON.stringify(sampleInput, null, 2)
    );
    console.log('✅ Sample input saved to zk/build/sample_input.json\n');

    console.log('🎉 Trusted Setup Ceremony completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs`);
    console.log(`   - ${BUILD_DIR}/${CIRCUIT_NAME}.wasm`);
    console.log(`   - ${BUILD_DIR}/circuit_0000.zkey`);
    console.log(`   - ${BUILD_DIR}/circuit_final.zkey`);
    console.log(`   - ${BUILD_DIR}/vkey.json`);
    console.log(`   - ${BUILD_DIR}/verifier.sol`);
    console.log(`   - ${BUILD_DIR}/ic_points.json`);
    console.log(`   - ${BUILD_DIR}/sample_input.json`);
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run generate-proof-6g');
    console.log('   2. Update Solidity contract with IC points from ic_points.json');
    console.log('   3. Deploy and verify on-chain');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
