#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🤖 OpenClaw Agent - One-Line Setup                 ║${NC}"
echo -e "${BLUE}║     Autonomous AI Agents on Avalanche                  ║${NC}"
echo -e "${BLUE}║     Repo: github.com/ChimeraFoundationa/HavenClaw      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
AGENT_NAME=""
CAPABILITIES=""
AUTO_REGISTER=false
NETWORK="fuji"

while [[ $# -gt 0 ]]; do
  case $1 in
    --agent-name)
      AGENT_NAME="$2"
      shift 2
      ;;
    --capabilities)
      CAPABILITIES="$2"
      shift 2
      ;;
    --auto-register)
      AUTO_REGISTER=true
      shift
      ;;
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --help)
      echo "Usage: curl -fsSL https://openclaw.ai/install.sh | bash -s -- [options]"
      echo ""
      echo "Options:"
      echo "  --agent-name      Name for your agent (e.g., 'Trading Bot')"
      echo "  --capabilities    Comma-separated capabilities (e.g., 'trading,analysis')"
      echo "  --auto-register   Automatically register agent on-chain"
      echo "  --network         Network: fuji (default) or local"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check prerequisites
echo -e "${YELLOW}📦 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js 22+ first.${NC}"
  echo "   https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}❌ Node.js 22+ required. You have v$NODE_VERSION${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
  npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Check Foundry (optional, for local development)
FOUNDRY_INSTALLED=false
if command -v forge &> /dev/null; then
  FOUNDRY_INSTALLED=true
  echo -e "${GREEN}✓ Foundry installed${NC}"
else
  echo -e "${YELLOW}⚠️  Foundry not installed (optional, for local blockchain)${NC}"
  echo "   Install: curl -L https://foundry.paradigm.xyz | bash"
fi

# Clone repository
echo -e "${YELLOW}📥 Cloning OpenClaw Agent...${NC}"
if [ -d "HavenClaw" ]; then
  echo -e "${YELLOW}⚠️  HavenClaw directory already exists${NC}"
  cd HavenClaw
else
  git clone https://github.com/ChimeraFoundationa/HavenClaw.git HavenClaw
  cd HavenClaw
fi
echo -e "${GREEN}✓ Repository cloned${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build packages
echo -e "${YELLOW}🔨 Building packages...${NC}"
pnpm build
echo -e "${GREEN}✓ Build complete${NC}"

# Create configuration
echo -e "${YELLOW}⚙️  Creating configuration...${NC}"

if [ -f "agent-config.yaml" ]; then
  echo -e "${YELLOW}⚠️  agent-config.yaml already exists${NC}"
else
  # Copy example config
  cp agent-config-fuji.yaml agent-config.yaml
  
  # Update agent name if provided
  if [ -n "$AGENT_NAME" ]; then
    sed -i.bak "s/agentName: \".*\"/agentName: \"$AGENT_NAME\"/" agent-config.yaml
    rm -f agent-config.yaml.bak
  fi
  
  echo -e "${GREEN}✓ Configuration created${NC}"
fi

# Prompt for private key if not set
if [ -z "$OPERATOR_PRIVATE_KEY" ]; then
  echo ""
  echo -e "${YELLOW}🔐 Enter your private key (for signing transactions):${NC}"
  echo -e "${YELLOW}   (Leave empty to configure manually in agent-config.yaml)${NC}"
  read -sp "   Private Key: " PRIVATE_KEY_INPUT
  echo ""
  
  if [ -n "$PRIVATE_KEY_INPUT" ]; then
    # Update config with private key
    sed -i.bak "s|operatorPrivateKey: \".*\"|operatorPrivateKey: \"$PRIVATE_KEY_INPUT\"|" agent-config.yaml
    rm -f agent-config.yaml.bak
    echo -e "${GREEN}✓ Private key configured${NC}"
  fi
fi

# Create identity if capabilities provided
if [ -n "$CAPABILITIES" ]; then
  echo ""
  echo -e "${YELLOW}🆔 Creating agent identity...${NC}"
  pnpm havenclaw-agent create-identity \
    --config agent-config.yaml \
    --name "${AGENT_NAME:-OpenClaw Agent}" \
    --capabilities "$CAPABILITIES"
  echo -e "${GREEN}✓ Identity created${NC}"
fi

# Auto-register if requested
if [ "$AUTO_REGISTER" = true ]; then
  echo ""
  echo -e "${YELLOW}📝 Registering agent on-chain...${NC}"
  pnpm havenclaw-agent register --config agent-config.yaml
  echo -e "${GREEN}✓ Agent registered${NC}"
fi

# Print summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ OpenClaw Agent Setup Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo ""
echo "   1. Edit configuration:"
echo -e "      ${YELLOW}nano agent-config.yaml${NC}"
echo ""
echo "   2. Start your agent:"
echo -e "      ${YELLOW}pnpm havenclaw-agent start --config agent-config.yaml${NC}"
echo ""
echo "   3. View status:"
echo -e "      ${YELLOW}pnpm havenclaw-agent status --config agent-config.yaml${NC}"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "   - Quick Start: QUICKSTART.md"
echo "   - Demo Guide: DEMO_GUIDE.md"
echo "   - Full Docs: COMPLETE_DOCUMENTATION.md"
echo ""
echo -e "${BLUE}🔗 Network:${NC} ${NETWORK}"
echo -e "${BLUE}🤖 Agent:${NC} ${AGENT_NAME:-Not configured}"
echo -e "${BLUE}⚡ Capabilities:${NC} ${CAPABILITIES:-Not configured}"
echo ""
echo -e "${YELLOW}⚠️  Security Reminder: Keep your private key secure!${NC}"
echo ""
