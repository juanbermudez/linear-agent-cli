#!/bin/bash
# AI Agent Automation Examples
# Demonstrates how AI agents can use the Linear CLI

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

: ${LINEAR_API_KEY:?Please run setup-demo.sh first}
: ${LINEAR_WORKSPACE:?Please run setup-demo.sh first}
: ${LINEAR_TEAM_ID:?Please run setup-demo.sh first}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AI Agent Automation Examples        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Example 1: Daily Standup Report
echo -e "${GREEN}═══ Example 1: Daily Standup Report ═══${NC}"
echo ""
echo "Generating standup report for your team..."
echo ""

# Get in-progress issues
IN_PROGRESS=$(linear issue list --status "In Progress" --json)
IN_PROGRESS_COUNT=$(echo "$IN_PROGRESS" | jq '.issues | length')

# Get completed issues (last 5)
COMPLETED=$(linear issue list --status "Done" --json)
COMPLETED_TODAY=$(echo "$COMPLETED" | jq '.issues[0:5]')

echo -e "${CYAN}📊 Daily Standup Report - $(date +%Y-%m-%d)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}In Progress ($IN_PROGRESS_COUNT):${NC}"
echo "$IN_PROGRESS" | jq -r '.issues[] | "• [\(.identifier)] \(.title) (@\(.assignee.displayName // "Unassigned"))"'
echo ""
echo -e "${YELLOW}Recently Completed (5):${NC}"
echo "$COMPLETED_TODAY" | jq -r '.[] | "• [\(.identifier)] \(.title)"'
echo ""

# Example 2: Issue Triage
echo -e "${GREEN}═══ Example 2: Automated Issue Triage ═══${NC}"
echo ""
echo "Finding untriaged issues..."
echo ""

UNTRIAGED=$(linear issue list --status "Triage" --json)
UNTRIAGED_COUNT=$(echo "$UNTRIAGED" | jq '.issues | length')

if [ "$UNTRIAGED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Found $UNTRIAGED_COUNT untriaged issues:${NC}"
    echo "$UNTRIAGED" | jq -r '.issues[] | "• [\(.identifier)] \(.title)"'
    echo ""
    echo "AI Agent could:"
    echo "  • Analyze title/description for keywords"
    echo "  • Auto-assign to appropriate team members"
    echo "  • Add relevant labels"
    echo "  • Set priority based on content"
else
    echo -e "${GREEN}✓${NC} No untriaged issues found!"
fi
echo ""

# Example 3: Sprint Planning Assistant
echo -e "${GREEN}═══ Example 3: Sprint Planning Assistant ═══${NC}"
echo ""
echo "Analyzing backlog for sprint planning..."
echo ""

BACKLOG=$(linear issue list --status "Backlog" --json)
BACKLOG_COUNT=$(echo "$BACKLOG" | jq '.issues | length')

echo -e "${CYAN}Backlog Analysis:${NC}"
echo "  Total issues: $BACKLOG_COUNT"

# Priority breakdown
HIGH_PRIORITY=$(echo "$BACKLOG" | jq '[.issues[] | select(.priority == 1)] | length')
MEDIUM_PRIORITY=$(echo "$BACKLOG" | jq '[.issues[] | select(.priority == 2)] | length')
LOW_PRIORITY=$(echo "$BACKLOG" | jq '[.issues[] | select(.priority == 3)] | length')

echo "  High priority: $HIGH_PRIORITY"
echo "  Medium priority: $MEDIUM_PRIORITY"
echo "  Low priority: $LOW_PRIORITY"
echo ""

echo -e "${CYAN}Recommended for next sprint (top 5 by priority):${NC}"
echo "$BACKLOG" | jq -r '.issues | sort_by(.priority) | .[0:5][] | "• [\(.identifier)] \(.title) (P\(.priority))"'
echo ""

# Example 4: Health Check Dashboard
echo -e "${GREEN}═══ Example 4: Project Health Dashboard ═══${NC}"
echo ""

# Get all projects
PROJECTS=$(linear project list --json)

echo -e "${CYAN}Active Projects Status:${NC}"
echo "$PROJECTS" | jq -r '.projects[0:5][] | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nProject: \(.name)\nStatus: \(.status.name)\nProgress: \(.progress)%\n"'

# Example 5: Label-based Auto-categorization
echo -e "${GREEN}═══ Example 5: Smart Labeling ═══${NC}"
echo ""
echo "AI Agent can auto-label issues based on content:"
echo ""

# Get recent unlabeled issues
RECENT=$(linear issue list --json)
UNLABELED=$(echo "$RECENT" | jq '[.issues[] | select(.labels | length == 0)] | .[0:3]')

echo "$UNLABELED" | jq -r '.[] | "Issue: \(.identifier) - \(.title)\nSuggested labels: \(if (.title | test("API|backend|database"; "i")) then "backend" elif (.title | test("UI|frontend|design"; "i")) then "frontend" elif (.title | test("AI|ML|GPT"; "i")) then "ai" else "general" end)\n"'

# Example 6: Workflow Automation
echo -e "${GREEN}═══ Example 6: Workflow State Automation ═══${NC}"
echo ""

# Get available workflow states
WORKFLOWS=$(linear workflow list --json)
STARTED_STATE=$(echo "$WORKFLOWS" | jq -r '.workflowStates[] | select(.type=="started") | .id')

echo "Available workflow states:"
echo "$WORKFLOWS" | jq -r '.workflowStates[] | "  • \(.name) (\(.type))"'
echo ""
echo "AI Agent can automatically move issues through workflows:"
echo "  • When PR is created → Move to 'In Review'"
echo "  • When tests pass → Move to 'Ready for Deploy'"
echo "  • When deployed → Move to 'Done'"
echo ""

# Example 7: Generate Release Notes
echo -e "${GREEN}═══ Example 7: Release Notes Generator ═══${NC}"
echo ""

echo "Generating release notes from completed issues..."
echo ""

RELEASE_ISSUES=$(linear issue list --status "Done" --json)

echo -e "${CYAN}# Release Notes - $(date +%Y-%m-%d)${NC}"
echo ""
echo "## Features"
echo "$RELEASE_ISSUES" | jq -r '.issues[0:5][] | select(.title | test("add|feature"; "i")) | "- \(.title) (\(.identifier))"'
echo ""
echo "## Bug Fixes"
echo "$RELEASE_ISSUES" | jq -r '.issues[0:5][] | select(.title | test("fix|bug"; "i")) | "- \(.title) (\(.identifier))"'
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Automation Examples Complete     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "These examples show how AI agents can:"
echo -e "  ${GREEN}✓${NC} Generate standup reports"
echo -e "  ${GREEN}✓${NC} Automate issue triage"
echo -e "  ${GREEN}✓${NC} Assist with sprint planning"
echo -e "  ${GREEN}✓${NC} Monitor project health"
echo -e "  ${GREEN}✓${NC} Auto-categorize with labels"
echo -e "  ${GREEN}✓${NC} Manage workflow automation"
echo -e "  ${GREEN}✓${NC} Generate release notes"
echo ""
echo "All examples use JSON output for easy parsing and automation."
echo ""
echo -e "${CYAN}Build your own automation:${NC}"
echo "  • Use --json flag for all commands"
echo "  • Parse with jq or your preferred JSON tool"
echo "  • Combine with CI/CD pipelines"
echo "  • Integrate with webhooks"
echo ""
