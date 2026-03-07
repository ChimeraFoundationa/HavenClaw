/**
 * Governance Commands
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import { getProvider, getSigner } from '../../../lib/provider.js'
import { getContractAddress } from '../../../config/contracts.js'
import { AgentReputationABI } from '../../../config/abi/AgentReputation.js'
import { TaskCollectiveABI } from '../../../config/abi/TaskCollective.js'

export async function stake(options: {
  amount: string
  lockPeriod?: string
}) {
  console.log(chalk.blue('🔒 Staking HAVEN tokens...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const stakeAddress = getContractAddress('AgentReputation', Number(provider.network.chainId))
  const contract = new ethers.Contract(stakeAddress, AgentReputationABI, signer)
  
  try {
    const amount = ethers.parseEther(options.amount)
    const lockPeriod = parseInt(options.lockPeriod || '30') * 86400
    
    console.log(chalk.gray(`  Amount: ${options.amount} HAVEN`))
    console.log(chalk.gray(`  Lock Period: ${options.lockPeriod || '30'} days`))
    
    const tx = await contract.stake(amount, lockPeriod)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Tokens staked successfully!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Staking failed:'), error.message)
    process.exit(1)
  }
}

export async function vote(options: {
  proposal: string
  vote: 'yes' | 'no' | 'abstain'
}) {
  console.log(chalk.blue('🗳️ Voting on proposal...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const govAddress = getContractAddress('TaskCollective', Number(provider.network.chainId))
  const contract = new ethers.Contract(govAddress, TaskCollectiveABI, signer)
  
  try {
    const voteValue = options.vote === 'yes' ? 0 : options.vote === 'no' ? 1 : 2
    
    console.log(chalk.gray(`  Proposal: ${options.proposal}`))
    console.log(chalk.gray(`  Vote: ${options.vote.toUpperCase()}`))
    
    const tx = await contract.vote(options.proposal, voteValue)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Vote submitted!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Voting failed:'), error.message)
    process.exit(1)
  }
}

export async function delegate(options: {
  to: string
}) {
  console.log(chalk.blue('🤗 Delegating voting power...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const govAddress = getContractAddress('TaskCollective', Number(provider.network.chainId))
  const contract = new ethers.Contract(govAddress, TaskCollectiveABI, signer)
  
  try {
    console.log(chalk.gray(`  Delegate to: ${options.to}`))
    
    const tx = await contract.delegate(options.to)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Delegation successful!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Delegation failed:'), error.message)
    process.exit(1)
  }
}

export async function withdraw(options: {
  amount: string
}) {
  console.log(chalk.blue('💸 Withdrawing staked tokens...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const stakeAddress = getContractAddress('AgentReputation', Number(provider.network.chainId))
  const contract = new ethers.Contract(stakeAddress, AgentReputationABI, signer)
  
  try {
    const amount = ethers.parseEther(options.amount)
    
    console.log(chalk.gray(`  Amount: ${options.amount} HAVEN`))
    
    const tx = await contract.withdraw(amount)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Tokens withdrawn!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Withdrawal failed:'), error.message)
    process.exit(1)
  }
}
