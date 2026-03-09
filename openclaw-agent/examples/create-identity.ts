#!/usr/bin/env node

/**
 * Example: Create Agent Identity
 * 
 * This script demonstrates creating a complete agent identity:
 * 1. Mint ERC8004 Identity NFT
 * 2. Create ERC6551 Token Bound Account
 * 3. Register with HAVEN AgentRegistry
 * 4. Optionally stake HAVEN tokens
 */

import { ethers } from 'ethers';
import { HavenClient, FUJI_CONTRACTS } from '@havenclaw/haven-interface';
import { IdentityManager } from '@havenclaw/identity';
import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';

// Configuration
const CONFIG = {
  privateKey: process.env.PRIVATE_KEY || '0xYOUR_KEY_HERE',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  agentName: 'Example Trading Bot',
  capabilities: ['trading', 'analysis', 'prediction'],
  metadataUri: 'ipfs://QmExampleMetadata',
  stakeAmount: '1000', // HAVEN
};

async function main() {
  console.log('🚀 Creating Agent Identity...\n');

  // Initialize components
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const signer = new ethers.Wallet(CONFIG.privateKey, provider);
  
  const client = new HavenClient({
    rpcUrl: CONFIG.rpcUrl,
    contracts: FUJI_CONTRACTS,
  });
  await client.connectSigner(signer);

  const logger = new Logger({ level: 'info', format: 'text' });
  const eventEmitter = new EventEmitter();

  const identityManager = new IdentityManager(
    client,
    logger,
    eventEmitter,
    {
      operatorPrivateKey: CONFIG.privateKey,
      erc8004Contract: FUJI_CONTRACTS.erc8004Registry,
      erc6551Registry: FUJI_CONTRACTS.erc6551Registry,
      erc6551Implementation: FUJI_CONTRACTS.erc6551Implementation,
      agentRegistry: FUJI_CONTRACTS.agentRegistry,
      chainId: 43113,
    }
  );

  try {
    // Create identity
    const identity = await identityManager.createIdentity({
      metadataUri: CONFIG.metadataUri,
      capabilities: CONFIG.capabilities,
      stakeAmount: CONFIG.stakeAmount ? ethers.parseUnits(CONFIG.stakeAmount, 18) : undefined,
      stakeLockPeriod: BigInt(604800), // 7 days
    });

    console.log('\n✅ Identity Created Successfully!\n');
    console.log('📋 Identity Details:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log(`│ Operator:    ${identity.operator}`);
    console.log(`│ NFT Token ID: ${identity.nft.tokenId}`);
    console.log(`│ TBA Address:  ${identity.tba.address}`);
    console.log(`│ Registered:   ${identity.haven.registered ? 'Yes' : 'No'}`);
    console.log(`│ Capabilities: ${identity.haven.capabilities.join(', ')}`);
    console.log(`│ Staked:       ${ethers.formatEther(identity.haven.staked)} HAVEN`);
    console.log('└─────────────────────────────────────────────────┘');

    console.log('\n💾 Save this information:');
    console.log(JSON.stringify({
      erc8004TokenId: identity.nft.tokenId.toString(),
      tbaAddress: identity.tba.address,
      metadataUri: identity.nft.metadataUri,
      capabilities: identity.haven.capabilities,
    }, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
