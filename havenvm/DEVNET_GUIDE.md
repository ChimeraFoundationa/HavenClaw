# 🚀 HavenVM Devnet Deployment Guide

## Prerequisites

- Go 1.23.7+ (already installed ✅)
- Git
- 10GB free disk space
- 4GB RAM minimum

---

## Step 1: Install AvalancheGo

```bash
# Clone AvalancheGo repository
cd /root/soft
git clone https://github.com/ava-labs/avalanchego.git
cd avalanchego

# Build AvalancheGo
./scripts/build.sh

# Install to system path
sudo cp build/avalanchego /usr/local/bin/
sudo chmod +x /usr/local/bin/avalanchego

# Verify installation
avalanchego --version
```

Expected output:
```
avalanchego/1.11.x
```

---

## Step 2: Setup HavenVM Plugin

```bash
# Copy HavenVM binary to plugins directory
mkdir -p ~/.avalanchego/plugins
cp /root/soft/havenvm/bin/havenvm ~/.avalanchego/plugins/havenvm
chmod +x ~/.avalanchego/plugins/havenvm

# Verify
ls -lh ~/.avalanchego/plugins/
# Should show: havenvm (34M)
```

---

## Step 3: Configure Chain

```bash
# Create chain configuration directory
mkdir -p ~/.avalanchego/chains/havenvm

# Configuration already created at:
# ~/.avalanchego/chains/havenvm/config.json
```

---

## Step 4: Start Devnet

```bash
cd /root/soft/havenvm

# Start HavenVM devnet
./scripts/start-devnet.sh
```

Expected output:
```
🚀 Starting HavenVM Devnet...
📋 Stopping existing AvalancheGo processes...
🔗 Starting AvalancheGo with HavenVM...
⏳ Waiting for AvalancheGo to start...
✅ AvalancheGo is running!

📊 HavenVM Devnet Status:
   - HTTP RPC: http://127.0.0.1:9650
   - Staking Port: 9651
   - Network ID: local
```

---

## Step 5: Verify Installation

### Check Node Health

```bash
curl -X POST http://127.0.0.1:9650/ext/health \
  -H 'content-type:application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"health.health"}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "healthy": true
  },
  "id": 1
}
```

### Check HavenVM is Loaded

```bash
curl -X POST -d '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"info.getVMs"
}' -H 'content-type:application/json;' \
  http://127.0.0.1:9650/ext/info
```

Look for `"havenvm"` in the response.

### Check Chain is Running

```bash
curl -X POST -d '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_blockNumber"
}' -H 'content-type:application/json;' \
  http://127.0.0.1:9650/ext/bc/havenvm/rpc
```

---

## Step 6: Interact with HavenVM

### Generate Key

```bash
cd /root/soft/havenvm
./bin/haven-cli key generate devnet-user
```

### Check Address

```bash
./bin/haven-cli key address devnet-user
```

### View Keys

```bash
./bin/haven-cli key list
```

---

## Troubleshooting

### AvalancheGo Won't Start

```bash
# Check logs
tail -f ~/.avalanchego/logs/avalanche.log

# Common issues:
# 1. Port already in use
#    Solution: Change http-port in config.json

# 2. Plugin not found
#    Solution: cp bin/havenvm ~/.avalanchego/plugins/

# 3. Permission denied
#    Solution: chmod +x ~/.avalanchego/plugins/havenvm
```

### HavenVM Not Loading

```bash
# Check plugin binary
file ~/.avalanchego/plugins/havenvm
# Should show: ELF 64-bit LSB executable

# Check VM ID
# VM ID is derived from name "havenvm"
# Should be visible in AvalancheGo logs
```

### RPC Connection Failed

```bash
# Check if AvalancheGo is running
ps aux | grep avalanchego

# Check port
netstat -tulpn | grep 9650

# Try localhost
curl http://127.0.0.1:9650/ext/info
```

---

## Stop Devnet

```bash
cd /root/soft/havenvm
./scripts/stop-devnet.sh
```

Or manually:
```bash
pkill -f avalanchego
```

---

## Clean Restart

```bash
# Stop devnet
./scripts/stop-devnet.sh

# Remove database (WARNING: deletes all data)
rm -rf ~/.avalanchego/db

# Restart
./scripts/start-devnet.sh
```

---

## Network Configuration

| Parameter | Value |
|-----------|-------|
| **Network ID** | local |
| **HTTP Port** | 9650 |
| **Staking Port** | 9651 |
| **VM ID** | havenvm |
| **Chain Name** | havenvm |
| **RPC URL** | http://127.0.0.1:9650/ext/bc/havenvm/rpc |

---

## Genesis Allocation

Initial token distribution configured in `~/.avalanchego/chains/havenvm/config.json`:

| Address | Balance (HAVEN) |
|---------|----------------|
| 0x0000...775 | 1,000,000 |

---

## Next Steps

1. **Create Transactions** - Use CLI to submit actions
2. **Deploy dApps** - Build applications on HavenVM
3. **Monitor** - Setup Prometheus + Grafana
4. **Add Validators** - Expand network

---

## Resources

- **HavenVM Repo**: https://github.com/ChimeraFoundationa/HavenVM
- **AvalancheGo Docs**: https://docs.avax.network
- **HyperSDK Docs**: https://github.com/ava-labs/hypersdk

---

*Last Updated: March 7, 2026*
