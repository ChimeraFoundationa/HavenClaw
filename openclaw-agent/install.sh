#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════
# HavenClaw Agent - Professional Installation Script
# Autonomous AI Agents on Avalanche
# Repository: github.com/ChimeraFoundationa/HavenClaw
# ═══════════════════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
AGENT_NAME=""
OPERATOR_PRIVATE_KEY=""
CAPABILITIES=""
AI_PROVIDER=""
AI_API_KEY=""
NETWORK="fuji"
AUTO_REGISTER=false
AUTO_SETUP_HPP=false
AUTO_STAKE=false
STAKE_AMOUNT=""
CONFIG_FILE="agent-config.yaml"

# ═══════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════

clear_screen() {
  clear
  echo ""
}

print_banner() {
  echo -e "${BLUE}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                                                              ║"
  echo "║   🤖  ${WHITE}HavenClaw Agent${BLUE}  ║"
  echo "║   ${WHITE}Autonomous AI Agents on Avalanche${BLUE}                    ║"
  echo "║                                                              ║"
  echo "║   ${CYAN}github.com/ChimeraFoundationa/HavenClaw${BLUE}              ║"
  echo "║                                                              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""
}

print_header() {
  echo ""
  echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}│${NC} ${BOLD}$1${NC}"
  echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
  echo ""
}

print_step() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Spinner animation
spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  while [ "$(ps a | awk '{print $1}' | grep -w $pid)" ]; do
    local temp=${spinstr#?}
    printf "${CYAN} [%c]${NC} " "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# Progress bar
progress_bar() {
  local duration=$1
  local message="$2"
  local bar_width=40
  local elapsed=0
  
  printf "${CYAN}┌────────────────────────────────────────────────────────┐${NC}\n"
  printf "${CYAN}│${NC} %-58s${CYAN}│${NC}\n" "$message"
  printf "${CYAN}│${NC} ["
  
  while [ $elapsed -lt $duration ]; do
    local filled=$((elapsed * bar_width / duration))
    local empty=$((bar_width - filled))
    printf "\r${CYAN}│${NC} ["
    printf "${GREEN}"
    printf '%*s' "$filled" | tr ' ' '█'
    printf "${NC}"
    printf '%*s' "$empty" | tr ' ' '░'
    printf "${CYAN}]${NC} %3d%%" "$((elapsed * 100 / duration))"
    sleep 1
    elapsed=$((elapsed + 1))
  done
  
  printf "\r${CYAN}│${NC} ["
  printf "${GREEN}"
  printf '%*s' "$bar_width" | tr ' ' '█'
  printf "${NC}${CYAN}]${NC} 100%%\n"
  printf "${CYAN}└────────────────────────────────────────────────────────┘${NC}\n"
}

# Menu selection
select_menu() {
  local prompt="$1"
  shift
  local options=("$@")
  
  echo -e "${WHITE}${BOLD}$prompt${NC}"
  echo ""
  
  local i=1
  for option in "${options[@]}"; do
    echo -e "  ${CYAN}$i${NC}) $option"
    ((i++))
  done
  
  echo ""
  
  local choice
  while true; do
    read -p "   Enter choice (1-${#options[@]}): " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#options[@]}" ]; then
      echo ""
      echo "${options[$((choice-1))]}"
      return $choice
    else
      echo -e "${RED}   Invalid choice. Please try again.${NC}"
    fi
  done
}

# Secure input
secure_input() {
  local prompt="$1"
  local var_name="$2"
  
  while true; do
    read -sp "   $prompt" input
    echo ""
    if [ -n "$input" ]; then
      eval "$var_name='$input'"
      return 0
    else
      echo -e "${RED}   This field is required. Please try again.${NC}"
    fi
  done
}

# Text input with validation
text_input() {
  local prompt="$1"
  local var_name="$2"
  local required="${3:-true}"
  
  while true; do
    read -p "   $prompt" input
    if [ -n "$input" ] || [ "$required" = "false" ]; then
      eval "$var_name='$input'"
      return 0
    elif [ "$required" = "true" ]; then
      echo -e "${RED}   This field is required. Please try again.${NC}"
    else
      return 0
    fi
  done
}

# ═══════════════════════════════════════════════════════════════════
# Setup Questions
# ═══════════════════════════════════════════════════════════════════

setup_agent_name() {
  print_header "Step 1: Agent Identity"
  text_input "Enter your agent name: " AGENT_NAME
  print_step "Agent name set to: $AGENT_NAME"
}

setup_network() {
  print_header "Step 2: Network Configuration"
  
  echo -e "${YELLOW}   Selected Network: Avalanche Fuji Testnet${NC}"
  echo ""
  echo -e "${CYAN}   Network Details:${NC}"
  echo "   - Chain ID: 43113"
  echo "   - RPC URL: https://api.avax-test.network/ext/bc/C/rpc"
  echo "   - Explorer: https://testnet.snowscan.xyz"
  echo ""
  echo -e "${WHITE}   Get free test AVAX from:${NC}"
  echo -e "   ${BLUE}https://faucet.avax.network/${NC}"
  echo ""
  
  NETWORK="fuji"
  print_step "Network configured: Fuji Testnet"
}

setup_private_key() {
  print_header "Step 3: Operator Private Key"
  echo -e "${YELLOW}   Enter the private key for your agent's wallet${NC}"
  echo -e "${YELLOW}   This key will be stored securely in agent-config.yaml${NC}"
  echo ""
  echo -e "${CYAN}   Options:${NC}"
  echo -e "   ${CYAN}1${NC}) Enter private key now"
  echo -e "   ${CYAN}2${NC}) Configure manually later"
  echo ""
  
  local choice
  read -p "   Select option (1-2): " choice
  
  case $choice in
    1)
      secure_input "   Enter private key (0x...): " OPERATOR_PRIVATE_KEY
      print_step "Private key configured"
      ;;
    2)
      print_warning "You'll need to add the private key to agent-config.yaml later"
      ;;
    *)
      print_warning "Skipping private key configuration"
      ;;
  esac
}

setup_capabilities() {
  print_header "Step 4: Agent Capabilities"
  echo -e "${YELLOW}   Select what your agent will do:${NC}"
  echo ""
  
  local capabilities_list=(
    "Governance Voting (participate in HAVEN governance)"
    "Task Marketplace (accept and complete tasks)"
    "Trading (automated trading strategies)"
    "Analysis (market/data analysis)"
    "Prediction (forecasting and predictions)"
    "Custom (specify your own)"
  )
  
  echo -e "${CYAN}   Select multiple capabilities (comma-separated, e.g., 1,2,4):${NC}"
  for i in "${!capabilities_list[@]}"; do
    echo -e "   ${CYAN}$((i+1))${NC}) ${capabilities_list[$i]}"
  done
  echo ""
  
  local selection
  read -p "   Your selection: " selection
  
  local caps=""
  IFS=',' read -ra selections <<< "$selection"
  for sel in "${selections[@]}"; do
    case $sel in
      1) caps="${caps}governance," ;;
      2) caps="${caps}task_completion," ;;
      3) caps="${caps}trading," ;;
      4) caps="${caps}analysis," ;;
      5) caps="${caps}prediction," ;;
      6) 
        read -p "   Enter custom capabilities (comma-separated): " custom_caps
        caps="${caps}${custom_caps},"
        ;;
    esac
  done
  
  CAPABILITIES="${caps%,}"
  print_step "Capabilities: $CAPABILITIES"
}

setup_ai_provider() {
  print_header "Step 5: AI Provider Configuration"
  echo -e "${YELLOW}   Select your preferred AI provider for agent reasoning:${NC}"
  echo ""
  
  local providers=(
    "OpenAI (GPT-4, GPT-4o, GPT-4o-mini)"
    "Anthropic (Claude 3.5, Claude 3)"
    "Google (Gemini Pro, Gemini Ultra)"
    "Local Model (Ollama, LM Studio)"
    "Skip AI (rule-based decisions only)"
  )
  
  echo -e "${CYAN}   Select AI provider:${NC}"
  for i in "${!providers[@]}"; do
    echo -e "   ${CYAN}$((i+1))${NC}) ${providers[$i]}"
  done
  echo ""
  
  local choice
  while true; do
    read -p "   Enter choice (1-${#providers[@]}): " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#providers[@]}" ]; then
      break
    else
      echo -e "${RED}   Invalid choice. Please try again.${NC}"
    fi
  done
  
  case $choice in
    1)
      AI_PROVIDER="openai"
      echo ""
      echo -e "${CYAN}   OpenAI selected${NC}"
      echo "   Get your API key from: https://platform.openai.com/api-keys"
      echo ""
      secure_input "   Enter OpenAI API Key: " AI_API_KEY
      print_step "AI Provider: OpenAI"
      ;;
    2)
      AI_PROVIDER="anthropic"
      echo ""
      echo -e "${CYAN}   Anthropic selected${NC}"
      echo "   Get your API key from: https://console.anthropic.com/settings/keys"
      echo ""
      secure_input "   Enter Anthropic API Key: " AI_API_KEY
      print_step "AI Provider: Anthropic"
      ;;
    3)
      AI_PROVIDER="google"
      echo ""
      echo -e "${CYAN}   Google selected${NC}"
      echo "   Get your API key from: https://makersuite.google.com/app/apikey"
      echo ""
      secure_input "   Enter Google API Key: " AI_API_KEY
      print_step "AI Provider: Google"
      ;;
    4)
      AI_PROVIDER="local"
      echo ""
      echo -e "${CYAN}   Local model selected${NC}"
      echo "   Make sure you have Ollama or LM Studio running"
      text_input "   Enter local model endpoint URL (default: http://localhost:11434): " AI_API_KEY "false"
      AI_API_KEY="${AI_API_KEY:-http://localhost:11434}"
      print_step "AI Provider: Local Model"
      ;;
    5)
      AI_PROVIDER="none"
      print_warning "AI features disabled - using rule-based decisions only"
      ;;
  esac
}

setup_auto_register() {
  print_header "Step 6: On-Chain Registration"
  echo -e "${YELLOW}   Would you like to register your agent on-chain now?${NC}"
  echo ""
  echo -e "${CYAN}   This will:${NC}"
  echo "   - Create ERC-8004 NFT Identity"
  echo "   - Register on HavenClaw Registry"
  echo "   - Initialize reputation profile"
  echo ""
  echo -e "${CYAN}   Options:${NC}"
  echo -e "   ${CYAN}1${NC}) Yes, register agent on-chain"
  echo -e "   ${CYAN}2${NC}) No, I'll register later"
  echo ""
  
  local choice
  read -p "   Select option (1-2): " choice
  
  case $choice in
    1)
      AUTO_REGISTER=true
      print_step "Agent will be registered on-chain after setup"
      setup_hpp
      setup_stake
      ;;
    2)
      AUTO_REGISTER=false
      print_warning "You can register later with: pnpm havenclaw-agent register"
      ;;
  esac
}

setup_hpp() {
  print_header "Step 7: HPP Payment Protocol"
  echo -e "${YELLOW}   Would you like to enable HPP (HavenClaw Payment Protocol)?${NC}"
  echo ""
  echo -e "${CYAN}   HPP enables:${NC}"
  echo "   - Conditional payments for tasks"
  echo "   - Automated reward distribution"
  echo "   - 1% platform fee on completed tasks"
  echo ""
  echo -e "${CYAN}   Options:${NC}"
  echo -e "   ${CYAN}1${NC}) Yes, enable HPP"
  echo -e "   ${CYAN}2${NC}) No, skip HPP setup"
  echo ""
  
  local choice
  read -p "   Select option (1-2): " choice
  
  case $choice in
    1)
      AUTO_SETUP_HPP=true
      print_step "HPP will be enabled for your agent"
      ;;
    2)
      AUTO_SETUP_HPP=false
      print_warning "HPP disabled - you can enable later in config"
      ;;
  esac
}

setup_stake() {
  print_header "Step 8: Token Staking"
  echo -e "${YELLOW}   Would you like to stake HAVEN tokens for voting power?${NC}"
  echo ""
  echo -e "${CYAN}   Staking benefits:${NC}"
  echo "   - Increased voting power in governance"
  echo "   - Higher reputation score"
  echo "   - Access to premium features"
  echo ""
  echo -e "${CYAN}   Options:${NC}"
  echo -e "   ${CYAN}1${NC}) Yes, stake tokens"
  echo -e "   ${CYAN}2${NC}) No, skip staking"
  echo ""
  
  local choice
  read -p "   Select option (1-2): " choice
  
  case $choice in
    1)
      AUTO_STAKE=true
      echo ""
      echo -e "${CYAN}   Enter stake amount (in HAVEN):${NC}"
      echo "   - Minimum: 100 HAVEN"
      echo "   - Recommended: 1,000-10,000 HAVEN"
      echo ""
      while true; do
        read -p "   Stake amount: " STAKE_AMOUNT
        if [[ "$STAKE_AMOUNT" =~ ^[0-9]+$ ]] && [ "$STAKE_AMOUNT" -ge 100 ]; then
          print_step "Will stake $STAKE_AMOUNT HAVEN tokens"
          break
        else
          echo -e "${RED}   Please enter at least 100 HAVEN${NC}"
        fi
      done
      ;;
    2)
      AUTO_STAKE=false
      print_warning "Staking skipped - you can stake later"
      ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════
# Installation Functions
# ═══════════════════════════════════════════════════════════════════

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 22+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
  fi
  
  local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$node_version" -lt 22 ]; then
    print_error "Node.js 22+ required. You have v$node_version"
    exit 1
  fi
  print_step "Node.js v$(node -v)"
  
  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}   pnpm not found. Installing...${NC}"
    npm install -g pnpm > /dev/null 2>&1
  fi
  print_step "pnpm v$(pnpm -v)"
  
  # Check Foundry
  if command -v forge &> /dev/null; then
    print_step "Foundry installed"
  else
    print_warning "Foundry not installed (optional)"
    echo "   Install: curl -L https://foundry.paradigm.xyz | bash"
  fi
  
  echo ""
}

clone_repository() {
  print_header "Cloning Repository"
  
  if [ -d "HavenClaw" ]; then
    print_warning "HavenClaw directory already exists"
    cd HavenClaw
  else
    echo -e "${CYAN}   Cloning from GitHub...${NC}"
    git clone --quiet https://github.com/ChimeraFoundationa/HavenClaw.git HavenClaw
    cd HavenClaw
  fi
  print_step "Repository ready"
  echo ""
}

install_dependencies() {
  print_header "Installing Dependencies"
  
  pnpm install --silent > /dev/null 2>&1 &
  spinner $!
  
  print_step "Dependencies installed"
  echo ""
}

build_packages() {
  print_header "Building Packages"
  echo -e "${CYAN}   Compiling 14 TypeScript packages...${NC}"
  echo -e "${YELLOW}   This may take 2-3 minutes on first build${NC}"
  echo ""
  
  {
    pnpm build > /tmp/build.log 2>&1
    echo "DONE" > /tmp/build_status
  } &
  local build_pid=$!
  
  progress_bar 90 "Building packages"
  wait $build_pid
  
  if [ -f "/tmp/build_status" ] && [ "$(cat /tmp/build_status)" = "DONE" ]; then
    print_step "Build complete"
    rm -f /tmp/build_status /tmp/build.log
  else
    print_error "Build failed"
    echo -e "${YELLOW}   Build log:${NC}"
    tail -20 /tmp/build.log
    exit 1
  fi
  echo ""
}

create_configuration() {
  print_header "Creating Configuration"
  
  # Fuji Testnet contract addresses
  local erc8004_registry="0x8004A818BFB912233c491871b3d84c89A494BD9e"
  local agent_registry="0xe97f0c1378A75a4761f20220d64c31787FC9e321"
  local task_marketplace="0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a"
  local haven_governance="0xCa2494A2725DeCf613628a2a70600c6495dB9369"
  local agent_reputation="0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19"
  local rpc_url="https://api.avax-test.network/ext/bc/C/rpc"
  local chain_id="43113"
  local explorer_url="https://testnet.snowscan.xyz"
  
  # Create config file
  cat > "$CONFIG_FILE" << EOF
# ═══════════════════════════════════════════════════════════════════
# HavenClaw Agent Configuration
# Network: Avalanche Fuji Testnet
# Generated by install.sh
# ═══════════════════════════════════════════════════════════════════

agentId: havenclaw-${AGENT_NAME,,// /-}
agentName: "$AGENT_NAME"

# Operator Configuration
operatorPrivateKey: "${OPERATOR_PRIVATE_KEY:-"0xYOUR_PRIVATE_KEY_HERE"}"

# Network Configuration (Fuji Testnet)
network:
  chainId: $chain_id
  rpcUrl: "$rpc_url"
  explorerUrl: "$explorer_url"

# Contract Addresses
contracts:
  erc8004Registry: "$erc8004_registry"
  agentRegistry: "$agent_registry"
  taskMarketplace: "$task_marketplace"
  havenGovernance: "$haven_governance"
  agentReputation: "$agent_reputation"

# Decision Engine Configuration
decision:
  autoVote: $(if [[ "$CAPABILITIES" == *"governance"* ]]; then echo "false  # Enable after review"; else echo "false"; fi)
  autoAcceptTasks: $(if [[ "$CAPABILITIES" == *"task_completion"* ]]; then echo "false  # Enable after review"; else echo "false"; fi)
  minTaskReward: "100000000000000000"  # 0.1 AVAX
  votingRules:
    minQuorum: "0"
    maxAgainstRatio: 0.5
    trustedProposers: []

# Reasoning Engine Configuration
reasoning:
  observationInterval: 5000
  minConfidenceForAction: 0.6
  enableGovernanceAnalysis: $(if [[ "$CAPABILITIES" == *"governance"* ]]; then echo "true"; else echo "false"; fi)
  enableTaskAnalysis: $(if [[ "$CAPABILITIES" == *"task_completion"* ]]; then echo "true"; else echo "false"; fi)
  enableLearning: true

# AI/LLM Configuration
llm:
  provider: "${AI_PROVIDER:-none}"
  apiKey: "${AI_API_KEY:-"your-api-key-here"}"
  $(if [ "$AI_PROVIDER" = "local" ]; then echo "endpoint: \"$AI_API_KEY\""; fi)
  $(if [ "$AI_PROVIDER" = "openai" ]; then echo "model: \"gpt-4o-mini\""; fi)
  $(if [ "$AI_PROVIDER" = "anthropic" ]; then echo "model: \"claude-3-5-sonnet-20241022\""; fi)
  $(if [ "$AI_PROVIDER" = "google" ]; then echo "model: \"gemini-pro\""; fi)

# Memory Configuration
memory:
  workingMemoryCapacity: 7
  longTermMemoryLimit: 1000
  forgettingCurve: exponential
  decayRate: 0.1

# Learning Configuration
learning:
  maxExperiences: 1000
  minConfidenceForLesson: 0.7
  autoUpdateModel: true

# Governance Configuration
governance:
  protocolImpactWeight: 0.3
  communityImpactWeight: 0.2
  technicalImpactWeight: 0.25
  economicImpactWeight: 0.25

# Logging Configuration
logging:
  level: "info"
  format: "text"

# Agent Identity (auto-populated after registration)
# identity:
#   erc8004TokenId: ""
#   agentAddress: ""
#   metadataUri: ""
#   capabilities: [${CAPABILITIES}]
EOF

  print_step "Configuration file created: $CONFIG_FILE"
  echo ""
}

register_agent() {
  if [ "$AUTO_REGISTER" = true ] && [ -n "$OPERATOR_PRIVATE_KEY" ]; then
    print_header "On-Chain Registration"
    
    # Step 1: Check balance
    echo -e "${CYAN}   Checking wallet balance...${NC}"
    local wallet_addr=$(grep operatorPrivateKey "$CONFIG_FILE" | cut -d'"' -f2 | sed 's/0x//')
    local balance=$(cast balance --ether "0x$wallet_addr" --rpc-url https://api.avax-test.network/ext/bc/C/rpc 2>/dev/null || echo "0")
    
    if (( $(echo "$balance < 0.1" | bc -l 2>/dev/null || echo 1) )); then
      print_warning "Low balance detected"
      echo ""
      echo "   Your wallet needs at least 0.1 AVAX for gas fees."
      echo "   Current balance: ${balance} AVAX"
      echo ""
      echo -e "   ${YELLOW}Get test AVAX from: https://faucet.avax.network/${NC}"
      echo ""
      read -p "   Continue anyway? (y/n): " continue_reg
      if [ "$continue_reg" != "y" ]; then
        print_warning "Registration cancelled"
        return 1
      fi
    else
      print_step "Wallet balance: ${balance} AVAX"
    fi
    
    # Step 2: Create ERC-8004 Identity
    echo ""
    echo -e "${CYAN}   Step 1/4: Creating ERC-8004 NFT Identity...${NC}"
    if pnpm havenclaw-agent create-identity \
      --config "$CONFIG_FILE" \
      --name "$AGENT_NAME" \
      --capabilities "$CAPABILITIES" 2>/dev/null; then
      print_step "ERC-8004 NFT Identity created"
    else
      print_error "Failed to create identity"
      return 1
    fi
    
    # Step 3: Register on HavenClaw Registry
    echo ""
    echo -e "${CYAN}   Step 2/4: Registering on HavenClaw Registry...${NC}"
    if pnpm havenclaw-agent register --config "$CONFIG_FILE" 2>/dev/null; then
      print_step "Agent registered on HavenClaw Registry"
    else
      print_warning "Registry registration skipped"
    fi
    
    # Step 4: Setup HPP (if enabled)
    if [ "$AUTO_SETUP_HPP" = true ]; then
      echo ""
      echo -e "${CYAN}   Step 3/4: Enabling HPP Payment Protocol...${NC}"
      echo -e "${YELLOW}   Registering agent with HPP contract...${NC}"
      
      # Register agent with HPP
      if pnpm havenclaw-agent hpp-register --config "$CONFIG_FILE" 2>/dev/null; then
        print_step "HPP Agent registered"
      else
        print_warning "HPP registration skipped (can be done manually)"
      fi
      
      # Add HPP configuration to config file
      if grep -q "paymentProtocol:" "$CONFIG_FILE"; then
        print_step "HPP Payment Protocol enabled"
      else
        echo "" >> "$CONFIG_FILE"
        echo "# HPP Configuration" >> "$CONFIG_FILE"
        echo "hpp:" >> "$CONFIG_FILE"
        echo "  enabled: true" >> "$CONFIG_FILE"
        echo "  platformFeePercent: 1" >> "$CONFIG_FILE"
        echo "  contractAddress: 0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816" >> "$CONFIG_FILE"
        print_step "HPP Payment Protocol configured"
      fi
      
      echo ""
      echo -e "${CYAN}   💡 HPP Wallet Information:${NC}"
      echo "   - HPP uses your agent's operator wallet (no separate wallet)"
      echo "   - Payments are held in escrow by the HPP smart contract"
      echo "   - When released, funds go directly to your wallet"
      echo "   - Platform fee: 1% on successful payments"
      echo ""
      echo -e "   ${WHITE}To receive payments:${NC}"
      echo "   1. Share your agent's wallet address with payers"
      echo "   2. Payers create conditional payments via HPP"
      echo "   3. Complete the task and submit proof"
      echo "   4. Claim payment (funds sent to your wallet)"
      echo ""
    fi
    
    # Step 5: Stake tokens (if enabled)
    if [ "$AUTO_STAKE" = true ] && [ -n "$STAKE_AMOUNT" ]; then
      echo ""
      echo -e "${CYAN}   Step 4/4: Staking $STAKE_AMOUNT HAVEN tokens...${NC}"
      echo -e "${YELLOW}   Note: Manual approval required for token staking${NC}"
      
      # Note: This would need actual HAVEN token contract interaction
      # For now, provide instructions
      print_warning "Manual staking required"
      echo ""
      echo "   To stake tokens, run:"
      echo -e "   ${BLUE}pnpm havenclaw-agent stake --amount $STAKE_AMOUNT --config $CONFIG_FILE${NC}"
      echo ""
    fi
    
    print_step "On-chain registration complete!"
    echo ""
  fi
}

print_summary() {
  clear_screen
  print_banner
  
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║        ${BOLD}✅ Installation Complete!${NC}${GREEN}                              ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  echo -e "${WHITE}${BOLD}📋 Configuration Summary:${NC}"
  echo ""
  echo -e "  ${CYAN}Agent Name:${NC}         $AGENT_NAME"
  echo -e "  ${CYAN}Network:${NC}             Avalanche Fuji Testnet"
  echo -e "  ${CYAN}Capabilities:${NC}        $CAPABILITIES"
  echo -e "  ${CYAN}AI Provider:${NC}         ${AI_PROVIDER:-None}"
  echo -e "  ${CYAN}On-Chain Registered:${NC} $AUTO_REGISTER"
  echo -e "  ${CYAN}HPP Enabled:${NC}         $AUTO_SETUP_HPP"
  echo -e "  ${CYAN}Staking:${NC}             $([ "$AUTO_STAKE" = true ] && echo "$STAKE_AMOUNT HAVEN" || echo "Not configured")"
  echo ""
  
  echo -e "${WHITE}${BOLD}📚 Next Steps:${NC}"
  echo ""
  
  if [ -z "$OPERATOR_PRIVATE_KEY" ]; then
    echo -e "  ${YELLOW}1.${NC} Edit configuration and add your private key:"
    echo -e "     ${BLUE}nano $CONFIG_FILE${NC}"
    echo ""
  fi
  
  if [ "$AI_PROVIDER" != "none" ] && [ -n "$AI_API_KEY" ]; then
    echo -e "  ${GREEN}2.${NC} AI provider configured"
    echo ""
  elif [ "$AI_PROVIDER" != "none" ]; then
    echo -e "  ${YELLOW}2.${NC} Add your AI API key to configuration:"
    echo -e "     ${BLUE}nano $CONFIG_FILE${NC}"
    echo ""
  fi
  
  echo -e "  ${CYAN}3.${NC} Start your agent:"
  echo -e "     ${BLUE}pnpm havenclaw-agent start --config $CONFIG_FILE${NC}"
  echo ""
  
  echo -e "  ${CYAN}4.${NC} View agent status:"
  echo -e "     ${BLUE}pnpm havenclaw-agent status --config $CONFIG_FILE${NC}"
  echo ""
  
  echo -e "${WHITE}${BOLD}📖 Documentation:${NC}"
  echo ""
  echo "  - Quick Start:     ${BLUE}QUICKSTART.md${NC}"
  echo "  - Demo Guide:      ${BLUE}DEMO_GUIDE.md${NC}"
  echo "  - Full Docs:       ${BLUE}COMPLETE_DOCUMENTATION.md${NC}"
  echo "  - HPP Guide:       ${BLUE}HPP_INTEGRATION_COMPLETE.md${NC}"
  echo ""
  
  echo -e "${WHITE}${BOLD}💰 HPP Payment Protocol:${NC}"
  echo ""
  echo "  - HPP uses your agent's operator wallet (no separate wallet)"
  echo "  - Share your wallet address to receive payments"
  echo "  - Payments held in escrow until conditions met"
  echo "  - Platform fee: 1% on successful payments"
  echo ""
  echo -e "  ${CYAN}Your agent wallet:${NC} $(grep operatorPrivateKey "$CONFIG_FILE" | cut -d'"' -f2)"
  echo ""
  
  echo "  - GitHub:          ${BLUE}https://github.com/ChimeraFoundationa/HavenClaw${NC}"
  echo "  - Report Issues:   ${BLUE}https://github.com/ChimeraFoundationa/HavenClaw/issues${NC}"
  echo "  - Fuji Explorer:   ${BLUE}https://testnet.snowscan.xyz${NC}"
  echo "  - Get Test AVAX:   ${BLUE}https://faucet.avax.network/${NC}"
  echo ""
  
  echo -e "${YELLOW}⚠️  You're on Fuji Testnet. Get free test AVAX from the faucet.${NC}"
  echo ""
  
  echo -e "${YELLOW}🔐 Security Reminder: Never share your private key or API keys!${NC}"
  echo ""
}

show_help() {
  echo ""
  echo "HavenClaw Agent - Interactive Installation"
  echo "Network: Avalanche Fuji Testnet"
  echo ""
  echo "Usage: curl -fsSL https://raw.githubusercontent.com/ChimeraFoundationa/HavenClaw/main/install.sh | bash"
  echo ""
  echo "Or download and run with options:"
  echo ""
  echo "  curl -O https://raw.githubusercontent.com/ChimeraFoundationa/HavenClaw/main/install.sh"
  echo "  chmod +x install.sh"
  echo "  ./install.sh [options]"
  echo ""
  echo "Options:"
  echo "  --name VALUE           Agent name (e.g., 'Trading Bot')"
  echo "  --capabilities VALUE   Comma-separated capabilities (governance,trading,analysis)"
  echo "  --ai-provider VALUE    AI provider: openai, anthropic, google, local, none"
  echo "  --api-key VALUE        AI provider API key"
  echo "  --private-key VALUE    Operator private key (0x...)"
  echo "  --register             Auto-register agent on-chain (includes ERC-8004 NFT)"
  echo "  --hpp                  Enable HPP Payment Protocol"
  echo "  --stake VALUE          Stake HAVEN tokens (e.g., --stake 1000)"
  echo "  --help                 Show this help message"
  echo ""
  echo "Examples:"
  echo ""
  echo "  # Interactive setup (recommended)"
  echo "  ./install.sh"
  echo ""
  echo "  # Non-interactive with all options"
  echo "  ./install.sh --name 'My Bot' --capabilities governance,trading --ai-provider openai --register --hpp --stake 1000"
  echo ""
  echo "  # Quick setup with registration only"
  echo "  ./install.sh --name 'Bot' --capabilities trading --private-key 0x... --register"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════
# Main Installation Flow
# ═══════════════════════════════════════════════════════════════════

main() {
  # Parse command line arguments for non-interactive mode
  local interactive=true
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --name)
        AGENT_NAME="$2"
        interactive=false
        shift 2
        ;;
      --capabilities)
        CAPABILITIES="$2"
        interactive=false
        shift 2
        ;;
      --ai-provider)
        AI_PROVIDER="$2"
        interactive=false
        shift 2
        ;;
      --api-key)
        AI_API_KEY="$2"
        interactive=false
        shift 2
        ;;
      --private-key)
        OPERATOR_PRIVATE_KEY="$2"
        interactive=false
        shift 2
        ;;
      --register)
        AUTO_REGISTER=true
        interactive=false
        shift
        ;;
      --hpp)
        AUTO_SETUP_HPP=true
        interactive=false
        shift
        ;;
      --stake)
        AUTO_STAKE=true
        STAKE_AMOUNT="$2"
        interactive=false
        shift 2
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
  done
  
  clear_screen
  print_banner
  
  if [ "$interactive" = true ]; then
    # Interactive mode - ask questions
    setup_agent_name
    echo ""
    setup_network
    echo ""
    setup_private_key
    echo ""
    setup_capabilities
    echo ""
    setup_ai_provider
    echo ""
    setup_auto_register
    echo ""
    
    echo -e "${CYAN}Press Enter to continue with installation...${NC}"
    read
  else
    # Non-interactive mode - use provided values
    print_step "Running in non-interactive mode"
    echo ""
  fi
  
  # Run installation
  check_prerequisites
  clone_repository
  install_dependencies
  build_packages
  create_configuration
  register_agent
  print_summary
}

# Run main function
main "$@"
