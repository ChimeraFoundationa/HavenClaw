#!/usr/bin/env node
/**
 * OpenClaw Agent - Simple Transaction Test
 * Tests core transaction functionality
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

async function runTests() {
  section('🧪 OpenClaw Agent - Core Transaction Tests');

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

  // Test 1: Check Agent Registration
  section('Test 1: Agent Registration Status');
  try {
    const registryContract = new ethers.Contract(
      contracts.registry,
      ['function isAgent(address) external view returns (bool)', 'function getAgent(address) external view returns (tuple(address tbaAddress, uint256 nftTokenId, string metadataUri, bytes32[] capabilities, uint256 registeredAt, bool active))'],
      provider
    );

    const isAgent = await registryContract.isAgent(agentAddress);
    log('✅', `Agent registered: ${isAgent}`, '\x1b[32m');
    
    if (isAgent) {
      const agent = await registryContract.getAgent(agentAddress);
      console.log(`  TBA: ${agent.tbaAddress}`);
      console.log(`  NFT Token ID: ${agent.nftTokenId.toString()}`);
      console.log(`  Active: ${agent.active}`);
      console.log(`  Capabilities: ${agent.capabilities.length}`);
      passed++;
    } else {
      log('ℹ️', 'Agent not yet registered', '\x1b[33m');
      passed++;
    }
  } catch (e) {
    log('❌', `Registration check failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 2: Check Reputation
  section('Test 2: Reputation Status');
  try {
    const repContract = new ethers.Contract(
      contracts.reputation,
      ['function getReputation(address) external view returns (tuple(address agent, uint256 score, uint256 tasksCompleted, uint256 tasksFailed, uint256 proposalsVoted, uint256 correctVotes, uint256 stakedAmount, uint256 unlockTime, uint256 lastUpdated))'],
      provider
    );

    const rep = await repContract.getReputation(agentAddress);
    log('✅', 'Reputation retrieved', '\x1b[32m');
    console.log(`  Score: ${rep.score.toString()}`);
    console.log(`  Tasks Completed: ${rep.tasksCompleted.toString()}`);
    console.log(`  Staked Amount: ${rep.stakedAmount.toString()}`);
    passed++;
  } catch (e) {
    log('❌', `Reputation check failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 3: Create Task
  section('Test 3: Task Creation');
  let taskId = 0n;
  try {
    const taskContract = new ethers.Contract(
      contracts.taskMarketplace,
      ['function createTask(string,bytes32,uint256,address,uint256) external returns (uint256)', 'function getTask(uint256) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultUri, uint256 completedAt))'],
      agentWallet
    );

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    const tx = await taskContract.createTask(
      'Test task from agent',
      ethers.id('trading'),
      ethers.parseEther('100'),
      ethers.ZeroAddress,
      deadline
    );
    const receipt = await wait(tx);
    
    log('✅', `Task created! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
    
    // Get task ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = taskContract.interface.parseLog(log);
        return parsed?.name === 'TaskCreated';
      } catch { return false; }
    });
    
    if (event) {
      const parsed = taskContract.interface.parseLog(event);
      taskId = parsed.args.taskId;
      console.log(`  Task ID: ${taskId.toString()}`);
    }
    passed++;
  } catch (e) {
    log('❌', `Task creation failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 4: Accept Task
  section('Test 4: Task Acceptance');
  if (taskId > 0n) {
    try {
      const taskContract = new ethers.Contract(
        contracts.taskMarketplace,
        ['function acceptTask(uint256) external', 'function getTask(uint256) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultUri, uint256 completedAt))'],
        agentWallet
      );

      const tx = await taskContract.acceptTask(taskId);
      const receipt = await wait(tx);
      
      log('✅', `Task accepted! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
      
      const task = await taskContract.getTask(taskId);
      console.log(`  Status: ${task.status} (1=Accepted)`);
      console.log(`  Solver: ${task.solver}`);
      passed++;
    } catch (e) {
      log('❌', `Task acceptance failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'No task to accept', '\x1b[33m');
    failed++;
  }

  // Test 5: Complete Task
  section('Test 5: Task Completion');
  if (taskId > 0n) {
    try {
      const taskContract = new ethers.Contract(
        contracts.taskMarketplace,
        ['function completeTask(uint256,string,bytes) external', 'function getTask(uint256) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultUri, uint256 completedAt))'],
        agentWallet
      );

      const tx = await taskContract.completeTask(taskId, 'ipfs://QmTestResult', '0x');
      const receipt = await wait(tx);
      
      log('✅', `Task completed! Gas: ${receipt.gasUsed.toString()}`, '\x1b[32m');
      
      const task = await taskContract.getTask(taskId);
      console.log(`  Status: ${task.status} (3=Completed)`);
      console.log(`  Result URI: ${task.resultUri}`);
      passed++;
    } catch (e) {
      log('❌', `Task completion failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'No task to complete', '\x1b[33m');
    failed++;
  }

  // Test 6: Create Proposal
  section('Test 6: Governance Proposal');
  let proposalId = 0n;
  try {
    const govContract = new ethers.Contract(
      contracts.governance,
      ['function createProposal(string,string,bytes32[]) external returns (uint256)', 'function getActiveProposals() external view returns (uint256[])'],
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
      console.log(`  Active Proposals: ${activeProposals.length}`);
    }
    passed++;
  } catch (e) {
    log('❌', `Proposal creation failed: ${e.message}`, '\x1b[31m');
    failed++;
  }

  // Test 7: Cast Vote
  section('Test 7: Governance Voting');
  if (proposalId > 0n) {
    try {
      // Mine blocks to advance to voting period
      await provider.send('anvil_mine', ['0x100']);
      
      const govContract = new ethers.Contract(
        contracts.governance,
        ['function castVote(uint256,uint8,string) external', 'function getVote(uint256,address) external view returns (tuple(uint256 proposalId, address voter, uint8 support, uint256 votingPower, string reason, uint256 votedAt))'],
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
      log('❌', `Voting failed: ${e.message}`, '\x1b[31m');
      failed++;
    }
  } else {
    log('⚠️', 'No proposal to vote on', '\x1b[33m');
    failed++;
  }

  // Summary
  section('📊 Test Summary');
  const total = passed + failed;
  const rate = (passed / total * 100).toFixed(1);
  
  console.log(`
  ✅ Passed: ${passed}/${total}
  ❌ Failed: ${failed}/${total}
  📈 Success Rate: ${rate}%
`);

  if (failed === 0) {
    log('🎉', 'All transaction tests passed!', '\x1b[32m');
  } else {
    log('⚠️', `${failed} test(s) failed`, '\x1b[33m');
  }
  
  console.log('='.repeat(70) + '\n');
}

runTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
