/**
 * @title Proof Generation Script
 * @notice Generates Zero-Knowledge proofs for agent capability verification
 * 
 * This script:
 * 1. Creates a witness from private inputs
 * 2. Generates a Groth16 proof
 * 3. Outputs proof and public signals
 * 
 * Usage:
 *   npm run generate-proof
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUILD_DIR = path.join(__dirname, '..', 'zk', 'build');
const CIRCUIT_NAME = 'minimal_capability';

/**
 * Generate a ZK proof for agent capability
 * 
 * @param {Object} params - Proof parameters
 * @param {string} params.capabilityName - Name of capability (e.g., "data_analysis")
 * @param {number} params.accuracyScore - Accuracy score (0-100)
 * @param {string} params.agentAddress - Agent's address
 * @param {number} params.threshold - Required threshold (e.g., 90)
 * @param {string} params.secretKey - Agent's private key/model weights (as hex string)
 * @returns {Promise<Object>} Proof and public signals
 */
async function generateCapabilityProof({
    capabilityName,
    accuracyScore,
    agentAddress,
    threshold,
    secretKey
}) {
    console.log('🔐 Generating ZK Proof for Capability...\n');

    // Validate inputs
    if (accuracyScore < 0 || accuracyScore > 100) {
        throw new Error('Accuracy score must be between 0 and 100');
    }
    if (threshold < 0 || threshold > 100) {
        throw new Error('Threshold must be between 0 and 100');
    }
    if (accuracyScore < threshold) {
        throw new Error(`Accuracy (${accuracyScore}) must be >= threshold (${threshold})`);
    }

    // Compute public inputs
    const capabilityHash = BigInt('0x' + crypto.createHash('sha256').update(capabilityName).digest('hex').slice(0, 16));
    const agentId = BigInt('0x' + crypto.createHash('sha256').update(agentAddress).digest('hex').slice(0, 16));
    
    // Convert secret key to bigint
    const secretKeyBigInt = BigInt(secretKey.startsWith('0x') ? secretKey : '0x' + secretKey);
    
    // Generate random salt
    const salt = BigInt('0x' + crypto.randomBytes(16).toString('hex'));

    console.log('📊 Input parameters:');
    console.log(`   Capability: ${capabilityName}`);
    console.log(`   Capability Hash: ${capabilityHash.toString()}`);
    console.log(`   Accuracy Score: ${accuracyScore}`);
    console.log(`   Threshold: ${threshold}`);
    console.log(`   Agent: ${agentAddress}`);
    console.log(`   Salt: ${salt.toString()}\n`);

    // Load circuit WASM
    const wasmPath = path.join(BUILD_DIR, `${CIRCUIT_NAME}.wasm`);
    if (!fs.existsSync(wasmPath)) {
        throw new Error('Circuit WASM not found. Run "npm run setup" first.');
    }

    // Generate witness
    console.log('🔬 Generating witness...');
    const input = {
        capabilityHash: capabilityHash.toString(),
        accuracyScore: accuracyScore.toString(),
        secretKey: secretKeyBigInt.toString(),
        threshold: threshold.toString(),
        salt: salt.toString()
    };

    const { witness } = await snarkjs.wtns.calculate(input, wasmPath);
    console.log('✅ Witness generated\n');

    // Load proving key
    const zkeyPath = path.join(BUILD_DIR, 'circuit_final.zkey');
    if (!fs.existsSync(zkeyPath)) {
        throw new Error('ZKey not found. Run "npm run setup" first.');
    }

    // Generate proof
    console.log('⚡ Generating Groth16 proof...');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);
    console.log('✅ Proof generated\n');

    // Verify proof locally
    console.log('🔍 Verifying proof...');
    const vKeyPath = path.join(BUILD_DIR, 'vkey.json');
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    if (!isValid) {
        throw new Error('Proof verification failed!');
    }
    console.log('✅ Proof verified successfully\n');

    // Format proof for Solidity
    const solidityProof = {
        a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
        b: [[BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])], 
            [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]],
        c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])]
    };

    // Convert public signals to bigint array
    const publicInputs = publicSignals.map(s => BigInt(s));

    console.log('📤 Proof components:');
    console.log(`   a: [${solidityProof.a[0]}, ${solidityProof.a[1]}]`);
    console.log(`   b: [[${solidityProof.b[0][0]}, ${solidityProof.b[0][1]}], [${solidityProof.b[1][0]}, ${solidityProof.b[1][1]}]]`);
    console.log(`   c: [${solidityProof.c[0]}, ${solidityProof.c[1]}]`);
    console.log(`   publicInputs: [${publicInputs.join(', ')}]\n`);

    // Save proof to file
    const outputPath = path.join(__dirname, '..', 'zk', 'proofs');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const proofOutput = {
        proof: solidityProof,
        publicInputs: publicInputs.map(b => b.toString()),
        publicSignals: publicSignals,
        capabilityName,
        accuracyScore,
        threshold,
        agentAddress,
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(outputPath, `proof_${capabilityName}_${Date.now()}.json`),
        JSON.stringify(proofOutput, null, 2)
    );

    console.log('✅ Proof saved to zk/proofs/\n');

    return {
        proof: solidityProof,
        publicInputs,
        publicSignals,
        isValid
    };
}

// Main execution
async function main() {
    try {
        // Example: Generate proof for data_analysis capability
        const result = await generateCapabilityProof({
            capabilityName: 'data_analysis',
            accuracyScore: 95,
            agentAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            threshold: 90,
            secretKey: '0x' + crypto.randomBytes(32).toString('hex')
        });

        console.log('🎉 Proof generation completed successfully!');
        console.log(`   Valid: ${result.isValid}`);
        console.log(`   Public Signals: [${result.publicSignals.join(', ')}]`);
    } catch (error) {
        console.error('❌ Error generating proof:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { generateCapabilityProof };

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
