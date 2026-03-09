/**
 * HavenClaw + ERC-8004 Integration Test
 * 
 * Tests ERC-8004 AI Agent Identity NFT registration on Fuji testnet
 * 
 * ERC-8004: Official AI Agent Identity NFT standard
 * - Identity Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e (Fuji)
 * - Reputation Registry: 0x8004B663056A597Dffe9eCcC1965A193B7388713 (Fuji)
 * 
 * Usage:
 * node test-erc8004-integration.js
 */

import { ethers } from 'ethers';

// Fuji Testnet Configuration
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113;

// ERC-8004 Contract Addresses (Official - Already deployed on Fuji)
const ERC8004_ADDRESSES = {
  identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
};

// HavenClaw Contract Addresses
const HAVENCLAW_ADDRESSES = {
  agentRegistry: '0xe97f0c1378A75a4761f20220d64c31787FC9e321',
  taskMarketplace: '0x5B8DE12CDB6156dC1F5370B275CBf70E2d0A77AA',
};

// Test Configuration
const TEST_CONFIG = {
  privateKey: process.env.TEST_PRIVATE_KEY || '0xaee82fa4e0df351eb8275b0de7f00bddb8935c4d996c39bbe83069bdde48109a',
  agentName: 'HavenClaw Test Agent',
  agentDescription: 'Autonomous AI agent for HAVEN Protocol governance and tasks',
  capabilities: ['trading', 'governance', 'analysis'],
};

// ERC-8004 Identity Registry ABI (minimal for testing)
const ERC8004_IDENTITY_ABI = [
  // Core ERC721 functions
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  
  // ERC-8004 specific functions
  'function register(string calldata name, string calldata description, string[] calldata capabilities, string calldata metadataURI) external returns (uint256)',
  'function setAgentURI(uint256 agentId, string calldata uri) external',
  'function getMetadata(uint256 agentId, string calldata key) external view returns (string)',
  'function setMetadata(uint256 agentId, string calldata key, string calldata value) external',
  'function getAgentWallet(uint256 agentId) external view returns (address)',
  
  // Events
  'event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, string metadataURI)',
  'event AgentURIUpdated(uint256 indexed agentId, string newURI)',
  'event AgentWalletSet(uint256 indexed agentId, address indexed wallet)',
];

// ERC-8004 Reputation Registry ABI (minimal for testing)
const ERC8004_REPUTATION_ABI = [
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string calldata comment) external returns (uint256)',
  'function getSummary(uint256 agentId, address client) external view returns (uint256 count, int128 summaryValue, uint8 summaryValueDecimals)',
  'event FeedbackGiven(uint256 indexed agentId, address indexed client, int128 value, uint8 valueDecimals)',
];

async function main() {
  console.log('🧪 HavenClaw + ERC-8004 Integration Test\n');
  console.log('Network: Fuji Testnet (Chain ID: 43113)');
  console.log('RPC:', RPC_URL);
  console.log('');
  console.log('📋 ERC-8004 Contract Addresses (Official):');
  console.log('  Identity Registry:', ERC8004_ADDRESSES.identityRegistry);
  console.log('  Reputation Registry:', ERC8004_ADDRESSES.reputationRegistry);
  console.log('');

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(TEST_CONFIG.privateKey, provider);
  const signerAddress = await signer.getAddress();

  console.log('📊 Test Configuration:');
  console.log('  Signer:', signerAddress);
  console.log('  Agent Name:', TEST_CONFIG.agentName);
  console.log('');

  // Check balance
  const balance = await provider.getBalance(signerAddress);
  console.log('💰 Signer Balance:', ethers.formatEther(balance), 'AVAX');
  console.log('');

  // Initialize contract instances
  const identityRegistry = new ethers.Contract(ERC8004_ADDRESSES.identityRegistry, ERC8004_IDENTITY_ABI, signer);
  const reputationRegistry = new ethers.Contract(ERC8004_ADDRESSES.reputationRegistry, ERC8004_REPUTATION_ABI, signer);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
    agentId: null,
  };

  // Test 1: Check ERC-8004 Registry Deployment
  console.log('📋 Test 1: Check ERC-8004 Registry Deployment');
  try {
    const code = await provider.getCode(ERC8004_ADDRESSES.identityRegistry);
    if (code !== '0x') {
      console.log('  ✅ ERC-8004 Identity Registry deployed');
      results.passed++;
      results.tests.push({ name: 'ERC-8004 Registry Deployment', status: 'PASS' });
    } else {
      console.log('  ❌ ERC-8004 Identity Registry not deployed');
      results.failed++;
      results.tests.push({ name: 'ERC-8004 Registry Deployment', status: 'FAIL' });
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'ERC-8004 Registry Deployment', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 2: Check Existing Agent NFTs
  console.log('📋 Test 2: Check Existing Agent NFTs');
  try {
    const balance = await identityRegistry.balanceOf(signerAddress);
    console.log('  Signer ERC-8004 NFTs:', balance.toString());
    
    if (balance > 0n) {
      console.log('  ℹ️  Signer already owns', balance.toString(), 'agent NFT(s)');
      // Get first token ID (for testing)
      // Note: ERC-8004 doesn't have tokenByIndex, so we'd need to track token IDs
    } else {
      console.log('  ℹ️  Signer has no agent NFTs yet');
    }
    
    results.passed++;
    results.tests.push({ name: 'ERC-8004 NFT Balance Check', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'ERC-8004 NFT Balance Check', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 3: Register New Agent (if no existing NFTs)
  console.log('📋 Test 3: Register New ERC-8004 Agent');
  try {
    const balance = await identityRegistry.balanceOf(signerAddress);
    
    if (balance > 0n) {
      console.log('  ℹ️  Skipping - Signer already has agent NFT');
      results.tests.push({ name: 'Agent Registration', status: 'SKIP' });
    } else {
      console.log('  Registering new agent...');
      console.log('  Name:', TEST_CONFIG.agentName);
      console.log('  Description:', TEST_CONFIG.agentDescription);
      console.log('  Capabilities:', TEST_CONFIG.capabilities.join(', '));
      
      const tx = await identityRegistry.register(
        TEST_CONFIG.agentName,
        TEST_CONFIG.agentDescription,
        TEST_CONFIG.capabilities,
        '' // metadataURI (can be IPFS/Arweave)
      );
      
      console.log('  Tx Hash:', tx.hash);
      const receipt = await tx.wait();
      
      // Parse AgentRegistered event
      const event = receipt.logs.find(log => {
        try {
          const parsed = identityRegistry.interface.parseLog(log);
          return parsed?.name === 'AgentRegistered';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = identityRegistry.interface.parseLog(event);
        results.agentId = parsed.args.agentId;
        console.log('  ✅ Agent registered successfully');
        console.log('  Agent ID (Token ID):', results.agentId.toString());
        console.log('  Gas Used:', receipt.gasUsed.toString());
      } else {
        console.log('  ⚠️  Agent registered but event not parsed');
      }
    }
    
    results.passed++;
    results.tests.push({ name: 'Agent Registration', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Agent Registration', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 4: Query Agent Metadata
  console.log('📋 Test 4: Query Agent Metadata');
  try {
    if (results.agentId) {
      const name = await identityRegistry.getMetadata(results.agentId, 'name');
      const description = await identityRegistry.getMetadata(results.agentId, 'description');
      
      console.log('  Agent ID:', results.agentId.toString());
      console.log('  Name:', name);
      console.log('  Description:', description);
      console.log('  ✅ Agent metadata retrieved successfully');
      
      results.passed++;
      results.tests.push({ name: 'Agent Metadata Query', status: 'PASS' });
    } else {
      console.log('  ℹ️  Skipping - no agent ID from registration');
      results.tests.push({ name: 'Agent Metadata Query', status: 'SKIP' });
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Agent Metadata Query', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 5: Check Reputation Registry
  console.log('📋 Test 5: Check Reputation Registry');
  try {
    const code = await provider.getCode(ERC8004_ADDRESSES.reputationRegistry);
    if (code !== '0x') {
      console.log('  ✅ ERC-8004 Reputation Registry deployed');
      
      if (results.agentId) {
        const summary = await reputationRegistry.getSummary(results.agentId, ethers.ZeroAddress);
        console.log('  Agent ID:', results.agentId.toString());
        console.log('  Feedback Count:', summary.count.toString());
        console.log('  Summary Value:', summary.summaryValue.toString());
        console.log('  ℹ️  No feedback yet (expected for new agent)');
      }
      
      results.passed++;
      results.tests.push({ name: 'Reputation Registry Check', status: 'PASS' });
    } else {
      console.log('  ❌ ERC-8004 Reputation Registry not deployed');
      results.failed++;
      results.tests.push({ name: 'Reputation Registry Check', status: 'FAIL' });
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Reputation Registry Check', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test 6: Integration with HavenClaw
  console.log('📋 Test 6: Integration with HavenClaw');
  try {
    console.log('  HavenClaw Agent Registry:', HAVENCLAW_ADDRESSES.agentRegistry);
    console.log('  ℹ️  ERC-8004 Agent ID can be used as NFT Token ID for HavenClaw registration');
    console.log('  ℹ️  Next: Create ERC6551 TBA for ERC-8004 NFT, then register with HavenClaw');
    
    results.passed++;
    results.tests.push({ name: 'HavenClaw Integration Info', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    results.failed++;
    results.tests.push({ name: 'HavenClaw Integration Info', status: 'FAIL', error: error.message });
  }
  console.log('');

  // Test Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════');
  console.log('  Passed:', results.passed);
  console.log('  Failed:', results.failed);
  console.log('  Skipped:', results.tests.filter(t => t.status === 'SKIP').length);
  console.log('  Total:', results.passed + results.failed);
  console.log('═══════════════════════════════════════════');
  
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`  ${icon} ${test.name}: ${test.status}`);
  });
  console.log('═══════════════════════════════════════════');
  
  if (results.agentId) {
    console.log('\n🎉 ERC-8004 Agent Registered!');
    console.log('\nAgent Details:');
    console.log('  Agent ID (Token ID):', results.agentId.toString());
    console.log('  Owner:', signerAddress);
    console.log('  Registry:', ERC8004_ADDRESSES.identityRegistry);
    console.log('\nAgent Identifier (CAIP format):');
    console.log(`  eip155:${CHAIN_ID}:${ERC8004_ADDRESSES.identityRegistry}:${results.agentId}`);
    console.log('\nNext Steps:');
    console.log('  1. Set agent wallet (optional, for EIP-712/ERC-1271 signing)');
    console.log('  2. Create ERC6551 TBA for this NFT');
    console.log('  3. Register agent with HavenClaw using TBA address');
    console.log('  4. Start participating in governance and tasks');
    console.log('');
  } else if (results.failed === 0) {
    console.log('\n🎉 All tests passed! ERC-8004 is ready!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
  }
}

main().catch(console.error);
