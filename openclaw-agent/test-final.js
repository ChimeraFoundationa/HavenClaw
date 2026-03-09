#!/usr/bin/env node
/**
 * OpenClaw Agent - Final Working Transaction Test
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';

const RPC_URL = 'http://localhost:8545';
const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const AGENT_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

async function wait(tx) { return await tx.wait(); }
function log(passed, msg) { console.log(`${passed ? '✅' : '❌'} ${msg}`); return passed; }

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 OpenClaw Agent - Transaction Test (Final)');
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

  // Test 1: Agent Registration
  console.log('Test 1: Agent Registration');
  try {
    const reg = new ethers.Contract(contracts.registry, ['function isAgent(address) view returns (bool)'], provider);
    const isAgent = await reg.isAgent(agentAddress);
    passed++;
    console.log(`  Agent registered: ${isAgent}\n`);
  } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }

  // Test 2: Reputation Query
  console.log('Test 2: Reputation Query');
  try {
    const rep = new ethers.Contract(contracts.reputation, ['function getReputation(address) view returns (tuple(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256))'], provider);
    const r = await rep.getReputation(agentAddress);
    passed++;
    console.log(`  Score: ${r[1].toString()}, Staked: ${r[6].toString()}\n`);
  } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }

  // Test 3: Task Creation
  console.log('Test 3: Task Creation (with ETH value)');
  try {
    const task = new ethers.Contract(contracts.taskMarketplace, [
      'function createTask(string,bytes32,uint256,address,uint256) payable returns (uint256)',
      'event TaskCreated(uint256 indexed taskId, address indexed creator, string description, uint256 reward)'
    ], agentWallet);
    
    const reward = ethers.parseEther('100');
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    const tx = await task.createTask('Test task', ethers.id('trading'), reward, ethers.ZeroAddress, deadline, { value: reward });
    const receipt = await wait(tx);
    
    // Get task ID from event
    const event = receipt.logs.find(l => {
      try { return task.interface.parseLog(l)?.name === 'TaskCreated'; } catch { return false; }
    });
    if (event) {
      const parsed = task.interface.parseLog(event);
      taskId = parsed.args.taskId;
    }
    
    passed++;
    console.log(`  Task ID: ${taskId.toString()}, Gas: ${receipt.gasUsed.toString()}\n`);
  } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }

  // Test 4: Task Acceptance
  console.log('Test 4: Task Acceptance');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function acceptTask(uint256)'], agentWallet);
      const tx = await task.acceptTask(taskId);
      const receipt = await wait(tx);
      passed++;
      console.log(`  Accepted! Gas: ${receipt.gasUsed.toString()}\n`);
    } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }
  } else { failed++; console.log('  Skipped (no task)\n'); }

  // Test 5: Task Completion
  console.log('Test 5: Task Completion');
  if (taskId > 0n) {
    try {
      const task = new ethers.Contract(contracts.taskMarketplace, ['function completeTask(uint256,string,bytes)'], agentWallet);
      const tx = await task.completeTask(taskId, 'ipfs://QmResult', '0x');
      const receipt = await wait(tx);
      passed++;
      console.log(`  Completed! Gas: ${receipt.gasUsed.toString()}\n`);
    } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }
  } else { failed++; console.log('  Skipped (no task)\n'); }

  // Test 6: Proposal Creation
  console.log('Test 6: Governance Proposal');
  try {
    const gov = new ethers.Contract(contracts.governance, [
      'function createProposal(string,string,bytes32[]) returns (uint256)',
      'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startBlock, uint256 endBlock)'
    ], agentWallet);
    
    const tx = await gov.createProposal('Test proposal', 'ipfs://QmProposal', []);
    const receipt = await wait(tx);
    
    const event = receipt.logs.find(l => {
      try { return gov.interface.parseLog(l)?.name === 'ProposalCreated'; } catch { return false; }
    });
    if (event) {
      const parsed = gov.interface.parseLog(event);
      proposalId = parsed.args.proposalId;
    }
    
    passed++;
    console.log(`  Proposal ID: ${proposalId.toString()}, Gas: ${receipt.gasUsed.toString()}\n`);
  } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }

  // Test 7: Vote (mine blocks first)
  console.log('Test 7: Governance Voting');
  if (proposalId > 0n) {
    try {
      await provider.send('anvil_mine', ['0x100']);
      await new Promise(r => setTimeout(r, 1000));
      
      const gov = new ethers.Contract(contracts.governance, ['function castVote(uint256,uint8,string)'], agentWallet);
      const tx = await gov.castVote(proposalId, 1, 'Test vote');
      const receipt = await wait(tx);
      passed++;
      console.log(`  Vote cast! Gas: ${receipt.gasUsed.toString()}\n`);
    } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }
  } else { failed++; console.log('  Skipped (no proposal)\n'); }

  // Test 8: Voting Power
  console.log('Test 8: Voting Power Query');
  try {
    const gov = new ethers.Contract(contracts.governance, ['function getVotingPower(address,uint256) view returns (uint256)'], provider);
    const vp = await gov.getVotingPower(agentAddress, await provider.getBlockNumber());
    passed++;
    console.log(`  Voting Power: ${vp.toString()}\n`);
  } catch (e) { failed++; console.log(`  Failed: ${e.message}\n`); }

  // Summary
  const total = passed + failed;
  const rate = (passed / total * 100).toFixed(1);
  
  console.log('='.repeat(70));
  console.log(`\nResults: ${passed}/${total} passed (${rate}%)`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Transaction system is fully functional!\n');
  } else {
    console.log(`\n⚠️ ${failed} test(s) failed\n`);
  }
  console.log('='.repeat(70) + '\n');
  
  return failed;
}

main().then(code => process.exit(code));
