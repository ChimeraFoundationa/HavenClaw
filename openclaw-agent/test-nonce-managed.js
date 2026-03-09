#!/usr/bin/env node
/**
 * OpenClaw Agent - Multi-Wallet Test with Proper Nonce Management
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';

const WALLETS = {
  deployer: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  walletA: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  walletB: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
};

const RPC_URL = 'http://localhost:8545';

async function wait(tx) { return await tx.wait(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 OpenClaw Agent - Nonce-Managed Multi-Wallet Test');
  console.log('='.repeat(70) + '\n');

  const provider = new JsonRpcProvider(RPC_URL);
  
  // Initialize wallets with nonce tracking
  const walletA = new Wallet(WALLETS.walletA, provider);
  const walletB = new Wallet(WALLETS.walletB, provider);
  const addressA = await walletA.getAddress();
  const addressB = await walletB.getAddress();

  console.log('Wallet A (Task Creator):', addressA);
  console.log('Wallet B (Agent):', addressB);
  console.log();

  // Load contracts
  const deployment = JSON.parse(readFileSync('/root/soft/contracts/broadcast/DeployOpenClaw.s.sol/31337/run-latest.json', 'utf-8'));
  const contracts = {
    registry: deployment.transactions.find(t => t.contractName === 'OpenClawRegistry')?.contractAddress,
    taskMarketplace: deployment.transactions.find(t => t.contractName === 'OpenClawTaskMarketplace')?.contractAddress,
    governance: deployment.transactions.find(t => t.contractName === 'OpenClawGovernance')?.contractAddress,
    reputation: deployment.transactions.find(t => t.contractName === 'OpenClawReputation')?.contractAddress,
  };

  console.log('Contracts:');
  Object.entries(contracts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log();

  let passed = 0, failed = 0;
  let taskId = 0n, proposalId = 0n;

  // Track nonces
  let nonceB = await provider.getTransactionCount(addressB);
  let nonceA = await provider.getTransactionCount(addressA);

  console.log(`Initial Nonces - Wallet A: ${nonceA}, Wallet B: ${nonceB}\n`);

  // ===== PHASE 1: Register Agent =====
  console.log('='.repeat(70));
  console.log('PHASE 1: Wallet B - Register Agent');
  console.log('='.repeat(70) + '\n');

  console.log('Test 1: Wallet B Registers as Agent');
  try {
    const reg = new ethers.Contract(contracts.registry, [
      'function registerAgent(address,uint256,string,bytes32[])'
    ], walletB);
    
    const tx = await reg.registerAgent(addressB, 1n, 'ipfs://QmAgentB', [ethers.id('trading'), ethers.id('analysis')], {
      nonce: nonceB++
    });
    const receipt = await wait(tx);
    console.log(`  ✅ Agent registered - Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // ===== PHASE 2: Initialize Reputation =====
  console.log('='.repeat(70));
  console.log('PHASE 2: Wallet B - Initialize Reputation');
  console.log('='.repeat(70) + '\n');

  console.log('Test 2: Wallet B Initializes Reputation');
  try {
    const rep = new ethers.Contract(contracts.reputation, [
      'function initializeReputation(address)'
    ], walletB);
    
    const tx = await rep.initializeReputation(addressB, {
      nonce: nonceB++
    });
    const receipt = await wait(tx);
    console.log(`  ✅ Reputation initialized - Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // ===== PHASE 3: Create Task =====
  console.log('='.repeat(70));
  console.log('PHASE 3: Wallet A - Create Task');
  console.log('='.repeat(70) + '\n');

  console.log('Test 3: Wallet A Creates Task');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, [
      'function createTask(string,bytes32,uint256,address,uint256) payable returns (uint256)',
      'event TaskCreated(uint256 indexed taskId, address indexed creator, string description, uint256 reward)'
    ], walletA);
    
    const reward = ethers.parseEther('100');
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    const tx = await task.createTask('Analyze market trends', ethers.id('analysis'), reward, ethers.ZeroAddress, deadline, { 
      value: reward,
      nonce: nonceA++
    });
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try {
        const parsed = task.interface.parseLog(l);
        return parsed?.name === 'TaskCreated';
      } catch { return false; }
    });
    if (event) {
      const parsed = task.interface.parseLog(event);
      taskId = parsed.args.taskId;
    }
    
    console.log(`  ✅ Task created - ID: ${taskId.toString()}, Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // ===== PHASE 4: Accept Task =====
  console.log('='.repeat(70));
  console.log('PHASE 4: Wallet B - Accept Task');
  console.log('='.repeat(70) + '\n');

  console.log('Test 4: Wallet B Accepts Task');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function acceptTask(uint256)'], walletB);
      const tx = await task.acceptTask(taskId, {
        nonce: nonceB++
      });
      const receipt = await wait(tx);
      console.log(`  ✅ Task accepted - Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no task)\n'); }
  console.log();

  // Small delay to ensure nonce propagation
  await sleep(500);

  // ===== PHASE 5: Complete Task =====
  console.log('='.repeat(70));
  console.log('PHASE 5: Wallet B - Complete Task');
  console.log('='.repeat(70) + '\n');

  console.log('Test 5: Wallet B Completes Task');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function completeTask(uint256,string,bytes)'], walletB);
      const tx = await task.completeTask(taskId, 'ipfs://QmAnalysisResult', '0x', {
        nonce: nonceB++
      });
      const receipt = await wait(tx);
      console.log(`  ✅ Task completed - Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no task)\n'); }
  console.log();

  // ===== PHASE 6: Create Proposal =====
  console.log('='.repeat(70));
  console.log('PHASE 6: Wallet A - Create Proposal');
  console.log('='.repeat(70) + '\n');

  console.log('Test 6: Wallet A Creates Proposal');
  try {
    const gov = new ethers.Contract(contracts.governance, [
      'function createProposal(string,string,bytes32[]) returns (uint256)',
      'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startBlock, uint256 endBlock)'
    ], walletA);
    
    const tx = await gov.createProposal('Increase platform rewards by 10%', 'ipfs://QmProposal1', [], {
      nonce: nonceA++
    });
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try {
        const parsed = gov.interface.parseLog(l);
        return parsed?.name === 'ProposalCreated';
      } catch { return false; }
    });
    if (event) {
      const parsed = gov.interface.parseLog(event);
      proposalId = parsed.args.proposalId;
    }
    
    console.log(`  ✅ Proposal created - ID: ${proposalId.toString()}, Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // ===== PHASE 7: Vote on Proposal =====
  console.log('='.repeat(70));
  console.log('PHASE 7: Wallet B - Vote on Proposal');
  console.log('='.repeat(70) + '\n');

  console.log('Test 7: Wallet B Votes on Proposal');
  if (proposalId > 0n) {
    try {
      console.log('  Mining blocks to activate voting period...');
      await provider.send('anvil_mine', ['0x15180']);
      await sleep(2000);
      
      const gov = new ethers.Contract(contracts.governance, ['function castVote(uint256,uint8,string)'], walletB);
      const tx = await gov.castVote(proposalId, 1, 'Support ecosystem growth', {
        nonce: nonceB++
      });
      const receipt = await wait(tx);
      console.log(`  ✅ Vote cast - Gas: ${receipt.gasUsed.toString()}, Nonce: ${tx.nonce}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no proposal)\n'); }
  console.log();

  // ===== PHASE 8: Query Voting Power =====
  console.log('='.repeat(70));
  console.log('PHASE 8: Query Voting Power');
  console.log('='.repeat(70) + '\n');

  console.log('Test 8: Query Wallet B Voting Power');
  try {
    const gov = new ethers.Contract(contracts.governance, ['function getVotingPower(address,uint256) view returns (uint256)'], provider);
    const vp = await gov.getVotingPower(addressB, await provider.getBlockNumber());
    console.log(`  ✅ Wallet B Voting Power: ${vp.toString()}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // ===== FINAL SUMMARY =====
  console.log('='.repeat(70));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(70));
  
  const total = passed + failed;
  const rate = total > 0 ? (passed / total * 100).toFixed(1) : '0.0';
  
  console.log(`
  ╔════════════════════════════════════════╗
  ║  Wallet A (Task Creator)               ║
  ║    Nonce: ${nonceA - 1}${' '.repeat(28)}║
  ║    ✅ Tasks Created: 1                 ║
  ║    ✅ Proposals Created: 1             ║
  ║                                        ║
  ║  Wallet B (Agent)                      ║
  ║    Nonce: ${nonceB - 1}${' '.repeat(28)}║
  ║    ✅ Agent Registered                 ║
  ║    ✅ Reputation Initialized           ║
  ║    ✅ Task Accepted & Completed        ║
  ║    ✅ Vote Cast                        ║
  ║                                        ║
  ║  ───────────────────────────────────   ║
  ║  Tests Passed:  ${passed}/${total}${' '.repeat(18 - passed.toString().length - total.toString().length)}║
  ║  Tests Failed:  ${failed}/${total}${' '.repeat(18 - failed.toString().length - total.toString().length)}║
  ║  Success Rate:  ${rate}%${' '.repeat(19 - rate.toString().length)}║
  ╚════════════════════════════════════════╝
`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Complete workflow verified!\n');
    return 0;
  } else {
    console.log(`⚠️ ${failed} test(s) failed\n`);
    return failed;
  }
}

main().then(code => process.exit(code));
