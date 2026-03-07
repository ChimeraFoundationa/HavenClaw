// utils/ipfs.js
import { create } from 'ipfs-http-client'

// IPFS configuration
const ipfsConfig = {
  host: process.env.IPFS_HOST || 'ipfs.infura.io',
  port: process.env.IPFS_PORT || 5001,
  protocol: 'https',
  headers: {}
}

// Add Infura auth if available
if (process.env.INFURA_PROJECT_ID && process.env.INFURA_PROJECT_SECRET) {
  const auth = Buffer.from(`${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`).toString('base64')
  ipfsConfig.headers.authorization = `Basic ${auth}`
}

// Create IPFS client
let ipfs = null
try {
  ipfs = create(ipfsConfig)
} catch (error) {
  console.error('Failed to create IPFS client:', error.message)
}

/**
 * Upload metadata to IPFS
 * @param {Object} metadata - Metadata object to upload
 * @returns {Promise<string>} IPFS URI
 */
export async function uploadMetadataToIPFS(metadata) {
  if (!ipfs) {
    console.warn('IPFS not configured, using data URI fallback')
    return createDataURI(metadata)
  }

  try {
    const added = await ipfs.add(JSON.stringify(metadata), {
      pin: true,
      cidVersion: 1
    })
    
    const ipfsUri = `ipfs://${added.path}`
    console.log('Uploaded to IPFS:', ipfsUri)
    return ipfsUri
  } catch (error) {
    console.error('IPFS upload failed, using data URI fallback:', error.message)
    return createDataURI(metadata)
  }
}

/**
 * Create data URI as fallback
 * @param {Object} metadata - Metadata object
 * @returns {string} Data URI
 */
function createDataURI(metadata) {
  const json = JSON.stringify(metadata)
  const base64 = Buffer.from(json).toString('base64')
  return `data:application/json;base64,${base64}`
}

/**
 * Get metadata from IPFS URI
 * @param {string} uri - IPFS URI
 * @returns {Promise<Object>} Metadata object
 */
export async function getMetadataFromIPFS(uri) {
  if (!uri) {
    throw new Error('URI is required')
  }

  // Handle data URI
  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1]
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(json)
  }

  // Handle IPFS URI
  if (uri.startsWith('ipfs://')) {
    if (!ipfs) {
      throw new Error('IPFS client not available')
    }

    const path = uri.replace('ipfs://', '')
    const chunks = []
    
    for await (const chunk of ipfs.cat(path)) {
      chunks.push(chunk)
    }
    
    const json = Buffer.concat(chunks).toString('utf-8')
    return JSON.parse(json)
  }

  throw new Error('Invalid URI format')
}
