#!/usr/bin/env node
/**
 * OpenClaw Agent - Live Integration Test
 * 
 * Tests the complete system on local Anvil blockchain
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { OpenClawContractClient, VoteSupport } from './packages/contract-client/dist/index.js';

const RPC_URL = 'http://localhost:8545';
const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const AGENT_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

function log(message, emoji = '📝') {
  console.log(`${emoji} ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, '🎯');
  console.log('='.repeat(60) + '\n');
}

async function runLiveTest() {
  section('🧪 OpenClaw Agent - Live Integration Test');

  try {
    // Load deployment
    const fs = await import('fs');
    const deployment = JSON.parse(
      fs.readFileSync('/root/soft/contracts/broadcast/DeployOpenClaw.s.sol/31337/run-latest.json', 'utf-8')
    );
    
    const contracts = {
      registry: deployment.transactions.find(t => t.contractName === 'OpenClawRegistry')?.to,
      taskMarketplace: deployment.transactions.find(t => t.contractName === 'OpenClawTaskMarketplace')?.to,
      governance: deployment.transactions.find(t => t.contractName === 'OpenClawGovernance')?.to,
      reputation: deployment.transactions.find(t => t.contractName === 'OpenClawReputation')?.to,
    };

    log('Contract Addresses Loaded:', '📦');
    console.log(`  Registry:        ${contracts.registry}`);
    console.log(`  TaskMarketplace: ${contracts.taskMarketplace}`);
    console.log(`  Governance:      ${contracts.governance}`);
    console.log(`  Reputation:      ${contracts.reputation}`);

    // Initialize client
    section('Step 1: Initialize Client');
    const provider = new JsonRpcProvider(RPC_URL);
    const agentWallet = new Wallet(AGENT_KEY, provider);
    const agentAddress = await agentWallet.getAddress();
    log(`Agent Address: ${agentAddress}`, '👤');

    const client = OpenClawContractClient.create({
      rpcUrl: RPC_URL,
      contracts,
      privateKey: AGENT_KEY,
    });
    log('Contract Client Initialized', '✅');

    // Test 1: Register Agent
    section('Step 2: Register Agent');
    const isRegistered = await client.registry.isAgent(agentAddress);
    if (!isRegistered) {
      log('Registering agent...', '📝');
      const tx = await client.registry.registerAgent({
        tbaAddress: agentAddress,
        nftTokenId: 1n,
        metadataUri: 'ipfs://QmTestAgent',
        capabilities: ['trading', 'analysis', 'governance'],
      });
      await tx.wait();
      log('Agent Registered!', '✅');
    } else {
      log('Agent Already Registered', 'ℹ️');
    }

    const agentInfo = await client.registry.getAgent(agentAddress);
    if (agentInfo) {
      console.log(`  Capabilities: ${agentInfo.capabilities.join(', ')}`);
    }

    // Test 2: Initialize Reputation & Stake
    section('Step 3: Initialize Reputation & Stake');
    try {
      const initTx = await client.reputation.initializeReputation(agentAddress);
      await initTx.wait();
      log('Reputation Initialized', '✅');
    } catch (e) {
      log('Reputation May Already Be Initialized', 'ℹ️');
    }

    log('Staking 1000 tokens...', '💰');
    const stakeTx = await client.reputation.stake(1000n * 10n ** 18n, 86400n);
    await stakeTx.wait();
    log('Tokens Staked!', '✅');

    const rep = await client.reputation.getReputation(agentAddress);
    if (rep) {
      console.log(`  Score: ${rep.score.toString()}`);
      console.log(`  Staked: ${rep.stakedAmount.toString()}`);
    }

    // Test 3: Create Task
    section('Step 4: Create Task');
    log('Creating task...', '📋');
    const taskTx = await client.task.createTask({
      description: 'Analyze HAVEN token trends',
      requiredCapability: 'analysis',
      reward: 100n * 10n ** 18n,
      rewardToken: ethers.ZeroAddress,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
    });
    await taskTx.wait();
    log('Task Created!', '✅');

    const openTasks = await client.task.getOpenTasks();
    log(`Open Tasks: ${openTasks.length}`, '📊');

    // Test 4: Create Proposal
    section('Step 5: Create Governance Proposal');
    log('Creating proposal...', '🗳️');
    const proposalTx = await client.governance.createProposal(
      'Increase task rewards by 10%',
      'ipfs://QmProposal1'
    );
    await proposalTx.wait();
    log('Proposal Created!', '✅');

    const activeProposals = await client.governance.getActiveProposals();
    log(`Active Proposals: ${activeProposals.length}`, '📊');

    // Test 5: Vote on Proposal
    section('Step 6: Vote on Proposal');
    if (activeProposals.length > 0) {
      const proposalId = activeProposals[0];
      log(`Voting on proposal #${proposalId.toString()}...`, '🗳️');
      const voteTx = await client.governance.castVote(
        proposalId,
        VoteSupport.For,
        'Support ecosystem growth'
      );
      await voteTx.wait();
      log('Vote Cast!', '✅');

      const vote = await client.governance.getVote(proposalId, agentAddress);
      if (vote) {
        console.log(`  Support: ${vote.support === 1 ? 'FOR' : 'AGAINST'}`);
        console.log(`  Voting Power: ${vote.votingPower.toString()}`);
      }
    }

    // Test 6: Check Voting Power
    section('Step 7: Check Voting Power');
    const votingPower = await client.governance.getVotingPower(agentAddress);
    log(`Voting Power: ${votingPower.toString()}`, '💪');

    // Summary
    section('✅ Live Test Complete!');
    console.log(`
Test Results:
  ✅ Contract Client Initialized
  ✅ Agent Registered
  ✅ Reputation Initialized & Staked
  ✅ Task Created
  ✅ Proposal Created
  ✅ Vote Cast
  ✅ Voting Power Checked

All systems operational!
`);

    console.log('='.repeat(60));
    log('🎉 Live Integration Test PASSED!', '🎉');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

runLiveTest();
