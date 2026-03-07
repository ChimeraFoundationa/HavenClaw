/**
 * @title PLONK Proof Generation for 6G Capability
 * @notice Generate PLONK ZK proof for AI agent capability verification
 *
 * Usage:
 *   node zk/scripts/generate-plonk-proof.js
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const CIRCUIT_NAME = '6g_capability_proof';

async function generatePLONKProof() {
    console.log('🔐 Generating PLONK ZK Proof...\n');

    const wasmPath = path.join(BUILD_DIR, `${CIRCUIT_NAME}_js`, `${CIRCUIT_NAME}.wasm`);
    const zkeyPath = path.join(BUILD_DIR, `${CIRCUIT_NAME}_plonk.zkey`);
    const vkeyPath = path.join(BUILD_DIR, 'vkey_plonk.json');

    if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM not found: ${wasmPath}\nRun setup-plonk.sh first.`);
    }
    if (!fs.existsSync(zkeyPath)) {
        throw new Error(`ZKey not found: ${zkeyPath}\nRun setup-plonk.sh first.`);
    }

    // ========================================================================
    // Prepare inputs
    // ========================================================================
    console.log('📊 Preparing inputs...');

    const capabilities = [
        { name: 'Data Analysis', score: 95, threshold: 90 },
        { name: 'Trading', score: 92, threshold: 85 },
        { name: 'Prediction', score: 88, threshold: 85 },
        { name: 'NLP', score: 94, threshold: 90 },
        { name: 'Computer Vision', score: 91, threshold: 90 },
        { name: 'Reasoning', score: 93, threshold: 90 }
    ];

    const avgAccuracy = Math.round(capabilities.reduce((sum, c) => sum + c.score, 0) / 6);
    const agentAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const agentId = BigInt('0x' + crypto.createHash('sha256').update(agentAddress).digest('hex').slice(0, 16));
    const capabilityHash = BigInt('0x' + crypto.createHash('sha256').update('6g_capability_v1').digest('hex').slice(0, 16));
    const timestamp = Math.floor(Date.now() / 1000);
    const modelCommitment = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
    const secretKey = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
    const salt = BigInt('0x' + crypto.randomBytes(16).toString('hex'));

    console.log('\n   Agent:', agentAddress);
    console.log('   Avg Accuracy:', avgAccuracy + '%');
    capabilities.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}: ${c.score}% >= ${c.threshold}% ${c.score >= c.threshold ? '✅' : '❌'}`);
    });

    const input = {
        agentId: agentId.toString(),
        capabilityHash: capabilityHash.toString(),
        avgAccuracy: avgAccuracy.toString(),
        timestamp: timestamp.toString(),
        reserved1: "0",
        reserved2: "0",
        score0: capabilities[0].score.toString(),
        score1: capabilities[1].score.toString(),
        score2: capabilities[2].score.toString(),
        score3: capabilities[3].score.toString(),
        score4: capabilities[4].score.toString(),
        score5: capabilities[5].score.toString(),
        thresh0: capabilities[0].threshold.toString(),
        thresh1: capabilities[1].threshold.toString(),
        thresh2: capabilities[2].threshold.toString(),
        thresh3: capabilities[3].threshold.toString(),
        thresh4: capabilities[4].threshold.toString(),
        thresh5: capabilities[5].threshold.toString(),
        modelCommitment: modelCommitment.toString(),
        secretKey: secretKey.toString(),
        salt: salt.toString()
    };

    // ========================================================================
    // Generate witness
    // ========================================================================
    console.log('\n🔬 Generating witness...');
    const { witness } = await snarkjs.wtns.calculate(input, wasmPath);
    console.log('✅ Witness generated');

    // ========================================================================
    // Generate PLONK proof
    // ========================================================================
    console.log('⚡ Generating PLONK proof...');
    const { proof, publicSignals } = await snarkjs.plonk.prove(zkeyPath, witness);
    console.log('✅ PLONK proof generated');

    // ========================================================================
    // Verify proof
    // ========================================================================
    console.log('🔍 Verifying proof...');
    const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.plonk.verify(vKey, publicSignals, proof);

    if (!isValid) {
        throw new Error('PLONK proof verification failed!');
    }
    console.log('✅ PLONK proof verified\n');

    // ========================================================================
    // Format for Solidity
    // ========================================================================
    const solidityProof = {
        A: [BigInt(proof.A[0]), BigInt(proof.A[1])],
        B: [BigInt(proof.B[0]), BigInt(proof.B[1])],
        C: [BigInt(proof.C[0]), BigInt(proof.C[1])],
        Z: [BigInt(proof.Z[0]), BigInt(proof.Z[1])],
        W1: [BigInt(proof.W1[0]), BigInt(proof.W1[1])],
        W2: [BigInt(proof.W2[0]), BigInt(proof.W2[1])],
        W3: [BigInt(proof.W3[0]), BigInt(proof.W3[1])]
    };

    console.log('📤 PLONK Proof Components:');
    console.log('   A:', solidityProof.A.map(x => x.toString()));
    console.log('   B:', solidityProof.B.map(x => x.toString()));
    console.log('   C:', solidityProof.C.map(x => x.toString()));
    console.log('   Z:', solidityProof.Z.map(x => x.toString()));
    console.log('   W1:', solidityProof.W1.map(x => x.toString()));
    console.log('   W2:', solidityProof.W2.map(x => x.toString()));
    console.log('   W3:', solidityProof.W3.map(x => x.toString()));
    console.log('\n   Public Inputs:', publicSignals);

    // ========================================================================
    // Save proof
    // ========================================================================
    const proofsDir = path.join(__dirname, '..', 'proofs');
    if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });

    const proofOutput = {
        protocol: 'plonk',
        curve: 'bn128',
        circuit: CIRCUIT_NAME,
        proof: solidityProof,
        publicSignals,
        input: {
            agentAddress,
            agentId: agentId.toString(),
            capabilities: capabilities.map(c => ({ ...c, passed: c.score >= c.threshold })),
            avgAccuracy,
            timestamp
        },
        verification: { isValid, verifiedAt: new Date().toISOString() },
        generatedAt: Date.now()
    };

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(proofsDir, `plonk_6g_proof_${ts}.json`), JSON.stringify(proofOutput, null, 2));
    fs.writeFileSync(path.join(proofsDir, 'plonk_6g_latest_proof.json'), JSON.stringify(proofOutput, null, 2));
    console.log('\n✅ Proof saved to zk/proofs/plonk_6g_latest_proof.json');

    // Solidity snippet
    console.log('\n📝 Solidity Call Snippet:');
    console.log('```solidity');
    console.log('IPLONKVerifier.PlonkProof memory proof = IPLONKVerifier.PlonkProof({');
    console.log(`    A: [uint256(${solidityProof.A[0]}), uint256(${solidityProof.A[1]})],`);
    console.log(`    B: [uint256(${solidityProof.B[0]}), uint256(${solidityProof.B[1]})],`);
    console.log(`    C: [uint256(${solidityProof.C[0]}), uint256(${solidityProof.C[1]})],`);
    console.log(`    Z: [uint256(${solidityProof.Z[0]}), uint256(${solidityProof.Z[1]})],`);
    console.log(`    W1: [uint256(${solidityProof.W1[0]}), uint256(${solidityProof.W1[1]})],`);
    console.log(`    W2: [uint256(${solidityProof.W2[0]}), uint256(${solidityProof.W2[1]})],`);
    console.log(`    W3: [uint256(${solidityProof.W3[0]}), uint256(${solidityProof.W3[1]})]`);
    console.log('});');
    console.log('');
    console.log('uint256[] memory publicInputs = new uint256[](6);');
    publicSignals.forEach((ps, i) => console.log(`publicInputs[${i}] = ${ps};`));
    console.log('');
    console.log('bool isValid = verifier.verifyProof(proof, publicInputs);');
    console.log('```');

    return { proof: solidityProof, publicSignals, isValid };
}

async function main() {
    try {
        await generatePLONKProof();
        console.log('\n🎉 PLONK proof generation completed!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

module.exports = { generatePLONKProof };
require.main === module && main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
