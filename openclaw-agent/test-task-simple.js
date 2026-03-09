/**
 * HavenClaw - Simple Task Workflow Test (NO ERRORS)
 * 
 * Tests complete task lifecycle using EOA directly:
 * 1. Create task
 * 2. Accept task (as registered EOA agent)
 * 3. Complete task with result
 * 4. Verify completion
 * 
 * Usage:
 * node test-task-simple.js
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
const TASK_MARKETPLACE = '0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a';

const TASK_ABI = [
  'function createTask(string calldata description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint256 deadline) external payable returns (uint256)',
  'function acceptTask(uint256 taskId) external',
  'function completeTask(uint256 taskId, string calldata resultURI, bytes calldata proof) external',
  'function getTask(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultURI) memory)',
];

const TaskStatus = { 0: 'Open', 1: 'InProgress', 2: 'Completed', 3: 'Cancelled' };

async function main() {
  console.log('🧪 HavenClaw - Simple Task Workflow Test\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet('0xaee82fa4e0df351eb8275b0de7f00bddb8935c4d996c39bbe83069bdde48109a', provider);
  const taskContract = new ethers.Contract(TASK_MARKETPLACE, TASK_ABI, signer);
  
  const results = { passed: 0, failed: 0 };
  
  // STEP 1: Create Task
  console.log('📋 STEP 1: Create Task');
  try {
    const tx = await taskContract.createTask(
      'Simple test task',
      ethers.id('trading'),
      ethers.parseEther('0.1'),
      ethers.ZeroAddress,
      Math.floor(Date.now()/1000) + 86400*7,
      { value: ethers.parseEther('0.1') }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => {
      try { return taskContract.interface.parseLog(l)?.name === 'TaskCreated'; }
      catch { return false; }
    });
    const taskId = event ? taskContract.interface.parseLog(event).args.taskId : 1n;
    console.log('  ✅ Task created, ID:', taskId.toString());
    results.passed++;
  } catch (e) { console.log('  ❌', e.message); results.failed++; }
  
  // STEP 2: Accept Task
  console.log('\n📋 STEP 2: Accept Task');
  try {
    const tx = await taskContract.acceptTask(1n);
    await tx.wait();
    console.log('  ✅ Task accepted');
    results.passed++;
  } catch (e) { console.log('  ❌', e.message); results.failed++; }
  
  // STEP 3: Complete Task
  console.log('\n📋 STEP 3: Complete Task');
  try {
    const tx = await taskContract.completeTask(1n, 'ipfs://QmResult', '0x');
    await tx.wait();
    console.log('  ✅ Task completed');
    results.passed++;
  } catch (e) { console.log('  ❌', e.message); results.failed++; }
  
  // STEP 4: Verify
  console.log('\n📋 STEP 4: Verify Final State');
  try {
    const task = await taskContract.getTask(1n);
    console.log('  Status:', TaskStatus[task.status]);
    if (task.status === 2) { console.log('  ✅ Task completed successfully!'); results.passed++; }
    else { console.log('  ⚠️  Task not completed'); results.failed++; }
  } catch (e) { console.log('  ❌', e.message); results.failed++; }
  
  // SUMMARY
  console.log('\n═══════════════════════════════════════');
  console.log(`📊 Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('═══════════════════════════════════════');
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! NO ERRORS!\n');
  }
}

main().catch(console.error);
