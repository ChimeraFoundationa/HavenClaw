/**
 * Task Commands
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import { getProvider, getSigner } from '../../../lib/provider.js'
import { getContractAddress } from '../../../config/contracts.js'
import { NonCustodialEscrowABI } from '../../../config/abi/NonCustodialEscrow.js'

/**
 * Create a new task bounty
 */
export async function create(options: {
  capability: string
  bounty: string
  token?: string
  deadline?: string
}) {
  console.log(chalk.blue('📝 Creating task bounty...'))
  
  try {
    const signer = await getSigner()
    const provider = getProvider()
    
    // Get network info safely
    let chainId: number
    try {
      const network = await provider.getNetwork()
      chainId = Number(network.chainId)
    } catch (e) {
      chainId = 43113 // Default to Fuji
    }
    
    const escrowAddress = getContractAddress('NonCustodialEscrow', chainId)
    const contract = new ethers.Contract(escrowAddress, NonCustodialEscrowABI, signer)
    
    const capabilityHash = ethers.id(options.capability)
    const tokenAddress = options.token || ethers.ZeroAddress
    const deadline = options.deadline ? parseInt(options.deadline) : Math.floor(Date.now() / 1000) + 86400 * 7
    
    console.log(chalk.gray(`  Capability: ${options.capability}`))
    console.log(chalk.gray(`  Bounty: ${options.bounty}`))
    console.log(chalk.gray(`  Deadline: ${new Date(deadline * 1000).toISOString()}`))
    
    const tx = await contract.createRequest(capabilityHash, tokenAddress, ethers.parseEther(options.bounty), deadline)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    const receipt = await tx.wait()
    
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'RequestCreated'
      } catch {
        return false
      }
    })
    
    if (event) {
      const parsed = contract.interface.parseLog(event)
      console.log(chalk.green('✓ Task created successfully!'))
      console.log(chalk.gray(`  Request ID: ${parsed?.args[0]}`))
    }
    
  } catch (error: any) {
    console.error(chalk.red('✗ Task creation failed:'), error.message)
    
    if (error.message.includes('No private key')) {
      console.error(chalk.yellow('\n  Please set HAVENCLAW_PRIVATE_KEY environment variable'))
    } else if (error.message.includes('insufficient funds')) {
      console.error(chalk.yellow('\n  Insufficient AVAX for gas'))
      console.error(chalk.yellow('  Get test AVAX: https://faucet.avax.network/'))
    }
    
    process.exit(1)
  }
}

/**
 * List available tasks
 */
export async function list() {
  console.log(chalk.blue('📋 Listing available tasks...'))
  console.log(chalk.yellow('\nNote: Full task listing requires an indexer.\n'))
}

/**
 * Submit task completion
 */
export async function submit(options: {
  task: string
  result: string
}) {
  console.log(chalk.blue('📤 Submitting task completion...'))
  
  try {
    const signer = await getSigner()
    const provider = getProvider()
    
    let chainId: number
    try {
      const network = await provider.getNetwork()
      chainId = Number(network.chainId)
    } catch (e) {
      chainId = 43113
    }
    
    const escrowAddress = getContractAddress('NonCustodialEscrow', chainId)
    const contract = new ethers.Contract(escrowAddress, NonCustodialEscrowABI, signer)
    
    const proofHash = ethers.id(options.result)
    
    console.log(chalk.gray(`  Task ID: ${options.task}`))
    console.log(chalk.gray(`  Result URI: ${options.result}`))
    
    const tx = await contract.submitProof(options.task, proofHash)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Task completion submitted!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Submission failed:'), error.message)
    process.exit(1)
  }
}

/**
 * Claim task bounty
 */
export async function claim(options: {
  task: string
}) {
  console.log(chalk.blue('💰 Claiming task bounty...'))
  
  try {
    const signer = await getSigner()
    const provider = getProvider()
    
    let chainId: number
    try {
      const network = await provider.getNetwork()
      chainId = Number(network.chainId)
    } catch (e) {
      chainId = 43113
    }
    
    const escrowAddress = getContractAddress('NonCustodialEscrow', chainId)
    const contract = new ethers.Contract(escrowAddress, NonCustodialEscrowABI, signer)
    
    console.log(chalk.gray(`  Task ID: ${options.task}`))
    
    const tx = await contract.settle(options.task)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Bounty claimed successfully!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Claim failed:'), error.message)
    process.exit(1)
  }
}
