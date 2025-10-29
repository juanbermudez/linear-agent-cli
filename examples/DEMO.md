# Linear CLI Demo

A comprehensive demonstration of the Linear CLI for AI Agents.

This guide shows how to use the Linear CLI with any workspace and team. Configure your workspace and team using environment variables or a configuration file.

---

## Prerequisites

1. **Install the CLI**:
```bash
curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
```

2. **Get Your Linear API Key**:
   - Go to https://linear.app/settings/api
   - Click "Create key"
   - Copy the key (starts with `lin_api_`)

3. **Verify Installation**:
```bash
linear --version
```

---

## Part 1: Configuration Setup

### Option A: Environment Variables (Recommended for AI Agents)

```bash
# Set up your environment (add to ~/.zshrc or ~/.bashrc)
export LINEAR_API_KEY="lin_api_YOUR_KEY_HERE"
export LINEAR_WORKSPACE="your-workspace"
export LINEAR_TEAM_ID="YOUR-TEAM"
export LINEAR_CACHE_ENABLED="true"
export LINEAR_AUTO_BRANCH="true"

# Reload shell
source ~/.zshrc  # or ~/.bashrc
```

### Option B: Configuration File (Per-Project)

Create `.linear.toml` in your project directory:

```toml
[auth]
token = "lin_api_YOUR_KEY_HERE"

[defaults]
workspace = "your-workspace"
team_id = "YOUR-TEAM"

[vcs]
autoBranch = true  # Auto-create git branches

[cache]
enabled = true     # Enable 24h caching

[interactive]
enabled = true

[output]
format = "text"    # or "json" for AI agents
```

### Verify Configuration

```bash
# Test connection
linear team list

# Should show your configured team
```

---

## Part 2: Workflow & Status Management

### Cache Workflows (Issue States)

```bash
# Fetch and cache all workflow states for your team
linear workflow cache

# List workflow states (uses cache)
linear workflow list

# Output:
# Type         Name            Position  ID
# ● triage     Triage          0         state-id-1
# ● backlog    Backlog         1         state-id-2
# ● unstarted  Todo            2         state-id-3
# ● started    In Progress     3         state-id-4
# ✓ completed  Done            4         state-id-5
# ✗ canceled   Canceled        5         state-id-6

# Get as JSON for automation
linear workflow list --json > workflows.json
```

### Cache Project Statuses

```bash
# Fetch and cache project statuses
linear status cache

# List all project statuses (uses cache)
linear status list

# JSON output for automation
linear status list --json > project-statuses.json
```

---

## Part 3: Create a Demo Project

### Scenario: Building an AI Investment Analysis Tool

```bash
# Create project with document
linear project create \
  --name "AI Investment Analysis Tool" \
  --description "Build an AI-powered tool to analyze investment opportunities" \
  --team DIV \
  --status "In Progress" \
  --with-doc \
  --doc-title "Technical Specification"

# Output (JSON):
# {
#   "project": {
#     "id": "...",
#     "name": "AI Investment Analysis Tool",
#     "url": "https://linear.app/your-workspace/project/..."
#   },
#   "document": {
#     "id": "...",
#     "title": "Technical Specification"
#   }
# }

# Save project ID for later
PROJECT_ID="<id-from-output>"
```

---

## Part 4: Create Issues with Different Methods

### Method 1: Standard Issue Creation

```bash
# Create issue
linear issue create \
  --title "Set up OpenAI API integration" \
  --description "Configure OpenAI GPT-4 for investment analysis" \
  --team DIV \
  --project "$PROJECT_ID" \
  --priority 1 \
  --label "backend,ai"

# Output shows: TEAM-XXX
ISSUE_ID="TEAM-123"  # Use actual ID from output
```

### Method 2: Using Issue Identifier

```bash
# View issue by ID
linear issue view TEAM-123

# Or by URL (flexible resource identification!)
linear issue view https://linear.app/your-workspace/issue/TEAM-123/...
```

### Method 3: VCS-Aware Issue Start

```bash
# Start working on an issue (creates git branch + updates status)
linear issue start TEAM-123

# This will:
# 1. Create git branch: TEAM-123-set-up-openai-api-integration
# 2. Update issue status to "In Progress"

# Disable auto-branching if needed
export LINEAR_AUTO_BRANCH=false
linear issue start TEAM-124  # Won't create branch
```

---

## Part 5: Cross-Entity Operations

### Create Related Documents

```bash
# Create implementation notes (VCS-aware!)
git checkout TEAM-123-set-up-openai-api-integration

linear document create \
  --current-project \
  --title "OpenAI Integration Implementation Notes" \
  --content "## API Setup\n- Endpoint: https://api.openai.com/v1/\n- Model: gpt-4"

# Create meeting notes
linear document create \
  --project "$PROJECT_ID" \
  --title "Weekly Sync - Investment Tool" \
  --content "## Attendees\n- Team\n\n## Notes\n- Progress update"
```

### Link Issues to Projects

```bash
# Create multiple related issues
for task in "Design database schema" "Implement data fetching" "Build analysis engine" "Create UI dashboard"; do
  linear issue create \
    --title "$task" \
    --team DIV \
    --project "$PROJECT_ID" \
    --json
done
```

---

## Part 6: Labels & Organization

```bash
# Create labels for organization
linear label create --name "ai" --color "#9B59B6"linear label create --name "backend" --color "#3498DB"linear label create --name "frontend" --color "#E74C3C"linear label create --name "urgent" --color "#E67E22"
# List all labels (cached)
linear label list --team DIV --json
```

---

## Part 7: AI Agent Automation Examples

### Example 1: Daily Standup Report Generator

```bash
#!/bin/bash
# standup-report.sh

echo "🤖 Generating Daily Standup Report..."

# Get all in-progress issues
ISSUES=$(linear issue list \
  --team DIV \
  --status "In Progress" \
  --json)

# Parse and format
echo "$ISSUES" | jq -r '.issues[] | "- [\(.identifier)] \(.title) (@\(.assignee.displayName))"'

echo ""
echo "✅ Issues completed yesterday:"
linear issue list --team DIV --status "Done" --json | \
  jq -r '.issues[0:5][] | "- [\(.identifier)] \(.title)"'
```

### Example 2: Project Status Dashboard

```bash
#!/bin/bash
# project-dashboard.sh

PROJECT_ID="$1"

echo "📊 Project Dashboard"
echo "===================="

# Get project details
PROJECT=$(linear project view "$PROJECT_ID" --json)
echo "Project: $(echo $PROJECT | jq -r '.project.name')"
echo "Status: $(echo $PROJECT | jq -r '.project.status.name')"
echo ""

# Get issue counts by status
echo "Issue Breakdown:"
linear issue list --project "$PROJECT_ID" --json | \
  jq -r '.issues | group_by(.state.name) | .[] | "\(.[0].state.name): \(length)"'
```

### Example 3: Auto-Label Based on Content

```bash
#!/bin/bash
# auto-label.sh

ISSUE_ID="$1"

# Get issue details
ISSUE=$(linear issue view "$ISSUE_ID" --json)
TITLE=$(echo "$ISSUE" | jq -r '.issue.title')
DESC=$(echo "$ISSUE" | jq -r '.issue.description')

# Smart labeling based on content
if [[ "$TITLE $DESC" =~ "API"|"backend"|"database" ]]; then
  linear issue update "$ISSUE_ID" --label "backend"
fi

if [[ "$TITLE $DESC" =~ "UI"|"frontend"|"design" ]]; then
  linear issue update "$ISSUE_ID" --label "frontend"
fi

if [[ "$TITLE $DESC" =~ "AI"|"ML"|"GPT"|"OpenAI" ]]; then
  linear issue update "$ISSUE_ID" --label "ai"
fi

echo "✅ Auto-labeled issue $ISSUE_ID"
```

### Example 4: Cache Warm-up Script

```bash
#!/bin/bash
# cache-warmup.sh

echo "🔥 Warming up caches..."

# Cache workflows
linear workflow cacheecho "✅ Workflows cached"

# Cache statuses
linear status cache
echo "✅ Project statuses cached"

# Cache labels
linear label list --team DIV > /dev/null
echo "✅ Labels cached"

echo "🎉 All caches warmed up!"
```

---

## Part 8: Complete Workflow Example

### Scenario: AI Agent Creates Feature from Spec

```bash
#!/bin/bash
# create-feature.sh

# 1. Parse feature spec from input
FEATURE_NAME="$1"
DESCRIPTION="$2"

echo "🤖 Creating feature: $FEATURE_NAME"

# 2. Create project
PROJECT=$(linear project create \
  --name "$FEATURE_NAME" \
  --description "$DESCRIPTION" \
  --team DIV \
  --with-doc \
  --doc-title "Technical Spec - $FEATURE_NAME" \
  --json)

PROJECT_ID=$(echo "$PROJECT" | jq -r '.project.id')
DOC_ID=$(echo "$PROJECT" | jq -r '.document.id')

echo "✅ Project created: $PROJECT_ID"

# 3. Break down into tasks
TASKS=(
  "Research and design:high:ai,research"
  "Implement backend:high:backend,ai"
  "Create frontend UI:medium:frontend"
  "Write tests:medium:testing"
  "Documentation:low:docs"
)

echo "📝 Creating tasks..."
for task in "${TASKS[@]}"; do
  IFS=':' read -r title priority labels <<< "$task"

  ISSUE=$(linear issue create \
    --title "$title" \
    --team DIV \
    --project "$PROJECT_ID" \
    --priority "$priority" \
    --label "$labels" \
    --json)

  ISSUE_ID=$(echo "$ISSUE" | jq -r '.issue.identifier')
  echo "  ✅ Created $ISSUE_ID: $title"
done

# 4. Update technical spec document
linear document edit "$DOC_ID" \
  --content "## Overview\n$DESCRIPTION\n\n## Architecture\nTBD\n\n## Tasks\nSee project board"

echo "🎉 Feature setup complete!"
echo "🔗 View project: https://linear.app/your-workspace/project/$PROJECT_ID"
```

Usage:
```bash
chmod +x create-feature.sh
./create-feature.sh "Portfolio Tracker" "Build a real-time portfolio tracking system"
```

---

## Part 9: Resource Identifier Flexibility

The CLI accepts multiple formats for identifying resources:

### Issues
```bash
# By identifier
linear issue view TEAM-123

# By URL
linear issue view https://linear.app/your-workspace/issue/TEAM-123/title

# By title search (fuzzy)
linear issue view "OpenAI integration"  # Searches and matches
```

### Projects
```bash
# By UUID
linear project view 550e8400-e29b-41d4-a716-446655440000

# By URL
linear project view https://linear.app/your-workspace/project/uuid/name

# By name search
linear project view "AI Investment Tool"  # Searches
```

### Documents
```bash
# By UUID
linear document view a1b2c3d4-e5f6-7890-abcd-ef1234567890

# By URL
linear document view https://linear.app/your-workspace/document/uuid/title

# By title search
linear document view "Technical Spec"  # Searches
```

---

## Part 10: Testing the Implementation

### Test Configuration Precedence

```bash
# Test env var priority
export LINEAR_TEAM_ID="TEST"
linear config get team_id  # Shows: TEST

# CLI arg overrides env var
linear team list --team DIV  # Uses DIV, not TEST
```

### Test Caching

```bash
# Clear cache to start fresh
rm -rf ~/.cache/linear-cli/

# First call - fetches from API (slower)
time linear workflow list
# Second call - uses cache (faster)
time linear workflow list
# Force refresh
linear workflow list --team DIV --refresh
```

### Test Auto-Branching

```bash
# Enable auto-branching
export LINEAR_AUTO_BRANCH=true

# Start issue
linear issue start TEAM-123
# ✅ Creates git branch: TEAM-123-issue-title
# ✅ Updates issue status to "In Progress"

# Disable auto-branching
export LINEAR_AUTO_BRANCH=false

# Start another issue
linear issue start TEAM-124
# ✅ Updates issue status to "In Progress"
# ❌ Does NOT create git branch
```

---

## Part 11: JSON Output for AI Agents

All commands support `--json` for programmatic use:

```bash
# Get all issues as JSON
linear issue list --team DIV --json | jq '.'

# Get specific fields
linear issue list --team DIV --json | \
  jq -r '.issues[] | "\(.identifier): \(.title) [@\(.assignee.displayName)]"'

# Get project with full details
linear project view "$PROJECT_ID" --json | \
  jq '{
    name: .project.name,
    status: .project.status.name,
    issues: .project.issues.nodes | length
  }'

# Get workflows for status updates
linear workflow list --team DIV --json | \
  jq -r '.workflowStates[] | select(.type=="started") | .id'
```

---

## Part 12: Real-World Use Cases

### Use Case 1: Sprint Planning

```bash
# 1. List all backlog issues
linear issue list --team DIV --status Backlog --json > backlog.json

# 2. Create sprint project
SPRINT=$(linear project create \
  --name "Sprint 23 - Q1 2024" \
  --team DIV \
  --json)

SPRINT_ID=$(echo "$SPRINT" | jq -r '.project.id')

# 3. Move top priority issues to sprint
cat backlog.json | jq -r '.issues[0:10][] | .id' | while read ISSUE_ID; do
  linear issue update "$ISSUE_ID" --project "$SPRINT_ID"
  echo "Added issue to sprint"
done
```

### Use Case 2: Release Notes Generation

```bash
# Get all completed issues since last release
linear issue list \
  --team DIV \
  --status Done \
  --json | \
  jq -r '.issues[] | "- \(.title) (\(.identifier))"' > RELEASE_NOTES.md
```

### Use Case 3: Automated Triage

```bash
# Get all untriaged issues
UNTRIAGED=$(linear issue list --team DIV --status Triage --json)

# Auto-assign based on labels
echo "$UNTRIAGED" | jq -r '.issues[] | .id' | while read ISSUE_ID; do
  # Assign to backend team if has backend label
  linear issue update "$ISSUE_ID" --assignee "backend-lead@company.com"
done
```

---

## Troubleshooting

### API Key Issues
```bash
# Verify API key is set
echo $LINEAR_API_KEY

# Test connection
linear team list
```

### Cache Issues
```bash
# Clear all cache
rm -rf ~/.cache/linear-cli/

# Disable cache temporarily
export LINEAR_CACHE_ENABLED=false
linear workflow list```

### Permission Issues
```bash
# Verify deno permissions
which linear
# Should show: /Users/yourname/.deno/bin/linear
```

---

## Next Steps

1. **Explore Commands**: Run `linear --help` to see all available commands
2. **Read Documentation**: Check out the [AI Agent Guide](../docs/AI_AGENT_GUIDE.md)
3. **Build Automation**: Use the scripts above as templates
4. **Integrate with CI/CD**: Add Linear updates to your deployment pipeline

---

## Resources

- **Repository**: https://github.com/juanbermudez/linear-agent-cli
- **Linear API Docs**: https://developers.linear.app/docs
- **Your Workspace**: https://linear.app/your-workspace/team/DIV/all

---

**Made for AI Agents** 🤖 | **Divergent Ventures Demo** 🚀
