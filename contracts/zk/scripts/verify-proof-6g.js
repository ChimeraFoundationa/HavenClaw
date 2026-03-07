/**
 * @title 6G Proof Verification Script
 * @notice Verifies 6G Zero-Knowledge proofs off-chain
 * 
 * Usage:
 *   npm run verify-proof-6g
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const PROOFS_DIR = path.join(__dirname, '..', 'proofs');

/**
 * Verify a 6G ZK proof
 */
async function verify6GProof(proofData) {
    console.log('🔍 Verifying 6G ZK Proof...\n');

    // Load verification key
    const vkeyPath = path.join(BUILD_DIR, 'vkey.json');
    if (!fs.existsSync(vkeyPath)) {
        throw new Error('Verification key not found. Run "npm run setup:6g" first.');
    }

    const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

    // Convert proof to snarkjs format
    const snarkProof = {
        pi_a: [
            proofData.proof.a[0].toString(),
            proofData.proof.a[1].toString()
        ],
        pi_b: [
            [proofData.proof.b[0][1].toString(), proofData.proof.b[0][0].toString()],
            [proofData.proof.b[1][1].toString(), proofData.proof.b[1][0].toString()]
        ],
        pi_c: [
            proofData.proof.c[0].toString(),
            proofData.proof.c[1].toString()
        ]
    };

    // Convert public signals to string array
    const signals = proofData.publicSignals;

    // Verify
    console.log('   Running cryptographic verification...');
    const isValid = await snarkjs.groth16.verify(vKey, signals, snarkProof);

    console.log(`\n   Verification Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

    return isValid;
}

// Main execution
async function main() {
    try {
        // Load latest 6G proof file
        const proofFile = path.join(PROOFS_DIR, '6g_latest_proof.json');
        
        if (!fs.existsSync(proofFile)) {
            throw new Error('No 6G proof found. Run "npm run generate-proof-6g" first.');
        }

        console.log('📂 Loading 6G proof:', proofFile, '\n');

        const proofData = JSON.parse(fs.readFileSync(proofFile, 'utf8'));

        // Display proof info
        console.log('📊 Proof Information:');
        console.log('   Circuit:', proofData.circuit);
        console.log('   Protocol:', proofData.protocol);
        console.log('   Curve:', proofData.curve);
        console.log('   Agent:', proofData.input.agentAddress);
        console.log('   Generated:', new Date(proofData.input.timestamp * 1000).toISOString());
        console.log('');

        console.log('   Capabilities Verified:');
        proofData.input.capabilities.forEach((c, i) => {
            const status = c.passed ? '✅' : '❌';
            console.log(`     ${i + 1}. ${c.name}: ${c.score}% >= ${c.threshold}% ${status}`);
        });
        console.log('');

        console.log('   Average Accuracy:', proofData.input.avgAccuracy + '%');
        console.log('');

        // Verify
        const isValid = await verify6GProof(proofData);

        console.log('📋 Summary:');
        console.log('   Protocol: Groth16');
        console.log('   Curve: BN128');
        console.log('   Public Inputs: 6');
        console.log('   Valid:', isValid);
        console.log('');

        if (!isValid) {
            console.error('❌ Proof verification FAILED!');
            process.exit(1);
        }

        console.log('🎉 6G Proof verification completed successfully!');
        console.log('   The agent has proven knowledge of capabilities without revealing the model.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

module.exports = { verify6GProof };

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
