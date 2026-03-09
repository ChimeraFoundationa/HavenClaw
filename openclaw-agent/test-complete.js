#!/usr/bin/env node
/**
 * OpenClaw Agent - 100% Passing Transaction Test
 * Complete workflow: Register → Stake → Task → Vote
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';

const RPC_URL = 'http://localhost:8545';
const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const AGENT_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

async function wait(tx) { return await tx.wait(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 OpenClaw Agent - Complete Workflow Test');
  console.log('='.repeat(70) + '\n');

  const provider = new JsonRpcProvider(RPC_URL);
  const agentWallet = new Wallet(AGENT_KEY, provider);
  const agentAddress = await agentWallet.getAddress();

  // Load contracts
  const deployment = JSON.parse(readFileSync('/root/soft/contracts/broadcast/DeployOpenClaw.s.sol/31337/run-latest.json', 'utf-8'));
  const contracts = {
    registry: deployment.transactions.find(t => t.contractName === 'OpenClawRegistry')?.contractAddress,
    taskMarketplace: deployment.transactions.find(t => t.contractName === 'OpenClawTaskMarketplace')?.contractAddress,
    governance: deployment.transactions.find(t => t.contractName === 'OpenClawGovernance')?.contractAddress,
    reputation: deployment.transactions.find(t => t.contractName === 'OpenClawReputation')?.contractAddress,
  };

  console.log('Contracts Loaded:');
  Object.entries(contracts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`\nAgent: ${agentAddress}\n`);

  let passed = 0, failed = 0;
  let taskId = 0n, proposalId = 0n;

  // Test 1: Register Agent
  console.log('Test 1: Register Agent');
  try {
    const reg = new ethers.Contract(contracts.registry, [
      'function isAgent(address) view returns (bool)',
      'function registerAgent(address,uint256,string,bytes32[])'
    ], agentWallet);
    
    const isAgent = await reg.isAgent(agentAddress);
    if (!isAgent) {
      console.log('  Registering agent...');
      const tx = await reg.registerAgent(agentAddress, 1n, 'ipfs://QmAgent', [ethers.id('trading')]);
      await wait(tx);
      console.log('  ✅ Agent registered');
    } else {
      console.log('  ✅ Agent already registered');
    }
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // Test 2: Initialize Reputation
  console.log('Test 2: Initialize Reputation');
  try {
    const rep = new ethers.Contract(contracts.reputation, [
      'function initializeReputation(address)',
      'function getReputation(address) view returns (tuple(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256))'
    ], agentWallet);
    
    const tx = await rep.initializeReputation(agentAddress);
    await wait(tx);
    const r = await rep.getReputation(agentAddress);
    console.log(`  ✅ Reputation initialized - Score: ${r[1].toString()}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // Test 3: Create Task
  console.log('Test 3: Create Task (with ETH value)');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, [
      'function createTask(string,bytes32,uint256,address,uint256) payable returns (uint256)',
      'event TaskCreated(uint256 indexed taskId)'
    ], agentWallet);
    
    const reward = ethers.parseEther('100');
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    const tx = await task.createTask('Test task', ethers.id('trading'), reward, ethers.ZeroAddress, deadline, { value: reward });
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try { return task.interface.parseLog(l)?.name === 'TaskCreated'; } catch { return false; }
    });
    if (event) taskId = task.interface.parseLog(event).args.taskId;
    
    console.log(`  ✅ Task created - ID: ${taskId.toString()}, Gas: ${receipt.gasUsed.toString()}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // Test 4: Accept Task
  console.log('Test 4: Accept Task');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function acceptTask(uint256)'], agentWallet);
      const tx = await task.acceptTask(taskId);
      const receipt = await wait(tx);
      console.log(`  ✅ Task accepted - Gas: ${receipt.gasUsed.toString()}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no task)\n'); }
  console.log();

  // Test 5: Complete Task
  console.log('Test 5: Complete Task');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function completeTask(uint256,string,bytes)'], agentWallet);
      const tx = await task.completeTask(taskId, 'ipfs://QmResult', '0x');
      const receipt = await wait(tx);
      console.log(`  ✅ Task completed - Gas: ${receipt.gasUsed.toString()}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no task)\n'); }
  console.log();

  // Test 6: Create Proposal
  console.log('Test 6: Create Governance Proposal');
  try {
    const gov = new ethers.Contract(contracts.governance, [
      'function createProposal(string,string,bytes32[]) returns (uint256)',
      'event ProposalCreated(uint256 indexed proposalId)'
    ], agentWallet);
    
    const tx = await gov.createProposal('Test proposal', 'ipfs://QmProposal', []);
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try { return gov.interface.parseLog(l)?.name === 'ProposalCreated'; } catch { return false; }
    });
    if (event) proposalId = gov.interface.parseLog(event).args.proposalId;
    
    console.log(`  ✅ Proposal created - ID: ${proposalId.toString()}, Gas: ${receipt.gasUsed.toString()}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // Test 7: Vote (mine blocks to activate voting)
  console.log('Test 7: Vote on Proposal');
  if (proposalId > 0n) {
    try {
      console.log('  Mining blocks to activate voting period...');
      await provider.send('anvil_mine', ['0x100']);
      await sleep(1000);
      
      const gov = new ethers.Contract(contracts.governance, ['function castVote(uint256,uint8,string)'], agentWallet);
      const tx = await gov.castVote(proposalId, 1, 'I support this');
      const receipt = await wait(tx);
      console.log(`  ✅ Vote cast - Gas: ${receipt.gasUsed.toString()}`);
      passed++;
    } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  } else { failed++; console.log('  ❌ Skipped (no proposal)\n'); }
  console.log();

  // Test 8: Query Voting Power
  console.log('Test 8: Query Voting Power');
  try {
    const gov = new ethers.Contract(contracts.governance, ['function getVotingPower(address,uint256) view returns (uint256)'], provider);
    const vp = await gov.getVotingPower(agentAddress, await provider.getBlockNumber());
    console.log(`  ✅ Voting Power: ${vp.toString()}`);
    passed++;
  } catch (e) { failed++; console.log(`  ❌ Failed: ${e.message}`); }
  console.log();

  // Summary
  const total = passed + failed;
  const rate = (passed / total * 100).toFixed(1);
  
  console.log('='.repeat(70));
  console.log(`\nFinal Results: ${passed}/${total} passed (${rate}%)\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Complete workflow verified!\n');
  } else {
    console.log(`⚠️ ${failed} test(s) failed\n`);
  }
  console.log('='.repeat(70) + '\n');
  
  return failed;
}

main().then(code => process.exit(code));
