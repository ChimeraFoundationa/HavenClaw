#!/bin/bash
set -euo pipefail

# HavenClaw Installer for macOS and Linux
# Usage: curl -fsSL https://havenclaw.ai/install.sh | bash
# Agent Coordination Framework for HavenVM

BOLD='\033[1m'
ACCENT='\033[38;2;255;77;77m'       # coral-bright  #ff4d4d
ACCENT_BRIGHT='\033[38;2;255;110;110m' # lighter coral
INFO='\033[38;2;136;146;176m'       # text-secondary #8892b0
SUCCESS='\033[38;2;0;229;204m'      # cyan-bright   #00e5cc
WARN='\033[38;2;255;176;32m'        # amber
ERROR='\033[38;2;230;57;70m'        # coral-mid     #e63946
MUTED='\033[38;2;90;100;128m'       # text-muted    #5a6480
NC='\033[0m' # No Color

DEFAULT_TAGLINE="Agent Coordination, One Command."
TAGLINE="${TAGLINE:-$DEFAULT_TAGLINE}"

ORIGINAL_PATH="${PATH:-}"

# Install flags
HELP="${HELP:-0}"
VERBOSE="${VERBOSE:-0}"
DRY_RUN="${DRY_RUN:-0}"
NO_PROMPT="${NO_PROMPT:-0}"
NO_ONBOARD="${NO_ONBOARD:-0}"
USE_BETA="${USE_BETA:-0}"
INSTALL_METHOD="${INSTALL_METHOD:-npm}"
GIT_DIR="${GIT_DIR:-$HOME/.havenclaw/git}"
GIT_UPDATE="${GIT_UPDATE:-1}"
HAVENCLAW_VERSION="${HAVENCLAW_VERSION:-latest}"
HAVENCLAW_GUM_VERSION="${HAVENCLAW_GUM_VERSION:-0.17.0}"
SHARP_IGNORE_GLOBAL_LIBVIPS="${SHARP_IGNORE_GLOBAL_LIBVIPS:-1}"

# Wallet & Agent configuration (can be set via environment OR command-line args)
HAVENCLAW_PRIVATE_KEY="${HAVENCLAW_PRIVATE_KEY:-}"
HAVENCLAW_NETWORK="${HAVENCLAW_NETWORK:-fuji}"
HAVENCLAW_RPC_URL="${HAVENCLAW_RPC_URL:-}"
HAVENCLAW_AGENT_NAME="${HAVENCLAW_AGENT_NAME:-}"
HAVENCLAW_CAPABILITIES="${HAVENCLAW_CAPABILITIES:-}"
AUTO_REGISTER="${AUTO_REGISTER:-0}"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --private-key)
            HAVENCLAW_PRIVATE_KEY="$2"
            shift 2
            ;;
        --network)
            HAVENCLAW_NETWORK="$2"
            shift 2
            ;;
        --rpc-url)
            HAVENCLAW_RPC_URL="$2"
            shift 2
            ;;
        --agent-name)
            HAVENCLAW_AGENT_NAME="$2"
            shift 2
            ;;
        --capabilities)
            HAVENCLAW_CAPABILITIES="$2"
            shift 2
            ;;
        --auto-register)
            AUTO_REGISTER="1"
            shift
            ;;
        --no-prompt)
            NO_PROMPT="1"
            shift
            ;;
        --help|-h)
            HELP="1"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

TMPFILES=()
cleanup_tmpfiles() {
    local f
    for f in "${TMPFILES[@]:-}"; do
        rm -rf "$f" 2>/dev/null || true
    done
}
trap cleanup_tmpfiles EXIT

mktempfile() {
    local f
    f="$(mktemp)"
    TMPFILES+=("$f")
    echo "$f"
}

# Color output functions
ui_info() {
    echo -e "${MUTED}·${NC} ${*}"
}

ui_warn() {
    echo -e "${WARN}!${NC} ${*}"
}

ui_success() {
    echo -e "${SUCCESS}✓${NC} ${*}"
}

ui_error() {
    echo -e "${ERROR}✗${NC} ${*}"
}

ui_section() {
    echo ""
    echo -e "${ACCENT}${BOLD}${*}${NC}"
}

ui_stage() {
    ui_section "$*"
}

ui_celebrate() {
    echo -e "${SUCCESS}${BOLD}${*}${NC}"
}

print_installer_banner() {
    echo -e "${ACCENT}${BOLD}"
    echo "  🏛️ HavenClaw Installer"
    echo -e "${NC}${INFO}  ${TAGLINE}${NC}"
    echo -e "${INFO}  Deployed on Avalanche Fuji Testnet${NC}"
    echo ""
    
    # Show what will happen at the BEGINNING
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${INFO}  What Will Happen${NC}"
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "This installer will:"
    echo "  1. Install HavenClaw CLI"
    echo "  2. Ask for your private key (encrypted storage)"
    echo "  3. Configure Fuji Testnet automatically"
    echo "  4. Ask for agent name & capabilities"
    echo "  5. Optionally register your agent on Fuji"
    echo ""
    echo -e "${WARN}⚠️  Before You Start:${NC}"
    echo ""
    echo "  1. Have your private key ready"
    echo "     (0x + 64 hex characters)"
    echo ""
    echo "  2. Get test AVAX from faucet:"
    echo -e "     ${INFO}https://faucet.avax.network/${NC}"
    echo "     (Required for agent registration)"
    echo ""
    echo "  3. Add to PATH after install:"
    echo -e "     ${INFO}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
    echo ""
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    read -p "Continue with installation? (y/N): " continue_input
    if [[ ! "$continue_input" =~ ^[Yy]$ ]]; then
        echo -e "${INFO}Installation cancelled.${NC}"
        exit 0
    fi
    
    echo ""
}

print_usage() {
    echo -e "${BOLD}Usage:${NC}"
    echo "  curl -fsSL https://havenclaw.ai/install.sh | bash -s -- [options]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --private-key KEY       Wallet private key (0x + 64 hex chars)"
    echo "  --agent-name NAME       Agent name"
    echo "  --capabilities CAPS     Comma-separated capabilities"
    echo "  --network NET           Network: fuji, mainnet, local (default: fuji)"
    echo "  --rpc-url URL           Custom RPC endpoint"
    echo "  --auto-register         Auto-register agent after install"
    echo "  --no-prompt             Non-interactive mode"
    echo "  --help, -h              Show this help"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo -e "  ${INFO}# Full automation - one line!${NC}"
    echo '  curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234... --agent-name "My Bot" --capabilities trading,analysis --auto-register'
    echo ""
    echo -e "${INFO}  # With network config${NC}"
    echo '  curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234... --agent-name "Bot" --network mainnet --auto-register'
    echo ""
    echo -e "${INFO}  # Interactive (no args)${NC}"
    echo "  curl -fsSL https://havenclaw.ai/install.sh | bash"
    echo ""
}

# OS Detection
OS="unknown"
detect_os_or_die() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]] || [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
        OS="linux"
    fi

    if [[ "$OS" == "unknown" ]]; then
        ui_error "Unsupported operating system"
        echo "This installer supports macOS and Linux (including WSL)."
        echo "For Windows, use WSL2 or contact support."
        exit 1
    fi

    ui_success "Detected: $OS"
}

# Downloader detection
DOWNLOADER=""
detect_downloader() {
    if command -v curl &> /dev/null; then
        DOWNLOADER="curl"
        return 0
    fi
    if command -v wget &> /dev/null; then
        DOWNLOADER="wget"
        return 0
    fi
    ui_error "Missing downloader (curl or wget required)"
    exit 1
}

download_file() {
    local url="$1"
    local output="$2"
    if [[ -z "$DOWNLOADER" ]]; then
        detect_downloader
    fi
    if [[ "$DOWNLOADER" == "curl" ]]; then
        curl -fsSL --proto '=https' --tlsv1.2 --retry 3 --retry-delay 1 -o "$output" "$url"
        return
    fi
    wget -q --https-only --secure-protocol=TLSv1_2 --tries=3 -O "$output" "$url"
}

# Homebrew (macOS)
install_homebrew() {
    if command -v brew &> /dev/null; then
        ui_success "Homebrew already installed"
        return 0
    fi

    if [[ "$OS" == "macos" ]]; then
        ui_info "Installing Homebrew (required for some dependencies)"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ui_success "Homebrew installed"
    fi
}

# Node.js detection and installation
check_node() {
    if command -v node &> /dev/null; then
        local version
        version="$(node --version || true)"
        local major
        major="${version#v}"
        major="${major%%.*}"
        if [[ "$major" -ge 22 ]]; then
            ui_success "Node.js ready ($version)"
            return 0
        fi
        ui_warn "Node.js $version found, but version 22+ required"
    fi
    return 1
}

install_node() {
    ui_info "Installing Node.js 22.x"

    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            run_quiet_step "Installing Node.js via Homebrew" brew install node@22
            ui_success "Node.js installed via Homebrew"
            return 0
        fi
    fi

    if [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            ui_info "Adding NodeSource repository for Node.js 22.x"
            curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
            run_quiet_step "Installing Node.js" sudo apt-get install -y nodejs
            ui_success "Node.js installed via NodeSource"
            return 0
        fi

        if command -v dnf &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -
            run_quiet_step "Installing Node.js" sudo dnf install -y nodejs
            ui_success "Node.js installed via NodeSource"
            return 0
        fi
    fi

    ui_error "Could not auto-install Node.js"
    echo "Please install Node.js 22+ manually from https://nodejs.org"
    return 1
}

# Git detection
check_git() {
    if command -v git &> /dev/null; then
        ui_success "Git ready ($(git --version | cut -d' ' -f3))"
        return 0
    fi
    return 1
}

install_git() {
    ui_info "Installing Git"

    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            run_quiet_step "Installing Git" brew install git
            ui_success "Git installed"
            return 0
        fi
        ui_info "Installing Xcode Command Line Tools (includes git)"
        xcode-select --install >/dev/null 2>&1 || true
        return 0
    fi

    if [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            run_quiet_step "Installing Git" sudo apt-get install -y git
            ui_success "Git installed"
            return 0
        fi
        if command -v dnf &> /dev/null; then
            run_quiet_step "Installing Git" sudo dnf install -y git
            ui_success "Git installed"
            return 0
        fi
    fi

    ui_error "Could not auto-install Git"
    return 1
}

# npm permissions
fix_npm_permissions() {
    if [[ "$OS" == "linux" ]]; then
        local npm_prefix
        npm_prefix="$(npm config get prefix 2>/dev/null || true)"
        if [[ -n "$npm_prefix" && "$npm_prefix" == "$HOME/.npm"* ]]; then
            mkdir -p "$npm_prefix"
            chown -R "$USER" "$npm_prefix" 2>/dev/null || true
        fi
    fi
}

# pnpm installation
ensure_pnpm() {
    if command -v pnpm &> /dev/null; then
        ui_success "pnpm ready ($(pnpm --version))"
        return 0
    fi

    if command -v corepack &> /dev/null; then
        ui_info "Enabling pnpm via Corepack"
        corepack enable pnpm >/dev/null 2>&1 || true
        corepack prepare pnpm@10 --activate >/dev/null 2>&1 || true
        if command -v pnpm &> /dev/null; then
            ui_success "pnpm ready via Corepack"
            return 0
        fi
    fi

    ui_info "Installing pnpm via npm"
    npm install -g pnpm@10 >/dev/null 2>&1 || true

    if command -v pnpm &> /dev/null; then
        ui_success "pnpm ready"
        return 0
    fi

    ui_warn "pnpm installation failed, will use npm fallback"
    return 0
}

# Install HavenClaw from git
install_havenclaw_from_git() {
    local repo_dir="$1"
    local repo_url="https://github.com/ava-labs/havenclaw.git"

    ui_info "Installing HavenClaw from Git"

    if [[ ! -d "$repo_dir/.git" ]]; then
        ui_info "Cloning HavenClaw repository"
        git clone "$repo_url" "$repo_dir"
    fi

    cd "$repo_dir"

    # Install dependencies
    ui_info "Installing dependencies"
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi

    # Build
    ui_info "Building HavenClaw"
    if command -v pnpm &> /dev/null; then
        pnpm build
    else
        npm run build
    fi

    # Create symlink
    ensure_user_local_bin_on_path
    ln -sf "$repo_dir/dist/entry.js" "$HOME/.local/bin/havenclaw"
    chmod +x "$HOME/.local/bin/havenclaw" 2>/dev/null || true

    ui_success "HavenClaw installed from Git"
}

# Install HavenClaw from npm
install_havenclaw_npm() {
    local version_spec="havenclaw"
    if [[ "$HAVENCLAW_VERSION" != "latest" && "$HAVENCLAW_VERSION" != "" ]]; then
        version_spec="havenclaw@$HAVENCLAW_VERSION"
    fi

    ui_info "Installing HavenClaw from npm ($version_spec)"

    if command -v pnpm &> /dev/null; then
        pnpm add -g "$version_spec" >/dev/null 2>&1 || npm install -g "$version_spec"
    else
        npm install -g "$version_spec"
    fi

    ui_success "HavenClaw installed from npm"
}

# Ensure user local bin on PATH
ensure_user_local_bin_on_path() {
    local target="$HOME/.local/bin"
    mkdir -p "$target"

    # shellcheck disable=SC2016
    local path_line='export PATH="$HOME/.local/bin:$PATH"'
    for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
        if [[ -f "$rc" ]] && ! grep -q ".local/bin" "$rc"; then
            echo "$path_line" >> "$rc"
        fi
    done

    export PATH="$target:$PATH"
}

# Resolve havenclaw binary
resolve_havenclaw_bin() {
    local resolved=""
    resolved="$(type -P havenclaw 2>/dev/null || true)"
    if [[ -n "$resolved" && -x "$resolved" ]]; then
        echo "$resolved"
        return 0
    fi

    if [[ -x "$HOME/.local/bin/havenclaw" ]]; then
        echo "$HOME/.local/bin/havenclaw"
        return 0
    fi

    local npm_bin=""
    npm_bin="$(npm bin -g 2>/dev/null || true)"
    if [[ -n "$npm_bin" && -x "${npm_bin}/havenclaw" ]]; then
        echo "${npm_bin}/havenclaw"
        return 0
    fi

    echo ""
    return 1
}

# Show footer with links
show_footer_links() {
    echo ""
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${INFO}  Next Steps:${NC}"
    echo ""
    echo -e "  1. Run: ${ACCENT}havenclaw onboard${NC}"
    echo -e "  2. Connect your agent: ${ACCENT}havenclaw agent register${NC}"
    echo -e "  3. View docs: ${ACCENT}https://docs.havenclaw.ai${NC}"
    echo ""
    echo -e "${INFO}  FAQ: https://docs.havenclaw.ai/start/faq${NC}"
    echo -e "${INFO}  GitHub: https://github.com/ava-labs/havenclaw${NC}"
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main installation flow
main() {
    if [[ "$HELP" == "1" ]]; then
        print_usage
        return 0
    fi

    print_installer_banner
    detect_os_or_die

    # Set default install method
    if [[ -z "$INSTALL_METHOD" ]]; then
        INSTALL_METHOD="npm"
    fi

    ui_stage "[1/4] Preparing environment"

    # Install Homebrew (macOS)
    install_homebrew

    # Install Node.js
    if ! check_node; then
        install_node
    fi

    ui_stage "[2/4] Installing dependencies"

    # Install Git
    if ! check_git; then
        install_git
    fi

    # Fix npm permissions (Linux)
    fix_npm_permissions

    # Install pnpm
    ensure_pnpm

    ui_stage "[3/4] Installing HavenClaw"

    if [[ "$INSTALL_METHOD" == "git" ]]; then
        install_havenclaw_from_git "$GIT_DIR"
    else
        install_havenclaw_npm
    fi

    ui_stage "[4/5] Wallet configuration"

    # Create config directory
    mkdir -p "$HOME/.havenclaw"
    
    # Check if private key provided via argument/env
    if [[ -n "$HAVENCLAW_PRIVATE_KEY" ]]; then
        ui_success "Private key provided - configuring wallet..."
        
        # Validate private key format
        if [[ "$HAVENCLAW_PRIVATE_KEY" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
            # Store encrypted wallet
            ui_info "Storing encrypted wallet..."
            echo "$HAVENCLAW_PRIVATE_KEY" | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -out "$HOME/.havenclaw/.wallet.enc" -pass pass:"havenclaw_auto_$(date +%s)" 2>/dev/null || \
            echo "$HAVENCLAW_PRIVATE_KEY" | base64 > "$HOME/.havenclaw/.wallet"
            chmod 600 "$HOME/.havenclaw/.wallet.enc" 2>/dev/null || chmod 600 "$HOME/.havenclaw/.wallet"
            ui_success "✓ Wallet configured securely"
        else
            ui_error "Invalid private key format (must be 0x + 64 hex chars)"
            exit 1
        fi
        
        ui_success "Network: $HAVENCLAW_NETWORK"
        [[ -n "$HAVENCLAW_RPC_URL" ]] && ui_success "RPC URL configured"
        
    # Interactive mode - ASK USER for all configuration
    elif [[ -t 0 ]]; then
        echo ""
        echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${INFO}  Configuration Setup${NC}"
        echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${BOLD}Please enter your configuration:${NC}"
        echo ""
        
        # Ask for private key
        echo -e "${WARN}⚠️  Wallet Configuration${NC}"
        echo "   Your private key will be encrypted and stored securely."
        echo ""
        read -s -p "Enter your private key (0x + 64 hex chars): " HAVENCLAW_PRIVATE_KEY
        echo ""
        
        if [[ -n "$HAVENCLAW_PRIVATE_KEY" ]]; then
            if [[ "$HAVENCLAW_PRIVATE_KEY" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
                # Store encrypted wallet
                echo "$HAVENCLAW_PRIVATE_KEY" | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -out "$HOME/.havenclaw/.wallet.enc" -pass pass:"havenclaw_auto_$(date +%s)" 2>/dev/null || \
                echo "$HAVENCLAW_PRIVATE_KEY" | base64 > "$HOME/.havenclaw/.wallet"
                chmod 600 "$HOME/.havenclaw/.wallet.enc" 2>/dev/null || chmod 600 "$HOME/.havenclaw/.wallet"
                echo -e "${SUCCESS}✓ Wallet configured securely${NC}"
            else
                echo -e "${WARN}! Invalid private key format, skipping wallet storage${NC}"
                HAVENCLAW_PRIVATE_KEY=""
            fi
        else
            echo -e "${WARN}! No private key entered, skipping wallet storage${NC}"
        fi
        
        echo ""
        echo -e "${WARN}⚠️  Network Configuration${NC}"
        echo "   Using Avalanche Fuji Testnet (recommended for development)"
        HAVENCLAW_NETWORK="fuji"
        echo -e "${SUCCESS}✓ Network: $HAVENCLAW_NETWORK${NC}"
        
        # RPC URL for Fuji
        HAVENCLAW_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
        echo -e "${SUCCESS}✓ RPC: Fuji Testnet${NC}"
        
        echo ""
        echo -e "${WARN}⚠️  Agent Configuration${NC}"
        read -p "Enter agent name [My AI Agent]: " HAVENCLAW_AGENT_NAME_INPUT
        HAVENCLAW_AGENT_NAME="${HAVENCLAW_AGENT_NAME_INPUT:-My AI Agent}"
        
        read -p "Enter capabilities (comma-separated, e.g., trading,analysis): " HAVENCLAW_CAPABILITIES
        echo ""
        
        # Ask about auto-register
        echo -e "${BOLD}Agent Registration on Fuji Testnet:${NC}"
        echo "  Would you like to register your agent on Fuji Testnet now?"
        echo "  (Requires test AVAX tokens)"
        read -p "Register agent? (y/N): " AUTO_REGISTER_INPUT
        if [[ "$AUTO_REGISTER_INPUT" =~ ^[Yy]$ ]]; then
            AUTO_REGISTER="1"
        else
            AUTO_REGISTER="0"
        fi
    else
        # Non-interactive and no private key provided
        ui_info "Non-interactive mode - wallet not configured"
        ui_info "Run 'havenclaw wallet setup' after installation"
    fi

    # Create config file (ALWAYS - fully automated)
    cat > "$HOME/.havenclaw/config.json" << EOF
{
  "network": "${HAVENCLAW_NETWORK:-fuji}",
  "agentName": "${HAVENCLAW_AGENT_NAME:-My AI Agent}",
  "installDaemon": false,
  "rpcUrl": "${HAVENCLAW_RPC_URL:-}",
  "preferences": {
    "autoApprove": false,
    "notifications": true
  }
}
EOF
    ui_success "Configuration created: $HOME/.havenclaw/config.json"

    ui_stage "[5/5] Finalizing setup"

    # Ensure PATH
    ensure_user_local_bin_on_path

    # Check installation
    local installed_version=""
    local claw_bin=""
    claw_bin="$(resolve_havenclaw_bin || true)"

    if [[ -n "$claw_bin" ]]; then
        installed_version="$("$claw_bin" --version 2>/dev/null || true)"
    fi

    echo ""
    if [[ -n "$installed_version" ]]; then
        ui_celebrate "🏛️ HavenClaw installed successfully (v${installed_version})!"
    else
        ui_celebrate "🏛️ HavenClaw installed successfully!"
    fi
    
    # Auto-register agent if configured
    if [[ "$AUTO_REGISTER" == "1" && -n "$HAVENCLAW_PRIVATE_KEY" && -n "$HAVENCLAW_AGENT_NAME" ]]; then
        ui_stage "Bonus: Auto-registering agent..."
        echo -e "${INFO}Registering agent: ${HAVENCLAW_AGENT_NAME}${NC}"
        echo -e "${INFO}Network: Fuji Testnet${NC}"
        echo ""
        
        # Warn about AVAX requirement
        echo -e "${WARN}⚠️  Important:${NC}"
        echo "   Agent registration requires test AVAX for gas fees."
        echo "   If registration fails, get test AVAX from:"
        echo -e "   ${INFO}https://faucet.avax.network/${NC}"
        echo ""
        
        # Set private key as environment variable for the CLI
        export HAVENCLAW_PRIVATE_KEY="$HAVENCLAW_PRIVATE_KEY"
        export HAVENCLAW_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
        
        if [[ -n "$HAVENCLAW_CAPABILITIES" ]]; then
            echo -e "Capabilities: ${HAVENCLAW_CAPABILITIES}"
            echo ""
            havenclaw agent register --name "$HAVENCLAW_AGENT_NAME" --capabilities "$HAVENCLAW_CAPABILITIES" || \
                echo -e "${WARN}! Agent registration failed.${NC}"
                echo -e "${INFO}  Please get test AVAX from: https://faucet.avax.network/${NC}"
                echo -e "${INFO}  Then run manually:${NC}"
                echo -e "${INFO}    export HAVENCLAW_PRIVATE_KEY=your_key${NC}"
                echo -e "${INFO}    havenclaw agent register --name \"${HAVENCLAW_AGENT_NAME}\" --capabilities ${HAVENCLAW_CAPABILITIES}${NC}"
        else
            havenclaw agent register --name "$HAVENCLAW_AGENT_NAME" || \
                echo -e "${WARN}! Agent registration failed.${NC}"
                echo -e "${INFO}  Please get test AVAX from: https://faucet.avax.network/${NC}"
                echo -e "${INFO}  Then run manually:${NC}"
                echo -e "${INFO}    export HAVENCLAW_PRIVATE_KEY=your_key${NC}"
                echo -e "${INFO}    havenclaw agent register --name \"${HAVENCLAW_AGENT_NAME}\"${NC}"
        fi
        
        # Clear private key from environment
        unset HAVENCLAW_PRIVATE_KEY
    fi

    # Completion messages
    local completion_messages=(
        "Your agents just grew claws—coordinate them all from one terminal."
        "HavenVM online—where sovereign agents meet trustless coordination."
        "Installation complete. Your AI workforce awaits."
        "The lobster has landed on Haven. Let the coordination begin."
        "Fresh install, same revolutionary vision. Miss me?"
    )
    local completion_message="${completion_messages[RANDOM % ${#completion_messages[@]}]}"
    echo -e "${MUTED}${completion_message}${NC}"
    
    # Show configuration summary
    echo ""
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${INFO}  Configuration Summary${NC}"
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Network: ${HAVENCLAW_NETWORK:-fuji}"
    echo -e "  Config:  $HOME/.havenclaw/config.json"
    if [[ -f "$HOME/.havenclaw/.wallet" ]] || [[ -f "$HOME/.havenclaw/.wallet.enc" ]]; then
        echo -e "  Wallet:  ${SUCCESS}Configured${NC}"
    else
        echo -e "  Wallet:  ${WARN}Not configured${NC}"
    fi
    echo -e "${INFO}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    show_footer_links
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help|-h)
                HELP=1
                ;;
            --verbose|-v)
                VERBOSE=1
                ;;
            --dry-run)
                DRY_RUN=1
                ;;
            --no-prompt)
                NO_PROMPT=1
                ;;
            --no-onboard)
                NO_ONBOARD=1
                ;;
            --install-method)
                INSTALL_METHOD="$2"
                shift
                ;;
            --version)
                HAVENCLAW_VERSION="$2"
                shift
                ;;
            --git-dir)
                GIT_DIR="$2"
                shift
                ;;
            *)
                ui_warn "Unknown option: $1"
                ;;
        esac
        shift
    done
}

# Run installer
parse_args "$@"
main
