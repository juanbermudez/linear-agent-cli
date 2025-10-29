#!/bin/bash
# Linear CLI for AI Agents - One-Command Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-cli-agent/main/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macos" ;;
        Linux*)     OS="linux" ;;
        MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
        *)          error "Unsupported operating system: $(uname -s)" ;;
    esac
}

# Detect shell
detect_shell() {
    if [ -n "$BASH_VERSION" ]; then
        SHELL_NAME="bash"
        SHELL_CONFIG="$HOME/.bashrc"
    elif [ -n "$ZSH_VERSION" ]; then
        SHELL_NAME="zsh"
        SHELL_CONFIG="$HOME/.zshrc"
    elif [ -n "$FISH_VERSION" ]; then
        SHELL_NAME="fish"
        SHELL_CONFIG="$HOME/.config/fish/config.fish"
    else
        # Fallback: check $SHELL variable
        case "$SHELL" in
            */bash)
                SHELL_NAME="bash"
                SHELL_CONFIG="$HOME/.bashrc"
                ;;
            */zsh)
                SHELL_NAME="zsh"
                SHELL_CONFIG="$HOME/.zshrc"
                ;;
            */fish)
                SHELL_NAME="fish"
                SHELL_CONFIG="$HOME/.config/fish/config.fish"
                ;;
            *)
                SHELL_NAME="bash"
                SHELL_CONFIG="$HOME/.bashrc"
                warning "Could not detect shell, defaulting to bash"
                ;;
        esac
    fi
}

# Check if Deno is installed
check_deno() {
    if command -v deno &> /dev/null; then
        DENO_VERSION=$(deno --version | head -n 1 | awk '{print $2}')
        success "Deno $DENO_VERSION is already installed"
        return 0
    else
        return 1
    fi
}

# Install Deno
install_deno() {
    info "Installing Deno..."

    if [ "$OS" = "windows" ]; then
        powershell -c "irm https://deno.land/install.ps1 | iex"
    else
        curl -fsSL https://deno.land/install.sh | sh
    fi

    success "Deno installed successfully"
}

# Add Deno to PATH
add_deno_to_path() {
    DENO_BIN="$HOME/.deno/bin"

    # Check if already in PATH
    if echo "$PATH" | grep -q "$DENO_BIN"; then
        success "Deno is already in PATH"
        return 0
    fi

    info "Adding Deno to PATH in $SHELL_CONFIG"

    case "$SHELL_NAME" in
        bash|zsh)
            # Check if already in config file
            if ! grep -q "/.deno/bin" "$SHELL_CONFIG" 2>/dev/null; then
                echo '' >> "$SHELL_CONFIG"
                echo '# Deno' >> "$SHELL_CONFIG"
                echo 'export PATH="$HOME/.deno/bin:$PATH"' >> "$SHELL_CONFIG"
                success "Added Deno to $SHELL_CONFIG"
            else
                success "Deno already in $SHELL_CONFIG"
            fi
            ;;
        fish)
            mkdir -p "$(dirname "$SHELL_CONFIG")"
            if ! grep -q "/.deno/bin" "$SHELL_CONFIG" 2>/dev/null; then
                echo '' >> "$SHELL_CONFIG"
                echo '# Deno' >> "$SHELL_CONFIG"
                echo 'set -gx PATH $HOME/.deno/bin $PATH' >> "$SHELL_CONFIG"
                success "Added Deno to $SHELL_CONFIG"
            else
                success "Deno already in $SHELL_CONFIG"
            fi
            ;;
    esac

    # Add to current session
    export PATH="$HOME/.deno/bin:$PATH"
}

# Install Linear CLI
install_linear_cli() {
    info "Installing Linear CLI..."

    # Clone or update repository
    CLI_DIR="$HOME/.linear-cli"

    if [ -d "$CLI_DIR" ]; then
        info "Updating existing installation..."
        cd "$CLI_DIR"
        git pull origin main
    else
        info "Cloning repository..."
        git clone https://github.com/juanbermudez/linear-cli-agent.git "$CLI_DIR"
        cd "$CLI_DIR"
    fi

    # Install CLI
    deno task install

    success "Linear CLI installed successfully"
}

# Verify installation
verify_installation() {
    if command -v linear &> /dev/null; then
        VERSION=$(linear --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
        success "Linear CLI v$VERSION is ready to use!"
        return 0
    else
        return 1
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 Installation complete!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "1. Reload your shell configuration:"
    echo -e "   ${YELLOW}source $SHELL_CONFIG${NC}"
    echo "   or restart your terminal"
    echo ""
    echo "2. Set up your Linear API key:"
    echo -e "   ${YELLOW}linear config setup${NC}"
    echo ""
    echo "3. Start using the CLI:"
    echo -e "   ${YELLOW}linear issue list${NC}"
    echo -e "   ${YELLOW}linear project create --name \"My Project\" --with-doc${NC}"
    echo -e "   ${YELLOW}linear document create --current-project --title \"Notes\"${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📚 Documentation: https://github.com/juanbermudez/linear-cli-agent"
    echo "🐛 Issues: https://github.com/juanbermudez/linear-cli-agent/issues"
    echo ""
}

# Main installation flow
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Linear CLI for AI Agents - Installer"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Detect environment
    info "Detecting environment..."
    detect_os
    detect_shell
    success "OS: $OS, Shell: $SHELL_NAME"
    echo ""

    # Check/install Deno
    if ! check_deno; then
        install_deno
        add_deno_to_path
    fi
    echo ""

    # Install Linear CLI
    install_linear_cli
    echo ""

    # Verify
    if verify_installation; then
        print_next_steps
    else
        warning "Installation completed but 'linear' command not found in PATH"
        echo ""
        echo "Please run: source $SHELL_CONFIG"
        echo "Then verify with: linear --version"
    fi
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    error "Git is required but not installed. Please install git first."
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    error "curl is required but not installed. Please install curl first."
fi

# Run main installation
main
