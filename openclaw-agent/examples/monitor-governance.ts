#!/usr/bin/env node

/**
 * Example: Monitor Governance Proposals
 * 
 * This script demonstrates:
 * 1. Connecting to HAVEN governance
 * 2. Listening for proposal events
 * 3. Querying active proposals
 * 4. Analyzing proposal details
 */

import { ethers } from 'ethers';
import { HavenClient, FUJI_CONTRACTS, StateReader, EventListener } from '@havenclaw/haven-interface';
import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';

async function main() {
  console.log('🏛️  HAVEN Governance Monitor\n');

  // Initialize
  const client = new HavenClient({
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    contracts: FUJI_CONTRACTS,
  });

  const logger = new Logger({ level: 'info', format: 'text' });
  const eventEmitter = new EventEmitter();

  // Create state reader with caching
  const stateReader = new StateReader(client, { ttl: 30000, maxSize: 100 });

  try {
    // Get current block
    const blockNumber = await client.getBlockNumber();
    console.log(`📊 Current Block: ${blockNumber}\n`);

    // Query active proposals
    console.log('📋 Active Proposals:');
    const activeProposals = await stateReader.getActiveProposals();

    if (activeProposals.length === 0) {
      console.log('  No active proposals\n');
    } else {
      for (const proposal of activeProposals) {
        console.log(`\n┌─────────────────────────────────────────────────┐`);
        console.log(`│ Proposal ID: ${proposal.proposalId}`);
        console.log(`│ State:       ${proposal.state}`);
        console.log(`│ Start Block: ${proposal.startBlock}`);
        console.log(`│ End Block:   ${proposal.endBlock}`);
        console.log(`└─────────────────────────────────────────────────┘`);
      }
      console.log('');
    }

    // Query open tasks
    console.log('📝 Open Tasks:');
    const openTasks = await stateReader.getOpenTasks();

    if (openTasks.length === 0) {
      console.log('  No open tasks\n');
    } else {
      for (const task of openTasks) {
        console.log(`\n┌─────────────────────────────────────────────────┐`);
        console.log(`│ Task ID:     ${task.taskId}`);
        console.log(`│ Creator:     ${task.creator}`);
        console.log(`│ Reward:      ${ethers.formatEther(task.reward)} HAVEN`);
        console.log(`│ Capability:  ${task.requiredCapability}`);
        console.log(`│ Deadline:    ${new Date(Number(task.deadline) * 1000).toISOString()}`);
        console.log(`└─────────────────────────────────────────────────┘`);
      }
      console.log('');
    }

    // Setup event listener
    console.log('👂 Starting Event Listener...\n');
    const eventListener = new EventListener(client, eventEmitter, {
      pollingInterval: 5000,
      fromBlock: blockNumber,
      enabled: {
        governance: true,
        tasks: true,
        reputation: false,
        agentRegistry: false,
      },
    });

    // Listen for events
    eventEmitter.on('governance:proposal' as any, (proposal: any) => {
      console.log(`📢 New Proposal: ${proposal.proposalId} by ${proposal.proposer}`);
    });

    eventEmitter.on('task:created' as any, (task: any) => {
      console.log(`💼 New Task: ${task.taskId} - Reward: ${ethers.formatEther(task.reward)} HAVEN`);
    });

    await eventListener.start();

    console.log('Listening for events... (Press Ctrl+C to stop)\n');

    // Keep running
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
