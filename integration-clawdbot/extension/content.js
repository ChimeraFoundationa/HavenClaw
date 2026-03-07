/**
 * Haven Framework for Clawdbot - Content Script
 * Injects registration button into Clawdbot agent pages
 */

(function() {
  'use strict'

  // Configuration
  const HAVEN_CONFIG = {
    ONE_CLICK_ADDRESS: '0xE5fB1158B69933d215c99adfd23D16d6e6293294',
    FUJI_CHAIN_ID: 43113,
    EXPLORER_URL: 'https://testnet.snowscan.xyz'
  }

  const ONE_CLICK_ABI = [
    'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
    'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
  ]

  // State
  let isInjected = false
  let currentAgent = null

  // ============================================================================
  // Main Functions
  // ============================================================================

  function init() {
    console.log('[Haven] Initializing Haven Framework integration...')
    
    // Wait for page to load
    setTimeout(() => {
      injectButton()
    }, 2000)

    // Observe SPA navigation
    observeNavigation()
  }

  function injectButton() {
    if (isInjected) return

    // Check if on agent page
    const agentInfo = extractAgentInfo()
    if (!agentInfo) {
      console.log('[Haven] Not on agent page, skipping injection')
      return
    }

    currentAgent = agentInfo
    console.log('[Haven] Found agent:', agentInfo)

    // Find injection point
    const injectionPoint = findInjectionPoint()
    if (!injectionPoint) {
      console.log('[Haven] No injection point found')
      return
    }

    // Create and inject button
    const buttonContainer = createButtonContainer(agentInfo)
    injectionPoint.appendChild(buttonContainer)

    isInjected = true
    console.log('[Haven] Button injected successfully')
  }

  function extractAgentInfo() {
    // Try multiple selectors to find agent info
    const selectors = {
      id: [
        '[data-agent-id]',
        '[data-id]',
        '.agent-id',
        '[class*="agent-id"]'
      ],
      name: [
        'h1',
        '[class*="agent-name"]',
        '[class*="name"] h1',
        '.profile-name'
      ],
      capabilities: [
        '[class*="capability"]',
        '[class*="tag"]',
        '[class*="skill"]',
        '.agent-skills span'
      ]
    }

    // Extract agent ID
    let agentId = null
    for (const selector of selectors.id) {
      const el = document.querySelector(selector)
      if (el) {
        agentId = el.dataset?.agentId || el.dataset?.id || el.textContent.trim()
        break
      }
    }

    // If no ID found, try from URL
    if (!agentId) {
      const urlParts = window.location.pathname.split('/')
      agentId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2]
    }

    // Extract agent name
    let agentName = 'Unknown Agent'
    for (const selector of selectors.name) {
      const el = document.querySelector(selector)
      if (el) {
        agentName = el.textContent.trim().slice(0, 50)
        break
      }
    }

    // Extract capabilities
    const capabilities = []
    for (const selector of selectors.capabilities) {
      const els = document.querySelectorAll(selector)
      els.forEach(el => {
        const cap = el.textContent.trim()
        if (cap && cap.length < 30 && !capabilities.includes(cap)) {
          capabilities.push(cap)
        }
      })
    }

    if (!agentId || agentId === window.location.pathname) {
      return null
    }

    return {
      id: agentId,
      name: agentName,
      capabilities: capabilities.slice(0, 5)
    }
  }

  function findInjectionPoint() {
    // Try multiple locations
    const locations = [
      () => document.querySelector('.agent-card'),
      () => document.querySelector('[class*="agent-card"]'),
      () => document.querySelector('[class*="agent-profile"]'),
      () => document.querySelector('[class*="agent-header"]'),
      () => document.querySelector('.profile-section'),
      () => document.querySelector('[class*="info-section"]'),
      () => {
        // Fallback: find main content area
        const main = document.querySelector('main') || document.querySelector('[role="main"]')
        return main?.querySelector('div:first-child')
      }
    ]

    for (const finder of locations) {
      const el = finder()
      if (el) return el
    }

    return null
  }

  function createButtonContainer(agentInfo) {
    const container = document.createElement('div')
    container.className = 'haven-integration-container'
    container.id = 'haven-integration-container'

    container.innerHTML = `
      <div class="haven-badge">
        <span class="haven-icon">🏛️</span>
        <span class="haven-text">Haven Framework</span>
      </div>
      
      <p class="haven-description">
        Register this agent on Haven Framework to get ERC-8004 identity and ERC-6551 Token Bound Account
      </p>
      
      <button class="haven-register-button" id="haven-register-action">
        <span class="btn-icon">⛓️</span>
        <span class="btn-text">Register on Haven</span>
      </button>
      
      <div class="haven-status" id="haven-status"></div>
      
      <div class="haven-info">
        <div class="haven-info-item">
          <span class="info-label">Network:</span>
          <span class="info-value">Avalanche Fuji</span>
        </div>
        <div class="haven-info-item">
          <span class="info-label">Est. Gas:</span>
          <span class="info-value">~0.002 AVAX</span>
        </div>
      </div>
    `

    // Add click handler
    const button = container.querySelector('#haven-register-action')
    button.addEventListener('click', () => handleRegisterClick(agentInfo))

    return container
  }

  async function handleRegisterClick(agentInfo) {
    const button = document.querySelector('#haven-register-action')
    button.disabled = true

    try {
      // Load ethers if not available
      if (!window.ethers) {
        showStatus('loading', 'Loading Web3 library...')
        await loadEthersLibrary()
      }

      // Check wallet
      if (!window.ethereum) {
        showStatus('error', 'Please install MetaMask or another Web3 wallet!')
        button.disabled = false
        return
      }

      // Connect wallet
      showStatus('loading', 'Connecting wallet...')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Check network
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(HAVEN_CONFIG.FUJI_CHAIN_ID)) {
        showStatus('loading', 'Switching to Avalanche Fuji...')
        await switchToFuji(provider)
      }

      // Create contract
      showStatus('loading', 'Preparing registration...')
      const contract = new ethers.Contract(
        HAVEN_CONFIG.ONE_CLICK_ADDRESS,
        ONE_CLICK_ABI,
        signer
      )

      // Create metadata
      const metadata = {
        name: agentInfo.name,
        clawdbot_agent_id: agentInfo.id,
        owner: address,
        capabilities: agentInfo.capabilities,
        registeredAt: new Date().toISOString(),
        source: 'clawdbot',
        version: '1.0.0'
      }

      const metadataURI = createMetadataURI(metadata)

      // Execute transaction
      showStatus('loading', 'Please sign the transaction in your wallet...')
      const tx = await contract.registerAgentWithStrings(metadataURI, agentInfo.capabilities)

      showStatus('loading', `Transaction submitted! Waiting for confirmation...<br><small>Tx: ${tx.hash.slice(0, 20)}...</small>`)

      const receipt = await tx.wait()

      // Parse event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch { return false }
      })

      if (!event) {
        throw new Error('Could not parse registration event')
      }

      const parsed = contract.interface.parseLog(event)
      const tokenId = parsed.args[1].toString()
      const tbaAddress = parsed.args[2]

      // Success!
      showStatus('success', `
        ✅ Agent registered successfully!<br>
        <strong>Token ID: #${tokenId}</strong><br>
        <a href="${HAVEN_CONFIG.EXPLORER_URL}/token/${HAVEN_CONFIG.ONE_CLICK_ADDRESS}?a=${tokenId}" target="_blank" class="haven-link">View on Explorer →</a>
      `)

      // Save to storage
      saveRegistration(agentInfo.id, {
        tokenId,
        tbaAddress,
        txHash: receipt.hash,
        registeredAt: new Date().toISOString()
      })

    } catch (err) {
      console.error('[Haven] Registration failed:', err)
      showStatus('error', `Registration failed: ${err.message}`)
    } finally {
      button.disabled = false
    }
  }

  function showStatus(type, message) {
    const statusEl = document.getElementById('haven-status')
    if (!statusEl) return

    statusEl.className = `haven-status haven-status--${type}`
    statusEl.innerHTML = message
    statusEl.style.display = 'block'
  }

  async function loadEthersLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js'
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load Web3 library'))
      document.head.appendChild(script)
    })
  }

  async function switchToFuji(provider) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${HAVEN_CONFIG.FUJI_CHAIN_ID.toString(16)}` }]
      })
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${HAVEN_CONFIG.FUJI_CHAIN_ID.toString(16)}`,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: [HAVEN_CONFIG.EXPLORER_URL]
          }]
        })
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  function createMetadataURI(metadata) {
    const json = JSON.stringify(metadata, null, 2)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(json)
    
    let binary = ''
    for (let i = 0; i < encoded.length; i++) {
      binary += String.fromCharCode(encoded[i])
    }
    const base64 = btoa(binary)
    
    return `data:application/json;base64,${base64}`
  }

  function saveRegistration(agentId, data) {
    // Save to localStorage
    const key = `haven_registration_${agentId}`
    localStorage.setItem(key, JSON.stringify(data))
    
    // Also save to chrome storage if available
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ [key]: data })
    }
  }

  function observeNavigation() {
    // Observe for SPA navigation
    let lastUrl = location.href
    
    new MutationObserver(() => {
      const url = location.href
      if (url !== lastUrl) {
        lastUrl = url
        isInjected = false
        setTimeout(() => injectButton(), 1500)
      }
    }).observe(document, { subtree: true, childList: true })
  }

  // ============================================================================
  // Initialize
  // ============================================================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

})()
