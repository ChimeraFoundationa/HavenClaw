#!/usr/bin/env node
/**
 * OpenClaw Agent - Test with Proper Time Advancement
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';

const WALLETS = {
  walletA: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  walletB: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
};

const RPC_URL = 'http://localhost:8545';

async function wait(tx) { return await tx.wait(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 OpenClaw Agent - Time-Managed Voting Test');
  console.log('='.repeat(70) + '\n');

  const provider = new JsonRpcProvider(RPC_URL);
  const walletA = new Wallet(WALLETS.walletA, provider);
  const walletB = new Wallet(WALLETS.walletB, provider);
  const addressA = await walletA.getAddress();
  const addressB = await walletB.getAddress();

  console.log('Wallet A:', addressA);
  console.log('Wallet B:', addressB);
  console.log();

  // Load contracts
  const deployment = JSON.parse(readFileSync('/root/soft/contracts/broadcast/DeployOpenClaw.s.sol/31337/run-latest.json', 'utf-8'));
  const contracts = {
    registry: deployment.transactions.find(t => t.contractName === 'OpenClawRegistry')?.contractAddress,
    taskMarketplace: deployment.transactions.find(t => t.contractName === 'OpenClawTaskMarketplace')?.contractAddress,
    governance: deployment.transactions.find(t => t.contractName === 'OpenClawGovernance')?.contractAddress,
    reputation: deployment.transactions.find(t => t.contractName === 'OpenClawReputation')?.contractAddress,
  };

  console.log('Contracts Loaded\n');

  let passed = 0, failed = 0;
  let proposalId = 0n;
  let nonceA = await provider.getTransactionCount(addressA);
  let nonceB = await provider.getTransactionCount(addressB);

  // ===== Quick Setup Tests =====
  console.log('='.repeat(70));
  console.log('SETUP PHASE');
  console.log('='.repeat(70) + '\n');

  // Test 1: Register Agent
  console.log('Test 1: Register Agent');
  try {
    const reg = new ethers.Contract(contracts.registry, ['function registerAgent(address,uint256,string,bytes32[])'], walletB);
    const tx = await reg.registerAgent(addressB, 1n, 'ipfs://QmAgent', [ethers.id('trading')], { nonce: nonceB++ });
    await wait(tx);
    console.log('  ✅ Agent registered\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 2: Initialize Reputation
  console.log('Test 2: Initialize Reputation');
  try {
    const rep = new ethers.Contract(contracts.reputation, ['function initializeReputation(address)'], walletB);
    const tx = await rep.initializeReputation(addressB, { nonce: nonceB++ });
    await wait(tx);
    console.log('  ✅ Reputation initialized\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 3: Create Task
  console.log('Test 3: Create Task');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, ['function createTask(string,bytes32,uint256,address,uint256) payable returns (uint256)'], walletA);
    const tx = await task.createTask('Test task', ethers.id('trading'), ethers.parseEther('100'), ethers.ZeroAddress, BigInt(Math.floor(Date.now()/1000) + 86400), { 
      value: ethers.parseEther('100'),
      nonce: nonceA++
    });
    await wait(tx);
    console.log('  ✅ Task created\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 4: Accept Task
  console.log('Test 4: Accept Task');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, ['function acceptTask(uint256)'], walletB);
    const tx = await task.acceptTask(1n, { nonce: nonceB++ });
    await wait(tx);
    console.log('  ✅ Task accepted\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 5: Complete Task
  console.log('Test 5: Complete Task');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, ['function completeTask(uint256,string,bytes)'], walletB);
    const tx = await task.completeTask(1n, 'ipfs://QmResult', '0x', { nonce: nonceB++ });
    await wait(tx);
    console.log('  ✅ Task completed\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 6: Create Proposal
  console.log('='.repeat(70));
  console.log('GOVERNANCE PHASE');
  console.log('='.repeat(70) + '\n');

  console.log('Test 6: Create Proposal');
  try {
    const gov = new ethers.Contract(contracts.governance, [
      'function createProposal(string,string,bytes32[]) returns (uint256)',
      'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startBlock, uint256 endBlock)'
    ], walletA);
    
    const tx = await gov.createProposal('Test proposal', 'ipfs://QmProposal', [], { nonce: nonceA++ });
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try { return gov.interface.parseLog(l)?.name === 'ProposalCreated'; } catch { return false; }
    });
    if (event) {
      const parsed = gov.interface.parseLog(event);
      proposalId = parsed.args.proposalId;
      console.log(`  Proposal ID: ${proposalId.toString()}`);
      console.log(`  Start Block: ${parsed.args.startBlock.toString()}`);
      console.log(`  End Block: ${parsed.args.endBlock.toString()}`);
    }
    console.log('  ✅ Proposal created\n');
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Test 7: Vote (with proper time advancement)
  console.log('Test 7: Vote on Proposal (advancing time)');
  if (proposalId > 0n) {
    try {
      console.log('  Getting current block info...');
      const currentBlock = await provider.getBlock('latest');
      console.log(`  Current block: ${currentBlock.number}, timestamp: ${currentBlock.timestamp}`);
      
      // votingDelay = 86400 seconds
      const newTimestamp = currentBlock.timestamp + 86400 + 100; // Add 1 day + buffer
      
      console.log(`  Advancing time to timestamp: ${newTimestamp}`);
      console.log(`  (This simulates 1 day passing)`);
      
      // Set next block timestamp
      await provider.send('anvil_setNextBlockTimestamp', [newTimestamp]);
      
      // Mine a block to apply the timestamp
      await provider.send('evm_mine', []);
      
      const newBlock = await provider.getBlock('latest');
      console.log(`  New block: ${newBlock.number}, timestamp: ${newBlock.timestamp}`);
      
      await sleep(1000);
      
      const gov = new ethers.Contract(contracts.governance, ['function castVote(uint256,uint8,string)'], walletB);
      const tx = await gov.castVote(proposalId, 1, 'Support this proposal', { nonce: nonceB++ });
      const receipt = await wait(tx);
      console.log(`  ✅ Vote cast - Gas: ${receipt.gasUsed.toString()}\n`);
      passed++;
    } catch (e) { 
      failed++; 
      console.log(`  ❌ Failed: ${e.message}`);
      console.log(`  Note: This may fail if voting period hasn't started yet\n`);
    }
  } else { failed++; console.log('  ❌ Skipped (no proposal)\n'); }

  // Test 8: Query Voting Power
  console.log('Test 8: Query Voting Power');
  try {
    const gov = new ethers.Contract(contracts.governance, ['function getVotingPower(address,uint256) view returns (uint256)'], provider);
    const vp = await gov.getVotingPower(addressB, await provider.getBlockNumber());
    console.log(`  ✅ Voting Power: ${vp.toString()}\n`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ ${e.message}\n`); }

  // Summary
  const total = passed + failed;
  const rate = (passed / total * 100).toFixed(1);
  
  console.log('='.repeat(70));
  console.log(`FINAL: ${passed}/${total} passed (${rate}%)\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
  }
  console.log('='.repeat(70) + '\n');
  
  return failed;
}

main().then(code => process.exit(code));
