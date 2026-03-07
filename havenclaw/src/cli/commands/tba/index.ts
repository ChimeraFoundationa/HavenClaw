/**
 * TBA (Token Bound Account) Commands
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import { getProvider, getSigner } from '../../../lib/provider.js'
import { getContractAddress } from '../../../config/contracts.js'

// ERC6551 Registry ABI
const ERC6551RegistryABI = [
  'function account(address implementation,uint256 chainId,address tokenContract,uint256 tokenId,uint256 salt) external view returns (address)',
  'function createAccount(address implementation,uint256 chainId,address tokenContract,uint256 tokenId,uint256 salt) external returns (address)',
  'event AccountCreated(address indexed account, address indexed implementation, uint256 indexed chainId, address tokenContract, uint256 tokenId)'
] as const

// ERC8004 Agent Registry ABI
const ERC8004RegistryABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenByIndex(address owner, uint256 index) external view returns (uint256)',
  'function mint() external returns (uint256)'
]

const ERC8004_CONTRACT = '0x8004A818BFB912233c491871b3d84c89A494BD9e' // Official ERC8004 on Fuji

/**
 * Check if wallet owns any ERC8004 NFT
 */
async function checkERC8004Ownership(provider: ethers.Provider, signerAddress: string): Promise<{ hasNFT: boolean; tokenIds: bigint[] }> {
  const erc8004 = new ethers.Contract(ERC8004_CONTRACT, ERC8004RegistryABI, provider)
  
  try {
    const balance = await erc8004.balanceOf(signerAddress)
    const tokenIds: bigint[] = []
    
    if (balance > 0n) {
      // Try to get token IDs by checking common IDs
      // This is a workaround since tokenByIndex might not be implemented
      const commonIds = [1n, 2n, 3n, 4n, 5n, 10n, 20n, 30n, 40n, 46n, 47n, 48n]
      for (const tokenId of commonIds) {
        try {
          const owner = await erc8004.ownerOf(tokenId)
          if (owner.toLowerCase() === signerAddress.toLowerCase()) {
            tokenIds.push(tokenId)
          }
        } catch (e) {
          // Token ID doesn't exist or error, skip
        }
      }
    }
    
    return { hasNFT: tokenIds.length > 0, tokenIds }
  } catch (e: any) {
    return { hasNFT: false, tokenIds: [] }
  }
}

/**
 * Mint ERC8004 NFT
 */
export async function mint() {
  console.log(chalk.blue('🎨 Minting ERC8004 Agent Identity NFT...\n'))

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

    const erc8004 = new ethers.Contract(ERC8004_CONTRACT, ERC8004RegistryABI, signer)

    console.log(chalk.gray(`  Contract: ${ERC8004_CONTRACT}`))
    console.log(chalk.gray(`  Network: Fuji Testnet (Chain ID: ${chainId})`))
    console.log('')

    // Check if already has NFT
    const ownership = await checkERC8004Ownership(provider, signer.address)
    if (ownership.hasNFT) {
      console.log(chalk.yellow('⚠️  You already own ERC8004 NFT(s):'))
      ownership.tokenIds.forEach(id => {
        console.log(chalk.gray(`  - Token ID: ${id}`))
      })
      console.log('')
      console.log(chalk.gray('  Continuing with mint anyway...'))
      console.log('')
    }

    console.log(chalk.yellow('Minting ERC8004 NFT...'))
    const tx = await erc8004.mint()
    console.log(chalk.gray(`  Transaction: ${tx.hash}`))

    const receipt = await tx.wait()
    
    // Parse event to get token ID
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = erc8004.interface.parseLog(log)
        return parsed?.name === 'Transfer'
      } catch {
        return false
      }
    })

    let tokenId = 'unknown'
    if (event) {
      const parsed = erc8004.interface.parseLog(event)
      tokenId = parsed?.args[2]?.toString() || 'unknown'
    }

    console.log(chalk.green('✓ NFT minted successfully!\n'))
    console.log(chalk.gray(`  Token ID: ${tokenId}`))
    console.log(chalk.gray(`  Transaction: ${tx.hash}`))
    console.log('')
    console.log(chalk.green('Next: Run `havenclaw tba create` to create Token Bound Account'))

  } catch (error: any) {
    console.error(chalk.red('✗ Mint failed:'), error.message)

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
 * Get TBA address for user's ERC8004 NFT
 */
export async function get(options: { tokenId?: string } = {}) {
  console.log(chalk.blue('📊 Getting ERC6551 TBA Address...\n'))

  try {
    const signer = await getSigner()
    const provider = getProvider()

    let chainId: number
    try {
      const network = await provider.getNetwork()
      chainId = Number(network.chainId)
    } catch (e) {
      chainId = 43113 // Default to Fuji
    }

    // Check NFT ownership first
    const ownership = await checkERC8004Ownership(provider, signer.address)
    
    if (!ownership.hasNFT) {
      console.log(chalk.yellow('⚠️  You don\'t own any ERC8004 NFT!'))
      console.log(chalk.gray(''))
      console.log(chalk.gray('  Please mint an NFT first:'))
      console.log(chalk.gray('  havenclaw nft mint'))
      console.log('')
      process.exit(1)
    }

    // Use specified token ID or first owned NFT
    let tokenId: bigint
    if (options.tokenId) {
      tokenId = BigInt(options.tokenId)
      // Verify ownership
      const erc8004 = new ethers.Contract(ERC8004_CONTRACT, ERC8004RegistryABI, provider)
      const owner = await erc8004.ownerOf(tokenId)
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(chalk.red(`✗ You don't own NFT #${tokenId}`))
        process.exit(1)
      }
    } else {
      tokenId = ownership.tokenIds[0]
    }

    const erc6551RegistryAddress = getContractAddress('ERC6551Registry', chainId)
    const registry = new ethers.Contract(erc6551RegistryAddress, ERC6551RegistryABI, provider)

    const implementation = '0x0000000000000000000000000000000000000000'
    const salt = 0n

    // Calculate TBA address
    const tbaAddress = await registry.account(implementation, chainId, ERC8004_CONTRACT, tokenId, salt)

    console.log(chalk.gray(`  ERC8004 Contract: ${ERC8004_CONTRACT}`))
    console.log(chalk.gray(`  Token ID: ${tokenId}`))
    console.log(chalk.gray(`  Chain ID: ${chainId}`))
    console.log('')

    // Check if TBA is deployed
    const code = await provider.getCode(tbaAddress)
    const isDeployed = code !== '0x'

    console.log(chalk.green('✓ TBA Address:'))
    console.log(chalk.gray(`  ${tbaAddress}`))
    console.log(chalk.gray(`  Status: ${isDeployed ? 'Deployed ✓' : 'Not deployed yet'}`))

    if (!isDeployed) {
      console.log('')
      console.log(chalk.gray('  Run: havenclaw tba create'))
    }

  } catch (error: any) {
    console.error(chalk.red('✗ Failed to get TBA:'), error.message)
    process.exit(1)
  }
}

/**
 * Create TBA for user's ERC8004 NFT
 */
export async function create(options: { tokenId?: string } = {}) {
  console.log(chalk.blue('🔐 Creating ERC6551 Token Bound Account...\n'))

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

    // Check NFT ownership first
    const ownership = await checkERC8004Ownership(provider, signer.address)
    
    if (!ownership.hasNFT) {
      console.log(chalk.yellow('⚠️  You don\'t own any ERC8004 NFT!'))
      console.log(chalk.gray(''))
      console.log(chalk.gray('  Please mint an NFT first:'))
      console.log(chalk.gray('  havenclaw nft mint'))
      console.log('')
      process.exit(1)
    }

    const erc6551RegistryAddress = getContractAddress('ERC6551Registry', chainId)
    const registry = new ethers.Contract(erc6551RegistryAddress, ERC6551RegistryABI, signer)

    // Use specified token ID or first owned NFT
    let tokenId: bigint
    if (options.tokenId) {
      tokenId = BigInt(options.tokenId)
      // Verify ownership
      const erc8004 = new ethers.Contract(ERC8004_CONTRACT, ERC8004RegistryABI, provider)
      const owner = await erc8004.ownerOf(tokenId)
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(chalk.red(`✗ You don't own NFT #${tokenId}`))
        process.exit(1)
      }
    } else {
      tokenId = ownership.tokenIds[0]
    }

    const implementation = '0x0000000000000000000000000000000000000000' // Use zero address as implementation
    const salt = 100n // Use salt=100 for new TBA (avoid collisions)

    // Calculate predicted TBA address
    const tbaAddress = await registry.account(implementation, chainId, ERC8004_CONTRACT, tokenId, salt)

    console.log(chalk.gray(`  Implementation: ${implementation}`))
    console.log(chalk.gray(`  Token Contract: ${ERC8004_CONTRACT}`))
    console.log(chalk.gray(`  Token ID: ${tokenId} (Your ERC8004 NFT)`))
    console.log(chalk.gray(`  Salt: ${salt}`))
    console.log(chalk.gray(`  Chain ID: ${chainId}`))
    console.log('')
    console.log(chalk.gray(`  Predicted TBA Address: ${tbaAddress}`))
    console.log('')

    // Check if already deployed
    const code = await provider.getCode(tbaAddress)
    if (code !== '0x') {
      console.log(chalk.yellow('⚠️  TBA already deployed at this address'))
      console.log(chalk.gray(`  Address: ${tbaAddress}`))
      return
    }

    console.log(chalk.yellow('Creating TBA...'))
    const tx = await registry.createAccount(implementation, chainId, ERC8004_CONTRACT, tokenId, salt)
    console.log(chalk.gray(`  Transaction: ${tx.hash}`))

    const receipt = await tx.wait()
    
    // Extract TBA address from event
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = registry.interface.parseLog(log)
        return parsed?.name === 'AccountCreated'
      } catch {
        return false
      }
    })

    let actualTBAAddress: string | null = null
    if (event) {
      const parsed = registry.interface.parseLog(event)
      actualTBAAddress = parsed?.args[0]
      console.log(chalk.green('✓ TBA created successfully!\n'))
      console.log(chalk.gray(`  TBA Address: ${actualTBAAddress}`))
      console.log(chalk.gray(`  Transaction: ${tx.hash}`))
    } else {
      console.log(chalk.green('✓ TBA created successfully!\n'))
      console.log(chalk.gray(`  TBA Address: ${tbaAddress}`))
      console.log(chalk.gray(`  Transaction: ${tx.hash}`))
      actualTBAAddress = tbaAddress
    }
    
    console.log('')
    console.log(chalk.green('Next: Run `havenclaw agent register` to register your agent'))
    
    // Return the actual TBA address for use in registration
    return actualTBAAddress

  } catch (error: any) {
    console.error(chalk.red('✗ TBA creation failed:'), error.message)

    if (error.message.includes('No private key')) {
      console.error(chalk.yellow('\n  Please set HAVENCLAW_PRIVATE_KEY environment variable'))
    } else if (error.message.includes('insufficient funds')) {
      console.error(chalk.yellow('\n  Insufficient AVAX for gas'))
      console.error(chalk.yellow('  Get test AVAX: https://faucet.avax.network/'))
    } else if (error.message.includes('CREATE2 failed')) {
      console.error(chalk.yellow('\n  CREATE2 failed - this might be due to:'))
      console.error(chalk.yellow('  1. Insufficient gas'))
      console.error(chalk.yellow('  2. Implementation address issue'))
      console.error(chalk.yellow('  Try with a different implementation address'))
    }

    process.exit(1)
  }
}
