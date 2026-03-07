# 🦞 Integrasi Haven Framework dengan Clawdbot (clowd.bot / openclaw.ai)

## 📋 Situasi

**Clawdbot** (https://clowd.bot / https://openclaw.ai/) adalah **platform eksternal** untuk membuat dan mengelola AI agent. Kita tidak bisa mengubah code mereka secara langsung.

## 🎯 Solusi Integrasi

Ada 3 pendekatan untuk mengintegrasikan Haven Framework dengan Clawdbot:

---

## Option 1: Browser Extension (Recommended) ⭐

Buat browser extension yang **inject** button "Register on Haven" ke halaman Clawdbot.

### Cara Kerja:
```
User buka clowd.bot
    ↓
Extension detect halaman agent
    ↓
Inject button "Register on Haven"
    ↓
User click → Register via Haven smart contract
    ↓
Save result ke localStorage / database extension
```

### Step-by-Step:

#### 1. Buat Extension Structure

```
haven-clawdbot-extension/
├── manifest.json
├── content.js
├── styles.css
└── icon.png
```

#### 2. manifest.json

```json
{
  "manifest_version": 3,
  "name": "Haven Framework for Clawdbot",
  "version": "1.0.0",
  "description": "Register your Clawdbot agents on Haven Framework",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://clowd.bot/*",
        "https://openclaw.ai/*",
        "https://*.clowd.bot/*"
      ],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "48": "icon.png"
  }
}
```

#### 3. content.js - Inject Button

```javascript
// content.js

// Tunggu halaman load
setTimeout(() => {
  injectHavenButton()
}, 2000)

// Check setiap ada navigasi SPA
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(injectHavenButton, 1000)
  }
}).observe(document, { subtree: true, childList: true })

function injectHavenButton() {
  // Check apakah di halaman agent
  const isAgentPage = window.location.pathname.includes('/agent') || 
                      document.querySelector('[data-agent-id]')
  
  if (!isAgentPage) return

  // Cari tempat untuk inject button
  const agentCard = document.querySelector('.agent-card') || 
                    document.querySelector('[class*="agent"]') ||
                    document.querySelector('[class*="profile"]')

  if (!agentCard) return

  // Check apakah sudah ada button
  if (document.getElementById('haven-register-btn')) return

  // Extract agent info dari halaman
  const agentInfo = extractAgentInfo()
  
  if (!agentInfo) return

  // Create button container
  const btnContainer = document.createElement('div')
  btnContainer.id = 'haven-register-btn'
  btnContainer.className = 'haven-integration-container'
  
  btnContainer.innerHTML = `
    <div class="haven-badge">
      <span class="haven-icon">🏛️</span>
      <span class="haven-text">Haven Framework</span>
    </div>
    <button class="haven-register-button" id="haven-register-action">
      <span class="btn-icon">⛓️</span>
      <span class="btn-text">Register on Haven</span>
    </button>
    <div class="haven-status" id="haven-status"></div>
  `

  // Insert button
  agentCard.appendChild(btnContainer)

  // Add click handler
  document.getElementById('haven-register-action')?.addEventListener('click', () => {
    openHavenRegistration(agentInfo)
  })

  // Add styles
  addHavenStyles()
}

function extractAgentInfo() {
  // Extract dari halaman Clawdbot
  const agentId = document.querySelector('[data-agent-id]')?.dataset?.agentId ||
                  window.location.pathname.split('/').pop()
  
  const agentName = document.querySelector('h1')?.textContent ||
                    document.querySelector('[class*="name"]')?.textContent ||
                    'Unknown Agent'
  
  const capabilities = Array.from(
    document.querySelectorAll('[class*="capability"], [class*="tag"]')
  ).map(el => el.textContent.trim())

  return {
    id: agentId,
    name: agentName,
    capabilities: capabilities.slice(0, 5) // Max 5 capabilities
  }
}

async function openHavenRegistration(agentInfo) {
  // Load ethers dari CDN
  if (!window.ethers) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js'
    document.head.appendChild(script)
    
    await new Promise(resolve => script.onload = resolve)
  }

  // Check MetaMask
  if (!window.ethereum) {
    showStatus('Please install MetaMask!', 'error')
    return
  }

  try {
    // Connect wallet
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    
    // Check network
    const network = await provider.getNetwork()
    if (network.chainId !== 43113n) {
      await switchToFuji(provider)
    }

    // Show loading
    showStatus('Registering on Haven...', 'loading')

    // Call smart contract
    const contract = new ethers.Contract(
      '0xE5fB1158B69933d215c99adfd23D16d6e6293294',
      ['function registerAgentWithStrings(string,string[]) returns (uint256,address)'],
      signer
    )

    // Create metadata
    const metadata = {
      name: agentInfo.name,
      clawdbot_agent_id: agentInfo.id,
      capabilities: agentInfo.capabilities,
      registeredAt: new Date().toISOString(),
      source: 'clawdbot',
      version: '1.0.0'
    }

    const base64 = btoa(JSON.stringify(metadata))
    const metadataURI = `data:application/json;base64,${base64}`

    // Execute transaction
    const tx = await contract.registerAgentWithStrings(
      metadataURI,
      agentInfo.capabilities
    )

    showStatus('Confirming transaction...', 'loading')

    const receipt = await tx.wait()

    // Parse event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'AgentOneClickRegistered'
      } catch { return false }
    })

    const parsed = contract.interface.parseLog(event)
    const tokenId = parsed.args[1].toString()
    const tbaAddress = parsed.args[2]

    // Success!
    showStatus(
      `✅ Registered! Token ID: #${tokenId}`,
      'success',
      `https://testnet.snowscan.xyz/token/${tokenId}`
    )

    // Save to localStorage
    localStorage.setItem(`haven_${agentInfo.id}`, JSON.stringify({
      tokenId,
      tbaAddress,
      txHash: receipt.hash,
      registeredAt: new Date().toISOString()
    }))

  } catch (err) {
    console.error('Haven registration failed:', err)
    showStatus('Registration failed: ' + err.message, 'error')
  }
}

function showStatus(message, type, link = null) {
  const statusEl = document.getElementById('haven-status')
  if (!statusEl) return

  statusEl.className = `haven-status haven-status--${type}`
  statusEl.innerHTML = `
    <span>${message}</span>
    ${link ? `<a href="${link}" target="_blank" class="haven-link">View on Explorer →</a>` : ''}
  `
}

async function switchToFuji(provider) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xa869' }]
    })
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xa869',
          chainName: 'Avalanche Fuji Testnet',
          nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
          rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://testnet.snowscan.xyz']
        }]
      })
    }
  }
}

function addHavenStyles() {
  if (document.getElementById('haven-styles')) return

  const style = document.createElement('style')
  style.id = 'haven-styles'
  style.textContent = `
    .haven-integration-container {
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
    }

    .haven-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #818cf8;
    }

    .haven-icon {
      font-size: 18px;
    }

    .haven-register-button {
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .haven-register-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .haven-register-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .haven-status {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
    }

    .haven-status--loading {
      display: block;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .haven-status--success {
      display: block;
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .haven-status--error {
      display: block;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .haven-link {
      display: inline-block;
      margin-top: 8px;
      color: inherit;
      text-decoration: underline;
      font-weight: 600;
    }
  `

  document.head.appendChild(style)
}
```

---

## Option 2: Bookmarklet (Tanpa Install)

User bisa click bookmark untuk inject button Haven di halaman Clawdbot.

### Buat Bookmarklet:

```javascript
javascript:(function(){
  if(document.getElementById('haven-injected')){alert('Haven already loaded!');return;}
  
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js';
  script.onload=function(){
    // Load registration code dari CDN
    const code=document.createElement('script');
    code.src='https://your-cdn.com/haven-clawdbot-inject.js';
    document.head.appendChild(code);
  };
  document.head.appendChild(script);
  alert('Haven Framework loaded! Scroll to your agent card.');
})();
```

### Cara Pakai:
1. Buat bookmark baru di browser
2. Paste code di atas sebagai URL
3. Namakan "Register on Haven"
4. Buka clowd.bot → click bookmark

---

## Option 3: API Integration (Hubungi Clawdbot Team)

Contact Clawdbot untuk partnership:

```
Subject: Partnership - Integrate Haven Framework for On-Chain Agent Identity

Hi Clawdbot Team,

I'm from Haven Framework - a trustless infrastructure for AI agent coordination on Avalanche.

We'd like to integrate with Clawdbot to enable:
- ERC-8004 on-chain identity for Clawdbot agents
- ERC-6551 Token Bound Accounts
- Access to Haven's prediction markets and governance

Integration options:
1. We provide a widget/SDK for your platform
2. Browser extension for your users
3. Direct API integration

Would love to discuss this further!

Best regards,
[Your name]
```

---

## 🚀 Quick Start - Browser Extension

### 1. Buat Folder Extension

```bash
mkdir haven-clawdbot-extension
cd haven-clawdbot-extension
```

### 2. Save Files

Simpan semua code di atas ke folder extension.

### 3. Load di Chrome

1. Buka `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Pilih folder extension

### 4. Test

1. Buka https://clowd.bot
2. Navigate ke agent page
3. Lihat button "Register on Haven"

---

## 📊 Comparison

| Method | Pros | Cons | Difficulty |
|--------|------|------|------------|
| **Browser Extension** | Works immediately, no permission needed | Users need to install | ⭐⭐ Medium |
| **Bookmarklet** | No install, one-click | Less UI control | ⭐ Easy |
| **API Partnership** | Native integration | Need their approval | ⭐⭐⭐⭐ Hard |

---

## ✅ Recommendation

**Start dengan Browser Extension** karena:
- ✅ Tidak perlu izin dari Clawdbot
- ✅ Full control atas UI/UX
- ✅ Bisa iterate cepat
- ✅ Users bisa install/uninstall kapan saja

---

## 📁 Files Ready to Use

Semua code sudah tersedia di:
- `/root/soft/integration-clawdbot/src/` - SDK & components
- `/root/soft/integration-clawdbot/HOW_TO_LINK.md` - Integration guide

Tinggal copy code `content.js` di atas dan buat extension! 🚀
