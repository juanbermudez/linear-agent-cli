#!/bin/bash
# Create a demo AI project in Linear with issues and documents
# Demonstrates cross-entity operations and automation

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
echo -e "${BLUE}║   Create Demo AI Project              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Project details
PROJECT_NAME="🤖 AI Investment Analysis Tool - Demo"
PROJECT_DESC="An AI-powered platform to analyze investment opportunities using GPT-4 and market data APIs. This demo showcases the Linear CLI capabilities."

echo -e "${CYAN}Project:${NC} $PROJECT_NAME"
echo -e "${CYAN}Team:${NC} $LINEAR_TEAM_ID"
echo ""
echo -e "${YELLOW}This will create:${NC}"
echo "  • 1 Project"
echo "  • 1 Technical Specification document"
echo "  • 8 Issues (tasks)"
echo "  • 3 Labels"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1: Creating labels...${NC}"

# Create labels
declare -A LABELS=(
    ["demo-ai"]="#9B59B6"
    ["demo-backend"]="#3498DB"
    ["demo-frontend"]="#E74C3C"
)

for label in "${!LABELS[@]}"; do
    color="${LABELS[$label]}"
    if linear label create --name "$label" --color "$color" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Created label: $label"
    else
        echo -e "  ${YELLOW}⚠${NC}  Label '$label' may already exist"
    fi
done

echo ""
echo -e "${BLUE}Step 2: Creating project with technical spec...${NC}"

# Create project with document
PROJECT_JSON=$(linear project create \
  --name "$PROJECT_NAME" \
  --description "$PROJECT_DESC" \
  \
  --with-doc \
  --doc-title "Technical Specification" \
  --json)

PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.project.id')
PROJECT_URL=$(echo "$PROJECT_JSON" | jq -r '.project.url')
DOC_ID=$(echo "$PROJECT_JSON" | jq -r '.document.id // empty')

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗${NC} Failed to create project"
    echo "$PROJECT_JSON" | jq '.'
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Project created: $PROJECT_ID"
echo -e "  ${CYAN}URL:${NC} $PROJECT_URL"

if [ ! -z "$DOC_ID" ]; then
    echo -e "  ${GREEN}✓${NC} Document created: $DOC_ID"
fi

echo ""
echo -e "${BLUE}Step 3: Creating issues...${NC}"

# Define issues
declare -a ISSUES=(
    "Set up OpenAI GPT-4 API integration|Configure API keys, implement client library, and test connectivity|1|demo-ai,demo-backend"
    "Design database schema|Create schema for storing investment data, analysis results, and user portfolios|1|demo-backend"
    "Implement market data API integration|Connect to financial APIs (Alpha Vantage, Yahoo Finance) for real-time data|2|demo-backend"
    "Build AI analysis engine|Develop core logic for investment analysis using GPT-4 prompts|1|demo-ai,demo-backend"
    "Create investment dashboard UI|Build React dashboard to display analysis results and portfolio|2|demo-frontend"
    "Implement user authentication|Set up auth with JWT and secure user sessions|2|demo-backend"
    "Add real-time notifications|Implement WebSocket-based notifications for price alerts|3|demo-backend,demo-frontend"
    "Write comprehensive documentation|API docs, user guides, and deployment instructions|3"
)

CREATED_ISSUES=()

for issue_data in "${ISSUES[@]}"; do
    IFS='|' read -r title description priority labels <<< "$issue_data"

    # Create issue
    if [ ! -z "$labels" ]; then
        ISSUE_JSON=$(linear issue create \
            --title "$title" \
            --description "$description" \
            \
            --project "$PROJECT_ID" \
            --priority "$priority" \
            --label "$labels" \
            --json 2>/dev/null)
    else
        ISSUE_JSON=$(linear issue create \
            --title "$title" \
            --description "$description" \
            \
            --project "$PROJECT_ID" \
            --priority "$priority" \
            --json 2>/dev/null)
    fi

    ISSUE_ID=$(echo "$ISSUE_JSON" | jq -r '.issue.identifier // empty')

    if [ ! -z "$ISSUE_ID" ]; then
        echo -e "  ${GREEN}✓${NC} Created $ISSUE_ID: $title"
        CREATED_ISSUES+=("$ISSUE_ID")
    else
        echo -e "  ${RED}✗${NC} Failed to create: $title"
    fi

    # Small delay to avoid rate limiting
    sleep 0.5
done

echo ""
echo -e "${BLUE}Step 4: Creating additional documents...${NC}"

# Create meeting notes document
MEETING_DOC=$(linear document create \
  --project "$PROJECT_ID" \
  --title "Weekly Sync - AI Investment Tool" \
  --content "## Meeting Notes\n\n### Attendees\n- Development Team\n- Product Manager\n\n### Agenda\n1. Project kickoff\n2. Technical architecture review\n3. Sprint planning\n\n### Action Items\n- [ ] Finalize API selection\n- [ ] Set up development environment\n- [ ] Create mockups for dashboard" \
  --json 2>/dev/null)

MEETING_DOC_ID=$(echo "$MEETING_DOC" | jq -r '.document.id // empty')
if [ ! -z "$MEETING_DOC_ID" ]; then
    echo -e "  ${GREEN}✓${NC} Created meeting notes document"
fi

# Create implementation notes document
IMPL_DOC=$(linear document create \
  --project "$PROJECT_ID" \
  --title "Implementation Notes" \
  --content "## Technical Stack\n\n### Backend\n- Node.js + Express\n- PostgreSQL database\n- OpenAI GPT-4 API\n- Alpha Vantage API\n\n### Frontend\n- React + TypeScript\n- TailwindCSS\n- Recharts for visualizations\n\n### Infrastructure\n- Docker containers\n- AWS deployment\n- Redis for caching\n\n## Development Workflow\n1. Feature branch from main\n2. PR review required\n3. CI/CD via GitHub Actions" \
  --json 2>/dev/null)

IMPL_DOC_ID=$(echo "$IMPL_DOC" | jq -r '.document.id // empty')
if [ ! -z "$IMPL_DOC_ID" ]; then
    echo -e "  ${GREEN}✓${NC} Created implementation notes document"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Project Created! 🎉             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Project Summary:${NC}"
echo -e "  Name:      $PROJECT_NAME"
echo -e "  ID:        $PROJECT_ID"
echo -e "  URL:       $PROJECT_URL"
echo ""
echo -e "${GREEN}Created Resources:${NC}"
echo -e "  Issues:    ${#CREATED_ISSUES[@]}"
echo -e "  Documents: 3 (Spec, Meeting Notes, Implementation)"
echo -e "  Labels:    3 (demo-ai, demo-backend, demo-frontend)"
echo ""
echo -e "${CYAN}View your project:${NC}"
echo "  $PROJECT_URL"
echo ""
echo -e "${CYAN}List project issues:${NC}"
echo "  linear issue list --project \"$PROJECT_ID\""
echo ""
echo -e "${CYAN}List project documents:${NC}"
echo "  linear document list --project \"$PROJECT_ID\""
echo ""
echo -e "${CYAN}Start working on an issue:${NC}"
echo "  linear issue start ${CREATED_ISSUES[0]}"
echo "  ${YELLOW}(This will create a git branch and update the issue status)${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} This is a demo project. Feel free to modify or delete it."
echo ""

# Create a summary JSON file
SUMMARY_FILE="project-summary-$(date +%Y%m%d-%H%M%S).json"
cat > "$SUMMARY_FILE" <<EOF
{
  "project": {
    "id": "$PROJECT_ID",
    "name": "$PROJECT_NAME",
    "url": "$PROJECT_URL",
    "team": "$LINEAR_TEAM_ID"
  },
  "issues": $(printf '%s\n' "${CREATED_ISSUES[@]}" | jq -R . | jq -s .),
  "documents": [
    $([ ! -z "$DOC_ID" ] && echo "\"$DOC_ID\"" || echo ""),
    $([ ! -z "$MEETING_DOC_ID" ] && echo "\"$MEETING_DOC_ID\"" || echo ""),
    $([ ! -z "$IMPL_DOC_ID" ] && echo "\"$IMPL_DOC_ID\"" || echo "")
  ],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✓${NC} Summary saved to: $SUMMARY_FILE"
echo ""
