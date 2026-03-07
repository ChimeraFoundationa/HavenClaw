/**
 * @title Proof Verification Script
 * @notice Verifies Zero-Knowledge proofs off-chain
 * 
 * Usage:
 *   npm run verify-proof
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'zk', 'build');

/**
 * Verify a ZK proof
 * 
 * @param {Object} proof - Groth16 proof
 * @param {Array} publicSignals - Public signals
 * @returns {Promise<boolean>} Verification result
 */
async function verifyProof(proof, publicSignals) {
    console.log('🔍 Verifying ZK Proof...\n');

    // Load verification key
    const vKeyPath = path.join(BUILD_DIR, 'vkey.json');
    if (!fs.existsSync(vKeyPath)) {
        throw new Error('Verification key not found. Run "npm run setup" first.');
    }

    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));

    // Convert proof to snarkjs format
    const snarkProof = {
        pi_a: [
            proof.a[0].toString(),
            proof.a[1].toString()
        ],
        pi_b: [
            [proof.b[0][1].toString(), proof.b[0][0].toString()],
            [proof.b[1][1].toString(), proof.b[1][0].toString()]
        ],
        pi_c: [
            proof.c[0].toString(),
            proof.c[1].toString()
        ]
    };

    // Convert public signals to string array
    const signals = publicSignals.map(s => s.toString());

    // Verify
    const isValid = await snarkjs.groth16.verify(vKey, signals, snarkProof);

    console.log(`Verification Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

    return isValid;
}

// Main execution
async function main() {
    try {
        // Load latest proof file
        const proofsDir = path.join(__dirname, '..', 'zk', 'proofs');
        if (!fs.existsSync(proofsDir)) {
            throw new Error('No proofs found. Run "npm run generate-proof" first.');
        }

        const files = fs.readdirSync(proofsDir).filter(f => f.endsWith('.json'));
        if (files.length === 0) {
            throw new Error('No proof files found.');
        }

        const latestProof = files[files.length - 1];
        console.log(`📂 Loading proof: ${latestProof}\n`);

        const proofData = JSON.parse(
            fs.readFileSync(path.join(proofsDir, latestProof), 'utf8')
        );

        // Verify
        const isValid = await verifyProof(proofData.proof, proofData.publicInputs);

        console.log('📊 Proof Details:');
        console.log(`   Capability: ${proofData.capabilityName}`);
        console.log(`   Accuracy: ${proofData.accuracyScore}%`);
        console.log(`   Threshold: ${proofData.threshold}%`);
        console.log(`   Agent: ${proofData.agentAddress}`);
        console.log(`   Valid: ${isValid}`);

        if (!isValid) {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

module.exports = { verifyProof };

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
