/**
 * Prediction Market Commands
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import { getProvider, getSigner } from '../../../lib/provider.js'
import { getContractAddress } from '../../../config/contracts.js'
import { PredictionMarketABI } from '../../../config/abi/PredictionMarket.js'

export async function create(options: {
  question: string
  deadline: string
  bond?: string
}) {
  console.log(chalk.blue('📊 Creating prediction market...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const marketAddress = getContractAddress('PredictionMarket', Number(provider.network.chainId))
  const contract = new ethers.Contract(marketAddress, PredictionMarketABI, signer)
  
  try {
    const questionHash = ethers.id(options.question)
    const bond = ethers.parseEther(options.bond || '10')
    
    console.log(chalk.gray(`  Question: ${options.question}`))
    console.log(chalk.gray(`  Deadline: ${new Date(parseInt(options.deadline) * 1000).toISOString()}`))
    console.log(chalk.gray(`  Bond: ${options.bond || '10'} HAVEN`))
    
    const tx = await contract.createMarket(questionHash, parseInt(options.deadline), { value: bond })
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Prediction market created!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Market creation failed:'), error.message)
    process.exit(1)
  }
}

export async function list() {
  console.log(chalk.blue('📋 Listing prediction markets...'))
  console.log(chalk.yellow('\nNote: Full market listing requires an indexer.\n'))
}

export async function bet(options: {
  market: string
  outcome: 'yes' | 'no'
  amount: string
}) {
  console.log(chalk.blue('🎲 Placing bet...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const marketAddress = getContractAddress('PredictionMarket', Number(provider.network.chainId))
  const contract = new ethers.Contract(marketAddress, PredictionMarketABI, signer)
  
  try {
    const outcome = options.outcome === 'yes' ? true : false
    const amount = ethers.parseEther(options.amount)
    
    console.log(chalk.gray(`  Market: ${options.market}`))
    console.log(chalk.gray(`  Outcome: ${options.outcome.toUpperCase()}`))
    console.log(chalk.gray(`  Amount: ${options.amount} HAVEN`))
    
    const tx = await contract.placeBet(options.market, outcome, { value: amount })
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Bet placed successfully!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Bet failed:'), error.message)
    process.exit(1)
  }
}

export async function resolve(options: {
  market: string
  result: 'yes' | 'no'
}) {
  console.log(chalk.blue('✅ Resolving prediction market...'))
  
  const signer = await getSigner()
  const provider = getProvider()
  
  const marketAddress = getContractAddress('PredictionMarket', Number(provider.network.chainId))
  const contract = new ethers.Contract(marketAddress, PredictionMarketABI, signer)
  
  try {
    const result = options.result === 'yes' ? true : false
    
    console.log(chalk.gray(`  Market: ${options.market}`))
    console.log(chalk.gray(`  Result: ${options.result.toUpperCase()}`))
    
    const tx = await contract.resolveMarket(options.market, result)
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Market resolved!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Resolution failed:'), error.message)
    process.exit(1)
  }
}
