#!/usr/bin/env node
/**
 * OpenClaw Agent - Transaction Test Script
 * 
 * Tests all transaction types through the OpenClaw Agent system
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { OpenClawContractClient, VoteSupport } from './packages/contract-client/dist/index.js';
import { readFileSync } from 'fs';

// Configuration
const RPC_URL = 'http://localhost:8545';
const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const AGENT_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const TASK_CREATOR_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset, emoji = '📝') {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, colors.cyan, '🎯');
  console.log('='.repeat(70) + '\n');
}

function success(message) {
  log(message, colors.green, '✅');
}

function error(message) {
  log(message, colors.red, '❌');
}

function info(message) {
  log(message, colors.blue, 'ℹ️');
}

async function wait(tx) {
  return await tx.wait();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTransactionTests() {
  section('🧪 OpenClaw Agent - Transaction Test Suite');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
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

    success('Contract addresses loaded');
    console.log(`  Registry:        ${contracts.registry}`);
    console.log(`  TaskMarketplace: ${contracts.taskMarketplace}`);
    console.log(`  Governance:      ${contracts.governance}`);
    console.log(`  Reputation:      ${contracts.reputation}`);

    // Initialize clients
    const provider = new JsonRpcProvider(RPC_URL);
    const agentWallet = new Wallet(AGENT_KEY, provider);
    const taskCreatorWallet = new Wallet(TASK_CREATOR_KEY, provider);
    const agentAddress = await agentWallet.getAddress();
    const taskCreatorAddress = await taskCreatorWallet.getAddress();

    info(`Agent Address: ${agentAddress}`);
    info(`Task Creator: ${taskCreatorAddress}`);

    const agentClient = OpenClawContractClient.create({
      rpcUrl: RPC_URL,
      contracts,
      privateKey: AGENT_KEY,
    });

    const creatorClient = OpenClawContractClient.create({
      rpcUrl: RPC_URL,
      contracts,
      privateKey: TASK_CREATOR_KEY,
    });

    // Test 1: Agent Registration
    section('Test 1: Agent Registration Transaction');
    try {
      const isRegistered = await agentClient.registry.isAgent(agentAddress);
      
      if (!isRegistered) {
        info('Registering agent...');
        const tx = await agentClient.registry.registerAgent({
          tbaAddress: agentAddress,
          nftTokenId: 1n,
          metadataUri: 'ipfs://QmTestAgent123',
          capabilities: ['trading', 'analysis', 'governance'],
        });
        const receipt = await wait(tx);
        success(`Agent registered! Gas used: ${receipt.gasUsed.toString()}`);
        testsPassed++;
      } else {
        success('Agent already registered');
        testsPassed++;
      }

      const agentInfo = await agentClient.registry.getAgent(agentAddress);
      if (agentInfo) {
        console.log(`  Capabilities: ${agentInfo.capabilities.join(', ')}`);
        console.log(`  Active: ${agentInfo.active}`);
      }
    } catch (e) {
      error(`Agent registration failed: ${e.message}`);
      testsFailed++;
    }

    // Test 2: Reputation Initialization & Staking
    section('Test 2: Staking Transaction');
    try {
      // Initialize reputation
      try {
        const initTx = await agentClient.reputation.initializeReputation(agentAddress);
        await wait(initTx);
        success('Reputation initialized');
      } catch (e) {
        info('Reputation may already be initialized');
      }

      // Check current reputation
      const rep = await agentClient.reputation.getReputation(agentAddress);
      console.log(`  Score: ${rep.score.toString()}`);
      console.log(`  Staked: ${rep.stakedAmount.toString()}`);
      
      if (rep.stakedAmount === 0n) {
        // First approve tokens
        info('Approving tokens for staking...');
        const tokenContract = new ethers.Contract(
          contracts.reputation,
          ['function approve(address spender, uint256 amount) external returns (bool)'],
          agentWallet
        );
        const approveAmount = 1000n * 10n ** 18n;
        const approveTx = await tokenContract.approve(contracts.reputation, approveAmount);
        await wait(approveTx);
        success('Token approval granted');
        
        info('Staking 1000 tokens...');
        const stakeTx = await agentClient.reputation.stake(approveAmount, 86400n);
        const stakeReceipt = await wait(stakeTx);
        success(`Tokens staked! Gas used: ${stakeReceipt.gasUsed.toString()}`);
        testsPassed++;
      } else {
        success(`Tokens already staked: ${rep.stakedAmount.toString()}`);
        testsPassed++;
      }
    } catch (e) {
      error(`Staking failed: ${e.message}`);
      testsFailed++;
    }

    // Test 3: Task Creation Transaction
    section('Test 3: Task Creation Transaction');
    let taskId = 0n;
    try {
      info('Creating task...');
      const taskTx = await creatorClient.task.createTask({
        description: 'Analyze HAVEN token market trends',
        requiredCapability: 'analysis',
        reward: 100n * 10n ** 18n,
        rewardToken: ethers.ZeroAddress,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
      });
      const taskReceipt = await wait(taskTx);
      success(`Task created! Gas used: ${taskReceipt.gasUsed.toString()}`);
      testsPassed++;

      const openTasks = await agentClient.task.getOpenTasks();
      taskId = openTasks[openTasks.length - 1];
      console.log(`  Task ID: ${taskId.toString()}`);
      console.log(`  Open Tasks: ${openTasks.length}`);
    } catch (e) {
      error(`Task creation failed: ${e.message}`);
      testsFailed++;
    }

    // Test 4: Task Acceptance Transaction
    section('Test 4: Task Acceptance Transaction');
    if (taskId > 0n) {
      try {
        info(`Accepting task #${taskId.toString()}...`);
        const acceptTx = await agentClient.task.acceptTask(taskId);
        const acceptReceipt = await wait(acceptTx);
        success(`Task accepted! Gas used: ${acceptReceipt.gasUsed.toString()}`);
        testsPassed++;

        const task = await agentClient.task.getTask(taskId);
        console.log(`  Status: ${task.status} (1=Accepted)`);
        console.log(`  Solver: ${task.solver}`);
      } catch (e) {
        error(`Task acceptance failed: ${e.message}`);
        testsFailed++;
      }
    } else {
      error('No task to accept');
      testsFailed++;
    }

    // Test 5: Task Completion Transaction
    section('Test 5: Task Completion Transaction');
    if (taskId > 0n) {
      try {
        info(`Completing task #${taskId.toString()}...`);
        // Use the same wallet that accepted the task
        const completeTx = await agentClient.task.completeTask(
          taskId,
          'ipfs://QmTaskResult123',
          '0x'
        );
        const completeReceipt = await wait(completeTx);
        success(`Task completed! Gas used: ${completeReceipt.gasUsed.toString()}`);
        testsPassed++;

        const task = await agentClient.task.getTask(taskId);
        console.log(`  Status: ${task.status} (3=Completed)`);
        console.log(`  Result URI: ${task.resultUri}`);
      } catch (e) {
        error(`Task completion failed: ${e.message}`);
        testsFailed++;
      }
    } else {
      error('No task to complete');
      testsFailed++;
    }

    // Test 6: Governance Proposal Creation
    section('Test 6: Governance Proposal Transaction');
    let proposalId = 0n;
    try {
      // Use a fresh wallet for proposal creation
      const proposalWallet = new Wallet('0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', provider);
      const proposalClient = OpenClawContractClient.create({
        rpcUrl: RPC_URL,
        contracts,
        privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      });
      
      info('Creating governance proposal...');
      const proposalTx = await proposalClient.governance.createProposal(
        'Increase task rewards by 10% to attract more agents',
        'ipfs://QmProposal123'
      );
      const proposalReceipt = await wait(proposalTx);
      success(`Proposal created! Gas used: ${proposalReceipt.gasUsed.toString()}`);
      testsPassed++;

      const activeProposals = await agentClient.governance.getActiveProposals();
      if (activeProposals.length > 0) {
        proposalId = activeProposals[activeProposals.length - 1];
        console.log(`  Proposal ID: ${proposalId.toString()}`);
        console.log(`  Active Proposals: ${activeProposals.length}`);
      }
    } catch (e) {
      error(`Proposal creation failed: ${e.message}`);
      testsFailed++;
    }

    // Test 7: Governance Voting Transaction
    section('Test 7: Governance Voting Transaction');
    try {
      const activeProposals = await agentClient.governance.getActiveProposals();
      if (activeProposals.length > 0) {
        proposalId = activeProposals[0];
        
        // Fast forward to voting period
        info('Advancing to voting period...');
        await provider.send('anvil_mine', ['0x100']); // Mine 256 blocks
        await sleep(1000);
        
        info(`Voting on proposal #${proposalId.toString()}...`);
        const voteTx = await agentClient.governance.castVote(
          proposalId,
          VoteSupport.For,
          'This will help grow the ecosystem'
        );
        const voteReceipt = await wait(voteTx);
        success(`Vote cast! Gas used: ${voteReceipt.gasUsed.toString()}`);
        testsPassed++;

        const vote = await agentClient.governance.getVote(proposalId, agentAddress);
        console.log(`  Support: ${vote.support === 1 ? 'FOR' : vote.support === 0 ? 'AGAINST' : 'ABSTAIN'}`);
        console.log(`  Voting Power: ${vote.votingPower.toString()}`);
        console.log(`  Reason: ${vote.reason}`);
      } else {
        error('No active proposals to vote on');
        testsFailed++;
      }
    } catch (e) {
      error(`Voting failed: ${e.message}`);
      testsFailed++;
    }

    // Test 8: Check Voting Power
    section('Test 8: Voting Power Query');
    try {
      const votingPower = await agentClient.governance.getVotingPower(agentAddress);
      success(`Voting power: ${votingPower.toString()}`);
      testsPassed++;
    } catch (e) {
      error(`Voting power query failed: ${e.message}`);
      testsFailed++;
    }

    // Summary
    section('📊 Transaction Test Summary');
    console.log(`
  Tests Passed: ${testsPassed}
  Tests Failed: ${testsFailed}
  Success Rate: ${testsPassed / (testsPassed + testsFailed) * 100}%
`);

    if (testsFailed === 0) {
      success('🎉 All transaction tests passed!');
      console.log('='.repeat(70) + '\n');
    } else {
      error(`${testsFailed} test(s) failed`);
      console.log('='.repeat(70) + '\n');
    }

  } catch (e) {
    error(`Test suite failed: ${e.message}`);
    console.error(e);
  }
}

// Run tests
runTransactionTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
