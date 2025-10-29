#!/bin/bash
# Setup script for Divergent Ventures Linear CLI Demo
# This script configures your environment and tests the connection

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Linear CLI Demo Setup             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if linear is installed
if ! command -v linear &> /dev/null; then
    echo -e "${RED}✗${NC} Linear CLI not found"
    echo -e "${YELLOW}Installing Linear CLI...${NC}"
    curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
    echo -e "${GREEN}✓${NC} Linear CLI installed"
    echo -e "${YELLOW}⚠${NC}  Please run 'source ~/.zshrc' (or ~/.bashrc) and re-run this script"
    exit 0
else
    VERSION=$(linear --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
    echo -e "${GREEN}✓${NC} Linear CLI found (v$VERSION)"
fi

echo ""

# Check for API key
if [ -z "$LINEAR_API_KEY" ]; then
    echo -e "${YELLOW}⚠${NC}  LINEAR_API_KEY not set"
    echo ""
    echo "Please set your Linear API key:"
    echo "1. Go to: https://linear.app/settings/api"
    echo "2. Click 'Create key'"
    echo "3. Copy the key and run:"
    echo ""
    echo -e "   ${BLUE}export LINEAR_API_KEY=\"lin_api_YOUR_KEY\"${NC}"
    echo ""
    echo "Then add it to your shell profile (~/.zshrc or ~/.bashrc):"
    echo -e "   ${BLUE}echo 'export LINEAR_API_KEY=\"lin_api_YOUR_KEY\"' >> ~/.zshrc${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓${NC} LINEAR_API_KEY is set"
fi

# Set up workspace configuration
echo ""
echo -e "${BLUE}Configuring workspace...${NC}"

# Check if workspace and team are set
if [ -z "$LINEAR_WORKSPACE" ]; then
    echo -e "${YELLOW}⚠${NC}  LINEAR_WORKSPACE not set"
    echo ""
    echo "Please set your Linear workspace:"
    echo -e "   ${BLUE}export LINEAR_WORKSPACE=\"your-workspace\"${NC}"
    echo ""
    exit 1
fi

if [ -z "$LINEAR_TEAM_ID" ]; then
    echo -e "${YELLOW}⚠${NC}  LINEAR_TEAM_ID not set"
    echo ""
    echo "Please set your Linear team ID:"
    echo -e "   ${BLUE}export LINEAR_TEAM_ID=\"YOUR-TEAM\"${NC}"
    echo ""
    exit 1
fi

export LINEAR_CACHE_ENABLED="true"
export LINEAR_AUTO_BRANCH="true"

echo -e "${GREEN}✓${NC} Workspace: $LINEAR_WORKSPACE"
echo -e "${GREEN}✓${NC} Team: $LINEAR_TEAM_ID"
echo -e "${GREEN}✓${NC} Cache: enabled"
echo -e "${GREEN}✓${NC} Auto-branch: enabled"

# Test connection
echo ""
echo -e "${BLUE}Testing connection to Linear...${NC}"

if linear team list > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Successfully connected to Linear!"
else
    echo -e "${RED}✗${NC} Failed to connect to Linear"
    echo ""
    echo "Please check:"
    echo "1. Your API key is correct"
    echo "2. You have access to the '$LINEAR_WORKSPACE' workspace"
    echo "3. The '$LINEAR_TEAM_ID' team exists"
    exit 1
fi

# Warm up caches
echo ""
echo -e "${BLUE}Warming up caches...${NC}"

linear workflow cache > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Workflows cached" || echo -e "${YELLOW}⚠${NC}  Failed to cache workflows"
linear status cache > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Project statuses cached" || echo -e "${YELLOW}⚠${NC}  Failed to cache project statuses"

# Show cached workflows
echo ""
echo -e "${BLUE}Available workflow states:${NC}"
linear workflow list 2>/dev/null || echo -e "${YELLOW}⚠${NC}  Could not list workflows"

# Create config file
echo ""
echo -e "${BLUE}Creating .linear.toml configuration...${NC}"

cat > .linear.toml <<EOF
[auth]
token = "$LINEAR_API_KEY"

[defaults]
workspace = "$LINEAR_WORKSPACE"
team_id = "$LINEAR_TEAM_ID"

[vcs]
autoBranch = true

[cache]
enabled = true

[interactive]
enabled = true

[output]
format = "text"
EOF

echo -e "${GREEN}✓${NC} Created .linear.toml"

# Final instructions
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Setup Complete! 🎉           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Environment variables set for this session."
echo "To persist these settings, add to your ~/.zshrc or ~/.bashrc:"
echo ""
echo -e "${BLUE}export LINEAR_API_KEY=\"$LINEAR_API_KEY\"${NC}"
echo -e "${BLUE}export LINEAR_WORKSPACE=\"$LINEAR_WORKSPACE\"${NC}"
echo -e "${BLUE}export LINEAR_TEAM_ID=\"$LINEAR_TEAM_ID\"${NC}"
echo -e "${BLUE}export LINEAR_CACHE_ENABLED=\"true\"${NC}"
echo -e "${BLUE}export LINEAR_AUTO_BRANCH=\"true\"${NC}"
echo ""
echo "Next steps:"
echo -e "  ${GREEN}•${NC} Run ${BLUE}./demo-features.sh${NC} to see the CLI in action"
echo -e "  ${GREEN}•${NC} Run ${BLUE}./create-ai-project.sh${NC} to create a sample project"
echo -e "  ${GREEN}•${NC} Check ${BLUE}../DEMO.md${NC} for full documentation"
echo ""
