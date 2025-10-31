#!/bin/bash
# Linear CLI for AI Agents - Uninstaller

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Linear CLI for AI Agents - Uninstaller"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask for confirmation
read -p "Are you sure you want to uninstall Linear CLI? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "Uninstall cancelled"
    exit 0
fi

echo ""

# Uninstall the CLI binary
if command -v deno &> /dev/null; then
    info "Removing Linear CLI binary..."
    deno uninstall -g linear 2>/dev/null || true
    success "Linear CLI binary removed"
else
    warning "Deno not found, skipping binary removal"
fi

# Remove cloned repository
CLI_DIR="$HOME/.linear-cli"
if [ -d "$CLI_DIR" ]; then
    info "Removing repository from $CLI_DIR..."
    rm -rf "$CLI_DIR"
    success "Repository removed"
else
    info "Repository not found at $CLI_DIR"
fi

# Remove config file (optional)
if [ -f "$HOME/.linear.toml" ]; then
    read -p "Remove configuration file ~/.linear.toml? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$HOME/.linear.toml"
        success "Configuration file removed"
    else
        info "Configuration file kept"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Uninstall complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Note: Deno itself has not been removed."
echo "To remove Deno, run: rm -rf ~/.deno"
echo ""
