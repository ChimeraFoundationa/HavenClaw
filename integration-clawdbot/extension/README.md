# 🏛️ Haven Framework for Clawdbot - Browser Extension

Browser extension untuk register AI agents dari Clawdbot ke Haven Framework.

## 📦 Install

### Chrome/Brave/Edge

1. **Download Extension**
   ```bash
   cd /root/soft/integration-clawdbot/extension
   ```

2. **Buka Chrome Extensions**
   - Buka `chrome://extensions/`
   - Atau `brave://extensions/`
   - Atau `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle "Developer mode" di pojok kanan atas

4. **Load Extension**
   - Click "Load unpacked"
   - Pilih folder `extension/`

5. **Done!** ✅
   - Extension icon akan muncul di toolbar
   - Buka https://clowd.bot atau https://openclaw.ai

## 🚀 Cara Pakai

### 1. Buka Clawdbot

Navigate ke agent page:
```
https://clowd.bot/agent/{agent-id}
```

### 2. Lihat Button Haven

Scroll ke bagian agent info, akan muncul:
```
┌────────────────────────────────────┐
│ 🏛️ Haven Framework                 │
├────────────────────────────────────┤
│ Register this agent on Haven       │
│ Framework to get ERC-8004 identity │
│                                    │
│ [⛓️ Register on Haven]            │
│                                    │
│ Network: Avalanche Fuji            │
│ Est. Gas: ~0.002 AVAX              │
└────────────────────────────────────┘
```

### 3. Click "Register on Haven"

1. Connect MetaMask wallet
2. Switch ke Avalanche Fuji (jika belum)
3. Sign transaction
4. Wait for confirmation (~15-30 detik)

### 4. Success! ✅

Agent kamu sekarang punya:
- ✅ ERC-8004 Identity NFT
- ✅ ERC-6551 Token Bound Account
- ✅ Registered di Haven Framework

## 🔍 Features

| Feature | Description |
|---------|-------------|
| **Auto-detect** | Automatically detect agent pages |
| **One-click Register** | Single transaction untuk semua registration |
| **Metadata Preservation** | Clawdbot agent ID tersimpan di metadata |
| **Status Tracking** | Real-time registration status |
| **Explorer Link** | Direct link ke Snowscan explorer |

## 🛠️ Development

### Structure

```
extension/
├── manifest.json      # Extension config
├── content.js         # Main injection script
├── styles.css         # Button styles
├── popup.html         # Extension popup
└── icons/            # Extension icons
```

### Modify Code

Edit `content.js` untuk customize:
- Injection logic
- Button appearance
- Registration flow

### Reload Extension

1. Buka `chrome://extensions/`
2. Click refresh icon pada extension
3. Refresh halaman Clawdbot

## 🐛 Troubleshooting

### Button tidak muncul

1. **Check console** - Buka DevTools (F12), lihat error
2. **Reload extension** - Click refresh di chrome://extensions
3. **Refresh halaman** - Reload halaman Clawdbot
4. **Check selector** - Agent page structure mungkin berubah

### Transaction failed

1. **Check network** - Pastikan di Avalanche Fuji
2. **Check balance** - Butuh ~0.002 AVAX untuk gas
3. **Retry** - Click button lagi

### MetaMask tidak connect

1. **Install MetaMask** - https://metamask.io
2. **Add Fuji network** - Extension akan auto-prompt
3. **Get test AVAX** - https://core.app/tools/testnet-faucet

## 📊 Contract Info

| Contract | Address |
|----------|---------|
| **OneClick Registrar** | `0xE5fB1158B69933d215c99adfd23D16d6e6293294` |
| **ERC8004 Registry** | `0x187A01e251dF08D5908d61673EeF1157306F974C` |
| **ERC6551 Registry** | `0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464` |

Explorer: https://testnet.snowscan.xyz

## 🔐 Privacy & Security

- ✅ **No data collection** - Extension tidak collect user data
- ✅ **Open source** - Semua code visible di `/root/soft/integration-clawdbot/`
- ✅ **Local execution** - Semua logic jalan di browser user
- ✅ **No backend** - Tidak ada server yang involved

## 📝 Supported Sites

| Site | Status |
|------|--------|
| clowd.bot | ✅ Supported |
| openclaw.ai | ✅ Supported |
| *.clowd.bot | ✅ Supported |
| *.openclaw.ai | ✅ Supported |

## 🎨 Customization

### Change Button Style

Edit `styles.css`:
```css
.haven-register-button {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR 100%);
}
```

### Change Injection Location

Edit `content.js`, function `findInjectionPoint()`:
```javascript
function findInjectionPoint() {
  return document.querySelector('.YOUR_SELECTOR')
}
```

## 📞 Support

- **Documentation**: `/root/soft/integration-clawdbot/CLAWDBOT_INTEGRATION.md`
- **Issues**: Report di GitHub
- **Discord**: [Join server]

## 📄 License

MIT License - same as Haven Framework

---

**Version**: 1.0.0  
**Last Updated**: March 7, 2026  
**Network**: Avalanche Fuji Testnet
