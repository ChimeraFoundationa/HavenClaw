/**
 * Agent Commands
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import { getProvider, getSigner } from '../../../lib/provider.js'
import { getContractAddress } from '../../../config/contracts.js'

// AgentRegistry ABI
const AgentRegistryABI = [
  'function registerAgent(string memory metadataURI, bytes32[] memory capabilities) external',
  'function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32[] capabilities, uint256 registeredAt, uint256 verifiedAt, bool exists) info)',
  'event AgentRegistered(address indexed agent, string metadataURI, bytes32[] capabilities, uint256 timestamp)'
] as const

// TBA ABI for executing from TBA
const TBAABI = [
  'function execute(address to, uint256 value, bytes calldata data, uint8 operation) external returns (bytes memory result)'
] as const

export async function register(options: {
  name: string
  capabilities?: string
  metadata?: string
  owner?: string
  tba?: string
}) {
  console.log(chalk.blue('🏛️ Registering agent on Fuji Testnet...\n'))
  
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
    
    let tbaAddress: string | null = null
    
    // If TBA address provided via option, use it directly
    if (options.tba) {
      tbaAddress = options.tba
      const code = await provider.getCode(tbaAddress)
      if (code === '0x') {
        console.log(chalk.red(`✗ TBA not deployed at: ${tbaAddress}`))
        process.exit(1)
      }
      console.log(chalk.gray(`  Using provided TBA: ${tbaAddress}`))
    } else {
      // Try to find TBA
      const erc6551RegistryAddress = getContractAddress('ERC6551Registry', chainId)
      const erc6551Registry = new ethers.Contract(erc6551RegistryAddress, [
        'function account(address implementation,uint256 chainId,address tokenContract,uint256 tokenId,uint256 salt) external view returns (address)'
      ], provider)
      
      console.log(chalk.gray('  Searching for existing TBA...'))
      
      // Check TBA with wallet as token contract (most common pattern)
      const possibleTokenIds = [1n, 0n]
      const possibleSalts = [0n, 1n]
      
      for (const tokenId of possibleTokenIds) {
        for (const salt of possibleSalts) {
          // Try with wallet as token contract
          const addr = await erc6551Registry.account(
            '0x0000000000000000000000000000000000000000',
            chainId,
            signer.address,
            tokenId,
            salt
          )
          const code = await provider.getCode(addr)
          if (code !== '0x') {
            tbaAddress = addr
            console.log(chalk.gray(`  Found TBA: ${tbaAddress} (tokenId=${tokenId}, salt=${salt})`))
            break
          }
        }
        if (tbaAddress) break
      }
    }
    
    const hasTBA = tbaAddress !== null && tbaAddress !== undefined
    
    const agentRegistryAddress = getContractAddress('AgentRegistry', chainId)
    const capabilities = options.capabilities ? options.capabilities.split(',').map(c => c.trim()) : []
    const capabilitiesBytes32 = capabilities.map(c => ethers.id(c))
    const metadataUri = options.metadata || `data:application/json;base64,${Buffer.from(JSON.stringify({ name: options.name })).toString('base64')}`
    
    console.log(chalk.gray(`  Agent Name: ${options.name}`))
    console.log(chalk.gray(`  Capabilities: ${capabilities.join(', ') || 'none'}`))
    console.log(chalk.gray(`  Owner: ${signer.address}`))
    console.log(chalk.gray(`  TBA Address: ${hasTBA ? tbaAddress : 'Not found'}`))
    console.log(chalk.gray(`  Network: Fuji Testnet (Chain ID: ${chainId})`))
    console.log(chalk.gray(`  Contract: ${agentRegistryAddress}`))
    console.log('')
    
    if (!hasTBA) {
      console.log(chalk.yellow('⚠️  No TBA found!'))
      console.log(chalk.gray('   Please create TBA first:'))
      console.log(chalk.gray('   havenclaw tba create'))
      console.log(chalk.gray(''))
      console.log(chalk.gray('   Or specify TBA address:'))
      console.log(chalk.gray('   havenclaw agent register --name "ryu" --capabilities trading --tba 0x...'))
      console.log('')
      process.exit(1)
    }
    
    // Encode the registerAgent function call
    const agentRegistry = new ethers.Contract(agentRegistryAddress, AgentRegistryABI, provider)
    const registerData = agentRegistry.interface.encodeFunctionData('registerAgent', [metadataUri, capabilitiesBytes32])
    
    // Execute from TBA
    const tbaContract = new ethers.Contract(tbaAddress!, TBAABI, signer)
    
    console.log(chalk.yellow('Executing registration from TBA...'))
    const tx = await tbaContract.execute(agentRegistryAddress, 0, registerData, 0)
    console.log(chalk.gray(`  Transaction: ${tx.hash}`))
    console.log(chalk.yellow('  Waiting for confirmation...\n'))
    
    const receipt = await tx.wait()
    console.log(chalk.green('✓ Agent registered successfully!\n'))
    
    // Parse event
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = agentRegistry.interface.parseLog(log)
        return parsed?.name === 'AgentRegistered'
      } catch {
        return false
      }
    })
    
    if (event) {
      const parsed = agentRegistry.interface.parseLog(event)
      console.log(chalk.gray(`  Agent Address (TBA): ${parsed?.args[0]}`))
      console.log(chalk.gray(`  Metadata URI: ${parsed?.args[1]}`))
      console.log(chalk.gray(`  Capabilities: ${parsed?.args[2].length}`))
    }
    
    console.log(chalk.green('\n🎉 Your agent is now registered on Haven Framework!'))
    console.log(chalk.gray('   You can now:'))
    console.log(chalk.gray('   • Participate in prediction markets'))
    console.log(chalk.gray('   • Create and complete tasks'))
    console.log(chalk.gray('   • Earn HAVEN tokens'))
    console.log(chalk.gray('   • Build reputation\n'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Registration failed:'), error.message)
    
    if (error.message.includes('No private key')) {
      console.error(chalk.yellow('\n  Please set HAVENCLAW_PRIVATE_KEY environment variable'))
    } else if (error.message.includes('insufficient funds')) {
      console.error(chalk.yellow('\n⚠️  Insufficient AVAX for gas'))
      console.error(chalk.yellow('   Get test AVAX: https://faucet.avax.network/'))
      console.error(chalk.yellow('   Check balance: havenclaw wallet balance'))
    } else if (error.message.includes('CALL_EXCEPTION') || error.message.includes('execution reverted') || error.message.includes('missing revert data')) {
      console.error(chalk.yellow('\n⚠️  Transaction reverted. Possible causes:'))
      console.error(chalk.yellow('\n  1. TBA not created yet'))
      console.error(chalk.yellow('     → Create TBA first: havenclaw tba create'))
      console.error(chalk.yellow('\n  2. Agent already registered'))
      console.error(chalk.yellow('     → Your TBA may already be registered'))
      console.error(chalk.yellow('\n  3. Insufficient AVAX for gas'))
      console.error(chalk.yellow('     → Get test AVAX: https://faucet.avax.network/'))
      console.error(chalk.yellow('\n  4. Contract issue'))
      console.error(chalk.yellow('     → See: contracts/DEPLOYMENT_ADDRESSES.md'))
      console.error(chalk.yellow('     → See: TROUBLESHOOTING.md'))
    }
    
    process.exit(1)
  }
}

export async function list() {
  console.log(chalk.blue('📋 Listing registered agents...'))
  console.log(chalk.yellow('\nNote: Full agent listing requires an indexer.\n'))
}

export async function update(options: {
  agent: string
  metadata?: string
  capabilities?: string
}) {
  console.log(chalk.blue('🔄 Updating agent...'))
  
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
    
    const contractAddress = getContractAddress('AgentRegistry', chainId)
    const contract = new ethers.Contract(contractAddress, AgentRegistryABI, signer)
    
    if (options.metadata) {
      console.log(chalk.gray(`  New metadata: ${options.metadata}`))
      const tx = await contract.updateMetadata(options.metadata)
      await tx.wait()
      console.log(chalk.green('✓ Metadata updated'))
    }
    
    if (options.capabilities) {
      const capabilities = options.capabilities.split(',').map(c => ethers.id(c.trim()))
      console.log(chalk.gray(`  New capabilities: ${options.capabilities}`))
      const tx = await contract.updateCapabilities(capabilities)
      await tx.wait()
      console.log(chalk.green('✓ Capabilities updated'))
    }
    
  } catch (error: any) {
    console.error(chalk.red('✗ Update failed:'), error.message)
    process.exit(1)
  }
}

export async function verify(options: {
  agent: string
  proof: string
}) {
  console.log(chalk.blue('🔐 Verifying agent with ZK proof...'))
  
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
    
    const gatAddress = getContractAddress('GAT', chainId)
    const { GATABI } = await import('../../../config/abi/GAT.js')
    const contract = new ethers.Contract(gatAddress, GATABI, signer)
    
    const fs = await import('fs')
    const proofData = JSON.parse(fs.readFileSync(options.proof, 'utf-8'))
    
    console.log(chalk.gray(`  Proof file: ${options.proof}`))
    
    const tx = await contract.performTest(
      options.agent,
      ethers.id('capability_verification'),
      proofData.proof,
      proofData.publicInputs
    )
    
    console.log(chalk.yellow(`  Transaction: ${tx.hash}`))
    await tx.wait()
    
    console.log(chalk.green('✓ Agent verified successfully!'))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Verification failed:'), error.message)
    process.exit(1)
  }
}

export async function info(options: {
  address: string
}) {
  console.log(chalk.blue('📊 Getting agent information...'))
  
  try {
    const provider = getProvider()
    
    let chainId: number
    try {
      const network = await provider.getNetwork()
      chainId = Number(network.chainId)
    } catch (e) {
      chainId = 43113
    }
    
    const contractAddress = getContractAddress('AgentRegistry', chainId)
    const contract = new ethers.Contract(contractAddress, AgentRegistryABI, provider)
    
    const agentInfo = await contract.getAgent(options.address)
    
    console.log(chalk.green('\n✓ Agent Information:'))
    console.log(chalk.gray(`  Address: ${options.address}`))
    console.log(chalk.gray(`  Metadata URI: ${agentInfo.metadataURI}`))
    console.log(chalk.gray(`  Registered At: ${new Date(Number(agentInfo.registeredAt) * 1000).toISOString()}`))
    console.log(chalk.gray(`  Verified: ${agentInfo.isVerified}`))
    
  } catch (error: any) {
    console.error(chalk.red('✗ Failed to get agent info:'), error.message)
    process.exit(1)
  }
}
