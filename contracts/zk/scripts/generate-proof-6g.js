/**
 * @title 6G Proof Generation Script
 * @notice Generates Zero-Knowledge proofs for 6G capability verification
 * 
 * This script generates a proof that an AI agent has passed 6 different
 * capability tests with accuracy above thresholds.
 * 
 * Usage:
 *   npm run generate-proof-6g
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const CIRCUIT_NAME = '6g_capability_proof';

/**
 * Generate a 6G ZK proof for agent capabilities
 */
async function generate6GProof() {
    console.log('🔐 Generating 6G ZK Proof...\n');
    console.log('   Proving: Agent has passed 6 capability tests\n');

    // Validate build artifacts exist
    const wasmPath = path.join(BUILD_DIR, `${CIRCUIT_NAME}.wasm`);
    const zkeyPath = path.join(BUILD_DIR, 'circuit_final.zkey');
    const vkeyPath = path.join(BUILD_DIR, 'vkey.json');

    if (!fs.existsSync(wasmPath)) {
        throw new Error('Circuit WASM not found. Run "npm run setup:6g" first.');
    }
    if (!fs.existsSync(zkeyPath)) {
        throw new Error('ZKey not found. Run "npm run setup:6g" first.');
    }

    // ========================================================================
    // Prepare inputs - Real capability scores for an AI agent
    // ========================================================================
    console.log('📊 Preparing inputs...');
    
    // 6 Capabilities being verified (6G = 6 Gates)
    const capabilities = [
        { name: 'Data Analysis', score: 95, threshold: 90 },
        { name: 'Trading', score: 92, threshold: 85 },
        { name: 'Prediction', score: 88, threshold: 85 },
        { name: 'NLP', score: 94, threshold: 90 },
        { name: 'Computer Vision', score: 91, threshold: 90 },
        { name: 'Reasoning', score: 89, threshold: 85 }
    ];

    // Calculate average accuracy
    const avgAccuracy = Math.round(
        capabilities.reduce((sum, c) => sum + c.score, 0) / capabilities.length
    );

    // Generate agent ID and capability hash
    const agentAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const agentId = BigInt('0x' + crypto.createHash('sha256').update(agentAddress).digest('hex').slice(0, 16));
    const capabilityHash = BigInt('0x' + crypto.createHash('sha256').update('6g_capability_v1').digest('hex').slice(0, 16));
    
    // Generate random values
    const timestamp = Math.floor(Date.now() / 1000);
    const modelCommitment = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
    const secretKey = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
    const salt = BigInt('0x' + crypto.randomBytes(16).toString('hex'));

    console.log('\n   Agent Address:', agentAddress);
    console.log('   Agent ID:', agentId.toString());
    console.log('\n   Capability Scores:');
    capabilities.forEach((c, i) => {
        const passed = c.score >= c.threshold ? '✅' : '❌';
        console.log(`     ${i + 1}. ${c.name}: ${c.score}% (threshold: ${c.threshold}%) ${passed}`);
    });
    console.log('\n   Average Accuracy:', avgAccuracy + '%');
    console.log('   Timestamp:', new Date(timestamp * 1000).toISOString());
    console.log('');

    // Prepare circuit input
    const input = {
        agentId: agentId.toString(),
        capabilityHash: capabilityHash.toString(),
        avgAccuracy: avgAccuracy.toString(),
        timestamp: timestamp.toString(),
        reserved1: "0",
        reserved2: "0",
        capabilityScores: capabilities.map(c => c.score.toString()),
        thresholds: capabilities.map(c => c.threshold.toString()),
        modelCommitment: modelCommitment.toString(),
        secretKey: secretKey.toString(),
        salt: salt.toString()
    };

    // ========================================================================
    // Generate witness
    // ========================================================================
    console.log('🔬 Generating witness...');
    const { witness } = await snarkjs.wtns.calculate(input, wasmPath);
    console.log('✅ Witness generated\n');

    // ========================================================================
    // Generate Groth16 proof
    // ========================================================================
    console.log('⚡ Generating Groth16 proof (this may take a moment)...');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);
    console.log('✅ Proof generated\n');

    // ========================================================================
    // Verify proof locally
    // ========================================================================
    console.log('🔍 Verifying proof...');
    const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    if (!isValid) {
        throw new Error('Proof verification failed!');
    }
    console.log('✅ Proof verified successfully\n');

    // ========================================================================
    // Format proof for Solidity
    // ========================================================================
    const solidityProof = {
        a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
        b: [
            [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])], 
            [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
        ],
        c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])]
    };

    const publicInputs = publicSignals.map(s => BigInt(s));

    console.log('📤 Proof Components:');
    console.log('   a:');
    console.log(`     [0] ${solidityProof.a[0]}`);
    console.log(`     [1] ${solidityProof.a[1]}`);
    console.log('   b:');
    console.log(`     [0][0] ${solidityProof.b[0][0]}`);
    console.log(`     [0][1] ${solidityProof.b[0][1]}`);
    console.log(`     [1][0] ${solidityProof.b[1][0]}`);
    console.log(`     [1][1] ${solidityProof.b[1][1]}`);
    console.log('   c:');
    console.log(`     [0] ${solidityProof.c[0]}`);
    console.log(`     [1] ${solidityProof.c[1]}`);
    console.log('\n   Public Inputs (6 values):');
    publicInputs.forEach((pi, i) => {
        console.log(`     [${i}] ${pi}`);
    });
    console.log('');

    // ========================================================================
    // Save proof to file
    // ========================================================================
    const proofsDir = path.join(__dirname, '..', 'proofs');
    if (!fs.existsSync(proofsDir)) {
        fs.mkdirSync(proofsDir, { recursive: true });
    }

    const proofOutput = {
        protocol: 'groth16',
        curve: 'bn128',
        circuit: '6g_capability_proof',
        proof: solidityProof,
        publicInputs: publicInputs.map(b => b.toString()),
        publicSignals: publicSignals,
        input: {
            agentAddress,
            agentId: agentId.toString(),
            capabilityHash: capabilityHash.toString(),
            capabilities: capabilities.map(c => ({
                name: c.name,
                score: c.score,
                threshold: c.threshold,
                passed: c.score >= c.threshold
            })),
            avgAccuracy,
            timestamp
        },
        verification: {
            isValid,
            verifiedAt: new Date().toISOString()
        },
        generatedAt: Date.now()
    };

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const proofFile = path.join(proofsDir, `6g_proof_${timestampStr}.json`);
    
    fs.writeFileSync(proofFile, JSON.stringify(proofOutput, null, 2));
    console.log('✅ Proof saved to:', proofFile);

    // Also save as latest_proof.json for easy access
    fs.writeFileSync(path.join(proofsDir, '6g_latest_proof.json'), JSON.stringify(proofOutput, null, 2));
    console.log('✅ Latest proof saved to: zk/proofs/6g_latest_proof.json\n');

    // ========================================================================
    // Generate Solidity call snippet
    // ========================================================================
    console.log('📝 Solidity Call Snippet:');
    console.log('```solidity');
    console.log('// Use this to verify the proof on-chain');
    console.log('IZKVerifier.Proof memory proof = IZKVerifier.Proof({');
    console.log(`    a: [uint256(${solidityProof.a[0]}), uint256(${solidityProof.a[1]})],`);
    console.log(`    b: [[uint256(${solidityProof.b[0][0]}), uint256(${solidityProof.b[0][1]})],`);
    console.log(`        [uint256(${solidityProof.b[1][0]}), uint256(${solidityProof.b[1][1]})]],`);
    console.log(`    c: [uint256(${solidityProof.c[0]}), uint256(${solidityProof.c[1]})]`);
    console.log('});');
    console.log('');
    console.log('uint256[] memory publicInputs = new uint256[](6);');
    publicInputs.forEach((pi, i) => {
        console.log(`publicInputs[${i}] = ${pi};`);
    });
    console.log('');
    console.log('// Verify the proof');
    console.log('bool isValid = zkVerifier.verifyProofBool(proof, publicInputs);');
    console.log('```');
    console.log('');

    return {
        proof: solidityProof,
        publicInputs,
        publicSignals,
        isValid,
        capabilities,
        avgAccuracy
    };
}

// Main execution
async function main() {
    try {
        await generate6GProof();
        console.log('🎉 6G Proof generation completed successfully!');
        console.log('\n✨ Summary:');
        console.log('   - 6 capabilities verified');
        console.log('   - All thresholds met');
        console.log('   - Proof is valid and ready for on-chain verification');
        console.log('\n📁 Files generated:');
        console.log('   - zk/proofs/6g_latest_proof.json');
        console.log('   - zk/proofs/6g_proof_*.json');
    } catch (error) {
        console.error('❌ Error generating proof:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { generate6GProof };

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
