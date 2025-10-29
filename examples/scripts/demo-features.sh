#!/bin/bash
# Demo script showing all Linear CLI features
# Requires LINEAR_API_KEY, LINEAR_WORKSPACE, and LINEAR_TEAM_ID to be set
# Run setup-demo.sh first to configure your environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure we're configured
: ${LINEAR_API_KEY:?Please run setup-demo.sh first}
: ${LINEAR_WORKSPACE:?Please run setup-demo.sh first}
: ${LINEAR_TEAM_ID:?Please run setup-demo.sh first}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Linear CLI Feature Demonstration   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

pause() {
    echo ""
    echo -e "${CYAN}Press Enter to continue...${NC}"
    read
}

# Feature 1: Configuration
echo -e "${GREEN}═══ Feature 1: Configuration System ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear config get team_id"
linear config get team_id
echo ""
echo -e "${CYAN}Precedence:${NC} CLI args → Env vars → Config file → Defaults"
echo -e "${CYAN}Current team:${NC} $LINEAR_TEAM_ID"
pause

# Feature 2: Workflow Management
echo -e "${GREEN}═══ Feature 2: Workflow Management (with Caching) ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear workflow list"
echo ""
linear workflow list echo ""
echo -e "${YELLOW}Note:${NC} Workflows are cached for 24 hours. Run with --refresh to update."
pause

# Feature 3: Project Status Management
echo -e "${GREEN}═══ Feature 3: Project Status Management ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear status list"
echo ""
linear status list
echo ""
echo -e "${YELLOW}Note:${NC} Project statuses are workspace-wide and cached."
pause

# Feature 4: List Issues
echo -e "${GREEN}═══ Feature 4: Issue Management ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear issue list"
echo ""
linear issue list | head -15
echo ""
echo -e "${YELLOW}Note:${NC} Showing first 15 issues"
pause

# Feature 5: JSON Output for AI Agents
echo -e "${GREEN}═══ Feature 5: JSON Output for AI Agents ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear issue list --json | jq '.issues[0:3]'"
echo ""
linear issue list --json | jq '.issues[0:3] | .[] | {
  identifier: .identifier,
  title: .title,
  status: .state.name,
  assignee: .assignee.displayName
}'
echo ""
echo -e "${YELLOW}Note:${NC} All commands support --json for programmatic use"
pause

# Feature 6: Labels
echo -e "${GREEN}═══ Feature 6: Label Management ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear label list"
echo ""
if linear label list 2>/dev/null | grep -q "No labels found"; then
    echo "No labels found. Let's create some demo labels..."
    echo ""
    echo -e "${CYAN}Creating labels...${NC}"
    linear label create --name "demo-ai" --color "#9B59B6" 2>/dev/null || echo "Label may already exist"
    linear label create --name "demo-backend" --color "#3498DB" 2>/dev/null || echo "Label may already exist"
    linear label create --name "demo-urgent" --color "#E67E22" 2>/dev/null || echo "Label may already exist"
    echo ""
    linear label list else
    linear label list fi
pause

# Feature 7: Projects
echo -e "${GREEN}═══ Feature 7: Project Management ═══${NC}"
echo ""
echo -e "${CYAN}Command:${NC} linear project list"
echo ""
linear project list | head -10
echo ""
echo -e "${YELLOW}Note:${NC} Showing first 10 projects"
pause

# Feature 8: Cache Performance
echo -e "${GREEN}═══ Feature 8: Cache Performance ═══${NC}"
echo ""
echo -e "${CYAN}First call (from API):${NC}"
rm -f ~/.cache/linear-cli/workflows-team-${LINEAR_TEAM_ID}.json
time linear workflow list > /dev/null
echo ""
echo -e "${CYAN}Second call (from cache):${NC}"
time linear workflow list > /dev/null
echo ""
echo -e "${YELLOW}Note:${NC} Cache provides significant speed improvements!"
pause

# Feature 9: Resource Identifier Flexibility
echo -e "${GREEN}═══ Feature 9: Flexible Resource Identification ═══${NC}"
echo ""
echo "The CLI accepts multiple formats:"
echo ""
echo -e "${CYAN}• Issue by ID:${NC}        linear issue view TEAM-123"
echo -e "${CYAN}• Issue by URL:${NC}       linear issue view https://linear.app/.../issue/TEAM-123/..."
echo -e "${CYAN}• Issue by title:${NC}     linear issue view \"Bug fix\"  ${YELLOW}(searches)${NC}"
echo ""
echo -e "${CYAN}• Project by UUID:${NC}    linear project view <uuid>"
echo -e "${CYAN}• Project by URL:${NC}     linear project view https://linear.app/.../project/<uuid>/..."
echo -e "${CYAN}• Project by name:${NC}    linear project view \"My Project\"  ${YELLOW}(searches)${NC}"
echo ""
pause

# Feature 10: VCS Integration
echo -e "${GREEN}═══ Feature 10: VCS Integration ═══${NC}"
echo ""
echo -e "${CYAN}Auto-branching is:${NC} ${GREEN}$([ "$LINEAR_AUTO_BRANCH" = "true" ] && echo "ENABLED" || echo "DISABLED")${NC}"
echo ""
echo "When enabled, 'linear issue start TEAM-123' will:"
echo -e "  ${GREEN}•${NC} Create git branch: ${BLUE}TEAM-123-issue-title${NC}"
echo -e "  ${GREEN}•${NC} Update issue status to ${BLUE}In Progress${NC}"
echo ""
echo "To disable: ${CYAN}export LINEAR_AUTO_BRANCH=false${NC}"
pause

# Feature 11: Cross-Entity Operations
echo -e "${GREEN}═══ Feature 11: Cross-Entity Operations ═══${NC}"
echo ""
echo "Create a project with document in one command:"
echo ""
echo -e "${CYAN}linear project create \\${NC}"
echo -e "${CYAN}  --name \"My Project\" \\${NC}"
echo -e "${CYAN}  \\${NC}"
echo -e "${CYAN}  --with-doc \\${NC}"
echo -e "${CYAN}  --doc-title \"Technical Spec\"${NC}"
echo ""
echo "This creates both the project AND a document linked to it!"
pause

# Feature 12: Environment Variable Priority
echo -e "${GREEN}═══ Feature 12: Configuration Precedence ═══${NC}"
echo ""
echo "Priority order: ${BLUE}CLI args${NC} > ${BLUE}Env vars${NC} > ${BLUE}Config file${NC} > ${BLUE}Defaults${NC}"
echo ""
echo "Example:"
echo -e "${CYAN}LINEAR_TEAM_ID=\$LINEAR_TEAM_ID${NC}    ${YELLOW}# Environment variable${NC}"
echo -e "${CYAN}linear team list${NC}      ${YELLOW}# Uses team from env${NC}"
echo -e "${CYAN}linear team list --team ENG${NC}  ${YELLOW}# CLI arg overrides, uses ENG${NC}"
pause

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Demo Complete! 🎉              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "You've seen:"
echo -e "  ${GREEN}✓${NC} Configuration management"
echo -e "  ${GREEN}✓${NC} Workflow & status caching"
echo -e "  ${GREEN}✓${NC} Issue & project management"
echo -e "  ${GREEN}✓${NC} JSON output for automation"
echo -e "  ${GREEN}✓${NC} Label management"
echo -e "  ${GREEN}✓${NC} Cache performance"
echo -e "  ${GREEN}✓${NC} Flexible resource identification"
echo -e "  ${GREEN}✓${NC} VCS integration"
echo -e "  ${GREEN}✓${NC} Cross-entity operations"
echo ""
echo "Next steps:"
echo -e "  ${BLUE}•${NC} Try ./create-ai-project.sh to create a demo project"
echo -e "  ${BLUE}•${NC} Read ../DEMO.md for more examples"
echo -e "  ${BLUE}•${NC} Build your own automation scripts!"
echo ""
