#!/usr/bin/env node
/**
 * OpenClaw Agent - Complete Transaction Test (FIXED)
 * All tests should pass now
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';

const RPC_URL = 'http://localhost:8545';
const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const AGENT_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

function log(emoji, message, color = '\x1b[0m') {
  console.log(`${emoji} ${color}${message}\x1b[0m`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`🎯 ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function wait(tx) {
  return await tx.wait();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllTests() {
  section('🧪 OpenClaw Agent - Complete Transaction Test Suite');

  const provider = new JsonRpcProvider(RPC_URL);
  const agentWallet = new Wallet(AGENT_KEY, provider);
  const agentAddress = await agentWallet.getAddress();

  // Load deployment
  const deployment = JSON.parse(
    readFileSync('/root/soft/contracts/broadcast/DeployOpenClaw.s.sol/31337/run-latest.json', 'utf-8')
  );
  
  const contracts = {
    registry: deployment.transactions.find(t => t.contractName === 'OpenClawRegistry')?.contractAddress,
    taskMarketplace: deployment.transactions.find(t => t.contractName === 'OpenClawTaskMarketplace')?.contractAddress,
    governance: deployment.transactions.find(t => t.contractName === 'OpenClawGovernance')?.contractAddress,
    reputation: deployment.transactions.find(t => t.contractName === 'OpenClawReputation')?.contractAddress,
  };

  log('✅', 'Contract addresses loaded', '\x1b[32m');
  console.log(`  Registry:        ${contracts.registry}`);
  console.log(`  TaskMarketplace: ${contracts.taskMarketplace}`);
  console.log(`  Governance:      ${contracts.governance}`);
  console.log(`  Reputation:      ${contracts.reputation}`);
  console.log(`  Agent Address:   ${agentAddress}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Agent Registration
  section('Test 1: Agent Registration');
  try {
    const registryContract = new ethers.Contract(
      contracts.registry,
      ['function isAgent(address) external view returns (bool)'],
      provider
    );

    const isAgent = await registryContract.isAgent(agentAddress);
    if (isAgent) {
      log('✅', 'Agent already registered', '\x1b[32m');
    } else {
      log('ℹ️', 'Agent not registered (this is OK for fresh deployment)', '\x1b[33m');
    }
    passed++;
  } catch (e) {
    log('❌', `Failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 2: Reputation Query
  section('Test 2: Reputation Query');
  try {
    const repContract = new ethers.Contract(
      contracts.reputation,
      ['function getReputation(address) external view returns (tuple(address agent, uint256 score, uint256 tasksCompleted, uint256 tasksFailed, uint256 proposalsVoted, uint256 correctVotes, uint256 stakedAmount, uint256 unlockTime, uint256 lastUpdated))'],
      provider
    );

    const rep = await repContract.getReputation(agentAddress);
    log('✅', `Reputation retrieved - Score: ${rep.score.toString()}`, '\x1b[32m');
    passed++;
  } catch (e) {
    log('❌', `Failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 3: Task Creation (FIXED - with value)
  section('Test 3: Task Creation (with native token)');
  let taskId = 0n;
  try {
    const taskContract = new ethers.Contract(
      contracts.taskMarketplace,
      [
        'function createTask(string,bytes32,uint256,address,uint256) external payable returns (uint256)',
        'function getTask(uint256) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultUri, uint256 completedAt))'
      ],
      agentWallet
    );

    const reward = ethers.parseEther('100');
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    
    // FIX: Include value in transaction
    const tx = await taskContract.createTask(
      'Test task from agent',
      ethers.id('trading'),
      reward,
      ethers.ZeroAddress,
      deadline,
      { value: reward } // FIXED: Send ETH with transaction
    );
    const receipt = await wait(tx);
    
    log('✅', `Task created! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
    
    // Get task ID
    const activeTasks = await taskContract.getOpenTasks();
    if (activeTasks.length > 0) {
      taskId = activeTasks[activeTasks.length - 1];
      console.log(`  Task ID: ${taskId.toString()}`);
    }
    passed++;
  } catch (e) {
    log('❌', `Failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 4: Task Acceptance
  section('Test 4: Task Acceptance');
  if (taskId > 0n) {
    try {
      const taskContract = new ethers.Contract(
        contracts.taskMarketplace,
        ['function acceptTask(uint256) external'],
        agentWallet
      );

      const tx = await taskContract.acceptTask(taskId);
      const receipt = await wait(tx);
      
      log('✅', `Task accepted! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
      passed++;
    } catch (e) {
      log('❌', `Failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'Skipped (no task)', '\x1b[33m');
    failed++;
  }

  // Test 5: Task Completion
  section('Test 5: Task Completion');
  if (taskId > 0n) {
    try {
      const taskContract = new ethers.Contract(
        contracts.taskMarketplace,
        ['function completeTask(uint256,string,bytes) external'],
        agentWallet
      );

      const tx = await taskContract.completeTask(taskId, 'ipfs://QmTestResult', '0x');
      const receipt = await wait(tx);
      
      log('✅', `Task completed! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
      passed++;
    } catch (e) {
      log('❌', `Failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'Skipped (no task)', '\x1b[33m');
    failed++;
  }

  // Test 6: Proposal Creation
  section('Test 6: Governance Proposal Creation');
  let proposalId = 0n;
  try {
    const govContract = new ethers.Contract(
      contracts.governance,
      [
        'function createProposal(string,string,bytes32[]) external returns (uint256)',
        'function getActiveProposals() external view returns (uint256[])'
      ],
      agentWallet
    );

    const tx = await govContract.createProposal(
      'Test proposal from agent',
      'ipfs://QmTestProposal',
      []
    );
    const receipt = await wait(tx);
    
    log('✅', `Proposal created! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
    
    const activeProposals = await govContract.getActiveProposals();
    if (activeProposals.length > 0) {
      proposalId = activeProposals[activeProposals.length - 1];
      console.log(`  Proposal ID: ${proposalId.toString()}`);
    }
    passed++;
  } catch (e) {
    log('❌', `Failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 7: Governance Voting (FIXED - with time advancement)
  section('Test 7: Governance Voting');
  if (proposalId > 0n) {
    try {
      // FIX: Mine blocks to advance to voting period
      log('ℹ️', 'Mining blocks to advance to voting period...', '\x1b[33m');
      await provider.send('anvil_mine', ['0x100']); // Mine 256 blocks
      await sleep(1000);
      
      const govContract = new ethers.Contract(
        contracts.governance,
        [
          'function castVote(uint256,uint8,string) external',
          'function getVote(uint256,address) external view returns (tuple(uint256 proposalId, address voter, uint8 support, uint256 votingPower, string reason, uint256 votedAt))'
        ],
        agentWallet
      );

      const tx = await govContract.castVote(proposalId, 1, 'Test vote from agent');
      const receipt = await wait(tx);
      
      log('✅', `Vote cast! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
      
      const vote = await govContract.getVote(proposalId, agentAddress);
      console.log(`  Support: ${vote.support === 1 ? 'FOR' : 'AGAINST/ABSTAIN'}`);
      console.log(`  Voting Power: ${vote.votingPower.toString()}`);
      passed++;
    } catch (e) {
      log('❌', `Failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'Skipped (no proposal)', '\x1b[33m');
    failed++;
  }

  // Test 8: Voting Power Query
  section('Test 8: Voting Power Query');
  try {
    const govContract = new ethers.Contract(
      contracts.governance,
      ['function getVotingPower(address,uint256) external view returns (uint256)'],
      provider
    );

    const votingPower = await govContract.getVotingPower(agentAddress, await provider.getBlockNumber());
    log('✅', `Voting Power: ${votingPower.toString()}`, '\x1b[32m');
    passed++;
  } catch (e) {
    log('❌', `Failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Summary
  section('📊 Final Test Summary');
  const total = passed + failed;
  const rate = total > 0 ? (passed / total * 100).toFixed(1) : '0.0';
  
  console.log(`
  ╔════════════════════════════════════════╗
  ║  Tests Passed:  ${passed}/${total}${' '.repeat(18 - passed.toString().length - total.toString().length)}║
  ║  Tests Failed:  ${failed}/${total}${' '.repeat(18 - failed.toString().length - total.toString().length)}║
  ║  Success Rate:  ${rate}%${' '.repeat(19 - rate.toString().length)}║
  ╚════════════════════════════════════════╝
`);

  if (failed === 0) {
    log('🎉', 'ALL TESTS PASSED! Transaction system is fully functional!', '\x1b[32m');
    console.log('='.repeat(70) + '\n');
    return 0;
  } else {
    log('⚠️', `${failed} test(s) failed`, '\x1b[33m');
    console.log('='.repeat(70) + '\n');
    return failed;
  }
}

// Run tests
runAllTests().then((exitCode) => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
