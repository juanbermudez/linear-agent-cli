# Linear CLI Agent Guide for Claude & Claude Code

This document provides comprehensive guidance for Claude and Claude Code agents on effectively using the Linear CLI to manage issues, projects, documents, and other Linear resources.

## 🎯 Overview

The Linear CLI is a comprehensive command-line tool designed specifically for AI agents. It provides:

- **JSON output by default** - No flags needed! Use `--human` for readable format
- **Complete CRUD operations** for all Linear resources
- **Rich metadata support** including relationships, milestones, cycles, and label groups
- **VCS integration** for context-aware operations
- **Cross-entity operations** for complex workflows

## 📋 Core Principles for Agents

### 1. JSON is the Default Output

JSON output is automatic - no flags needed:

```bash
# ✅ Good - JSON by default (pipe to jq)
linear issue list | jq '.issues[].title'

# ✅ Also fine - Use --human for readable output
linear issue list --human
```

### 2. Check Command Success

Parse JSON responses to verify success (JSON is default):

```typescript
const result = JSON.parse(
  await exec('linear issue create --title "Task"'),
)
if (!result.success) {
  console.error(`Error: ${result.error.message}`)
  // Handle error
}
```

### 3. Use Specific Options Over Interactive Mode

Always provide all required options to avoid interactive prompts:

```bash
# ✅ Good - Non-interactive (JSON is default)
linear issue create \
  --title "Fix bug" \
  --team ENG \
  --priority 1

# ❌ Avoid - Will prompt for input
linear issue create
```

### 4. Leverage VCS Context

The CLI automatically detects issue context from git branches:

```bash
# If on branch: feature/ENG-123-new-feature
linear issue view        # Shows ENG-123 automatically
linear issue update --state "In Progress"  # Updates ENG-123
```

## 🔧 Command Reference

### Issue Management

#### Creating Issues

**All Available Options:**

```bash
linear issue create \
  --title "Task title" \
  --description "$(cat description.md)" \
  --team ENG \
  --assignee @me \
  --priority 1 \
  --estimate 5 \
  --label backend feature \
  --project "API Redesign" \
  --milestone "Phase 1" \
  --cycle "Sprint 5" \
  --parent ENG-100 \
  --state "In Progress" \
  --due-date 2025-12-31 \
  --blocks ENG-101 ENG-102 \
  --related-to ENG-103 \
  --duplicate-of ENG-104 \
  --similar-to ENG-105 \
```

**Common Patterns:**

```bash
# Quick bug report
linear issue create \
  --title "Login button not working" \
  --priority 1 \
  --label bug \
  --assignee @me \
  --team ENG \
  

# Feature with full metadata
linear issue create \
  --title "Add OAuth support" \
  --description "$(cat spec.md)" \
  --project "Auth System" \
  --milestone "Phase 1" \
  --estimate 8 \
  --label backend feature \
  --blocks ENG-100 \
  --team ENG \
  

# Sub-task
linear issue create \
  --title "Write tests" \
  --parent ENG-123 \
  --assignee @me \
  --estimate 3 \
  --team ENG \
```

#### Updating Issues

```bash
linear issue update ENG-123 \
  --title "New title" \
  --description "$(cat updated.md)" \
  --assignee john \
  --priority 2 \
  --estimate 3 \
  --label feature frontend \
  --milestone "Phase 2" \
  --cycle "Sprint 6" \
  --state "Done" \
  --blocks ENG-124 \
  --related-to ENG-125 \
```

#### Viewing Issues

```bash
# View specific issue
linear issue view ENG-123

# View current issue (from git context)
linear issue view

# List issues
linear issue list
linear issue list --team ENG
```

#### Searching Issues

```bash
# Search issues by keyword (JSON is default)
linear issue search "authentication bug"

# Search with filters
linear issue search "API" --limit 100
linear issue search "deprecated" --include-archived
linear issue search "review needed" --include-comments

# Boost results from specific team
linear issue search "mobile" --team TEAM-UUID

# Human-readable output
linear issue search "login" --human
```

#### Issue Relationships

```bash
# Create relationships
linear issue relate ENG-123 ENG-124 --blocks
linear issue relate ENG-123 ENG-125 --related-to
linear issue relate ENG-123 ENG-126 --duplicate-of

# Remove relationship
linear issue unrelate ENG-123 ENG-124

# View all relationships
linear issue relations ENG-123
```

#### Issue Comments

**List Comments:**

```bash
# List comments for specific issue (JSON by default)
linear issue comment list ENG-123

# List comments for current issue (from git context)
linear issue comment list

# Human-readable output
linear issue comment list ENG-123 --human

# Limit number of comments
linear issue comment list ENG-123 --limit 10
```

**Create Comments:**

```bash
# Simple comment
linear issue comment create ENG-123 --body "This looks good to merge"

# Comment on current issue (from git context)
linear issue comment create --body "Fixed in latest commit"

# Multi-line comment from file
linear issue comment create ENG-123 --body-from-file comment.md

# Multi-line comment from stdin
echo "Ready for review" | linear issue comment create ENG-123 --body-from-file -
```

**Common Use Cases:**

```bash
# Status update with context
linear issue comment create ENG-123 --body "Completed initial implementation. Tests passing locally, ready for code review."

# Request review with mention
linear issue comment create ENG-123 --body "@alice Could you review the authentication changes when you get a chance?"

# Document decision
cat > decision.md << 'EOF'
## Decision: Use PostgreSQL for User Data

### Context
We need a reliable database for user authentication and profiles.

### Options Considered
1. MongoDB - Document flexibility
2. PostgreSQL - ACID compliance
3. DynamoDB - Serverless scaling

### Decision
Going with PostgreSQL for strong consistency and relational data integrity.
EOF

linear issue comment create ENG-123 --body-from-file decision.md

# Parse and analyze comments (JSON is default)
RESULT=$(linear issue comment list ENG-123)
MENTIONS=$(echo "$RESULT" | jq '.comments[] | select(.body | contains("@"))')
ACTION_ITEMS=$(echo "$RESULT" | jq '.comments[] | select(.body | contains("TODO:"))')
```

#### Issue Attachments

**List Attachments:**

```bash
# List attachments for specific issue (JSON by default)
linear issue attachment list ENG-123

# List attachments for current issue (from git context)
linear issue attachment list

# Human-readable output
linear issue attachment list ENG-123 --human
```

**Common Use Cases:**

```bash
# Find screenshots in bug reports (JSON is default)
RESULT=$(linear issue attachment list ENG-123)
SCREENSHOTS=$(echo "$RESULT" | jq '.attachments[] | select(.title | test("screenshot|Screenshot") or .url | test("\\.png|\\.jpg"))')

# Get GitHub PR links
PR_LINKS=$(echo "$RESULT" | jq '.attachments[] | select(.sourceType == "github" and (.url | contains("/pull/")))')

# Get Figma design links
FIGMA_LINKS=$(echo "$RESULT" | jq '.attachments[] | select(.url | contains("figma.com"))')

# Extract all uploaded images for analysis
IMAGE_URLS=$(echo "$RESULT" | jq -r '.attachments[] | select(.sourceType == "upload") | .url')

# Use with vision APIs to analyze screenshots
for url in $IMAGE_URLS; do
  echo "Analyzing: $url"
  # Send to vision API for text extraction, UI element identification, etc.
done
```

### Project Management

#### Creating Projects

```bash
linear project create \
  --name "API Redesign" \
  --description "Modernize API with GraphQL" \
  --content "$(cat overview.md)" \
  --team ENG \
  --lead @me \
  --color "#6366F1" \
  --start-date 2026-01-01 \
  --target-date 2026-09-30 \
  --priority 1 \
  --status "In Progress" \
```

**Key Points:**

- `--description`: Short summary (max 255 chars)
- `--content`: Full markdown content (large body)
- `--lead`: Use `@me` for yourself or username/email
- `--color`: Hex format `#RRGGBB`

#### Searching Projects

```bash
# Search projects by keyword
linear project search "mobile app"

# Search with filters
linear project search "API" --limit 50
linear project search "deprecated" --include-archived
linear project search "review" --include-comments

# Human-readable output
linear project search "infrastructure" --human
```

#### Updating Projects

```bash
linear project update PROJECT-ID \
  --name "New Name" \
  --content "$(cat updated.md)" \
  --lead sarah \
  --priority 1 \
  --status "In Progress" \
```

#### Project Milestones

```bash
# Get project UUID first (milestones require UUID not slug)
PROJECT_UUID=$(linear project view PROJECT-SLUG  | jq -r '.project.id')

# Create milestone
linear project milestone create $PROJECT_UUID \
  --name "Phase 1: Foundation" \
  --description "Core infrastructure" \
  --target-date 2026-03-31 \
  

# List milestones
linear project milestone list --project PROJECT-SLUG
```

#### Project Status Updates

```bash
linear project update-create PROJECT-SLUG \
  --body "$(cat status-update.md)" \
  --health onTrack \
  

# Health options: onTrack | atRisk | offTrack
```

### Label Management

#### Creating Labels

```bash
# Simple label
linear label create \
  --name "bug" \
  --color "#FF0000" \
  --team ENG \
  

# Label group (parent)
linear label create \
  --name "Priority" \
  --color "#F59E0B" \
  --team ENG \
  --is-group \
  

# Sub-label (child)
linear label create \
  --name "Critical" \
  --color "#EF4444" \
  --team ENG \
  --parent "Priority" \
```

**Important**: Parent labels MUST be created with `--is-group` before creating children.

**Usage on Issues:**

```bash
# Labels display as "parent/child"
linear issue create \
  --title "Fix bug" \
  --label Critical \
  --team ENG \
  
# Result shows: Labels: Priority/Critical
```

### Initiative Management

```bash
# Create initiative
linear initiative create \
  --name "Q1 2025 Goals" \
  --description "Key objectives" \
  --content "$(cat initiative.md)" \
  --owner @me \
  

# Update initiative
linear initiative update "Q1 Goals" \
  --content "$(cat updated.md)" \
  

# List initiatives
linear initiative list --status active
```

### Document Management

```bash
# Create document
linear document create \
  --title "Technical Spec" \
  --content "$(cat spec.md)" \
  --project "API Redesign" \
  

# VCS-aware: Create for current project
linear document create \
  --current-project \
  --title "Implementation Notes" \
  --content "$(cat notes.md)" \
  

# Update document
linear document update "Tech Spec" \
  --content "$(cat updated.md)"


# List documents
linear document list --project "API Redesign"

# Search documents
linear document search "technical spec"
linear document search "API" --limit 50
linear document search "old design" --include-archived
linear document search "feedback" --include-comments
```

### Workflow & Status Management

```bash
# List workflow states for team
linear workflow list --team ENG 

# Cache workflow states (24h cache)
linear workflow cache --team ENG

# List project statuses
linear status list
```

### User Management

```bash
# List users
linear user list 

# Search for user
linear user search "john" 

# List active admins
linear user list --active-only --admins-only
```

## 🎨 Content Formatting

### Markdown Support

Linear supports rich markdown with cross-references:

```markdown
# Technical Specification

## Overview

This feature implements OAuth 2.0 authentication.

## Dependencies

- Depends on: [ENG-100](https://linear.app/workspace/issue/ENG-100)
- Part of: [Auth Project](https://linear.app/workspace/project/auth-abc)

## Implementation

\`\`\`typescript // Code example \`\`\`

## Checklist

- [ ] Task 1
- [ ] Task 2

## Diagrams

\`\`\`mermaid graph TB A --> B \`\`\`
```

### Cross-Reference Format

**All cross-references require markdown links with full URLs:**

| Resource  | Format         | Example                                                 |
| --------- | -------------- | ------------------------------------------------------- |
| Issues    | `[ID](url)`    | `[ENG-123](https://linear.app/workspace/issue/ENG-123)` |
| Projects  | `[Name](url)`  | `[Project](https://linear.app/workspace/project/slug)`  |
| Documents | `[Title](url)` | `[Spec](https://linear.app/workspace/document/id)`      |
| Users     | `@username`    | `@john` or `@alice` (username only, not display name)   |

**What doesn't work:**

- ❌ Plain identifiers: `ENG-123`
- ❌ Hash symbol: `#ENG-123`
- ❌ At symbol for issues: `@ENG-123`

### Content Fields

| Resource   | Field       | Limit     |
| ---------- | ----------- | --------- |
| Project    | description | 255 chars |
| Project    | content     | ~200KB    |
| Issue      | description | ~200KB    |
| Initiative | content     | ~200KB    |
| Document   | content     | ~200KB    |

## 🔄 Common Workflows

### Workflow 1: Create Issue with Full Context

```bash
# Read specification from file
SPEC=$(cat spec.md)

# Create issue with all metadata
ISSUE_JSON=$(linear issue create \
  --title "Implement OAuth 2.0" \
  --description "$SPEC" \
  --team ENG \
  --project "Auth System" \
  --milestone "Phase 1" \
  --cycle "Sprint 5" \
  --priority 1 \
  --estimate 8 \
  --label backend security \
  --assignee @me \
  --blocks ENG-100 ENG-101 \
  )

# Extract issue ID
ISSUE_ID=$(echo "$ISSUE_JSON" | jq -r '.issue.identifier')

# Start working
linear issue start $ISSUE_ID
```

### Workflow 2: Project with Milestones and Issues

```bash
# 1. Create project
PROJECT_JSON=$(linear project create \
  --name "Mobile App" \
  --description "iOS and Android applications" \
  --content "$(cat project-spec.md)" \
  --team MOBILE \
  --lead @me \
  --priority 1 \
  --start-date 2026-01-01 \
  --target-date 2026-06-30 \
  )

PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.project.id')
PROJECT_SLUG=$(echo "$PROJECT_JSON" | jq -r '.project.slug')

# 2. Create milestones
linear project milestone create $PROJECT_ID \
  --name "Phase 1: Core Features" \
  --target-date 2026-03-31 \
  

# 3. Create issues linked to project and milestone
linear issue create \
  --title "Setup authentication" \
  --team MOBILE \
  --project "$PROJECT_SLUG" \
  --milestone "Phase 1: Core Features" \
  --priority 1 \
  --assignee @me \
  

# 4. Add status update
linear project update-create $PROJECT_SLUG \
  --body "Week 1: Project kicked off successfully" \
  --health onTrack \
```

### Workflow 3: Label Hierarchy for Organization

```bash
# 1. Create label groups
linear label create --name "Work-Type" --is-group --team ENG 
linear label create --name "Scope" --is-group --team ENG 

# 2. Create sub-labels
linear label create --name "Bugfix" --parent "Work-Type" --team ENG 
linear label create --name "New-Feature" --parent "Work-Type" --team ENG 
linear label create --name "Backend" --parent "Scope" --team ENG 
linear label create --name "Frontend" --parent "Scope" --team ENG 

# 3. Use on issues (displays as "parent/child")
linear issue create \
  --title "Fix API bug" \
  --label Bugfix Backend \
  --team ENG \
  
# Result: Labels show as "Work-Type/Bugfix, Scope/Backend"
```

### Workflow 4: Issue Relationships for Dependencies

```bash
# Create parent issue
PARENT=$(linear issue create \
  --title "Database migration" \
  --team ENG \
  --priority 1 \
   | jq -r '.issue.identifier')

# Create dependent issues with relationships
linear issue create \
  --title "Update API layer" \
  --team ENG \
  --parent $PARENT \
  --blocks ENG-200 ENG-201 \
  

# View all relationships
linear issue relations $PARENT
```

## ⚠️ Error Handling

### Common Error Patterns

```typescript
// Parse and check for errors
try {
  const result = JSON.parse(
    await exec('linear issue create --title "Task" '),
  )

  if (!result.success) {
    switch (result.error.code) {
      case "MISSING_REQUIRED_FIELD":
        // Handle validation error
        break
      case "NOT_FOUND":
        // Resource not found
        break
      case "API_ERROR":
        // Linear API error
        break
      default:
        // Unknown error
    }
  }
} catch (e) {
  // Command execution failed
}
```

### Important Notes

1. **User References**: Use `@me` for yourself, not `self`
2. **Labels**: Space-separated, not repeated flags: `--label A B` not `--label A --label B`
3. **Milestones**: Require project UUID, not slug (use `| jq -r '.project.id'`)
4. **Label Groups**: Parent must be created with `--is-group` before children
5. **Project UUID vs Slug**: Most commands accept slug, but milestones and updates need UUID

## 📊 JSON Response Formats

### Issue Create/Update Response

```json
{
  "success": true,
  "operation": "create",
  "issue": {
    "id": "uuid",
    "identifier": "ENG-123",
    "title": "Task title",
    "url": "https://linear.app/...",
    "state": { "name": "Todo" },
    "team": { "key": "ENG" },
    "assignee": { "name": "John" },
    "priority": 1,
    "estimate": 5
  }
}
```

### Issue Comment Response

```json
{
  "success": true,
  "comments": [
    {
      "id": "uuid",
      "body": "This looks good to merge",
      "createdAt": "2025-11-02T10:00:00.000Z",
      "updatedAt": "2025-11-02T10:00:00.000Z",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "displayName": "John",
        "email": "john@example.com"
      },
      "issue": {
        "id": "uuid",
        "identifier": "ENG-123"
      }
    }
  ]
}
```

### Issue Attachment Response

```json
{
  "success": true,
  "attachments": [
    {
      "id": "uuid",
      "title": "Screenshot 2025-11-02",
      "subtitle": "Bug report screenshot",
      "url": "https://linear.app/attachments/...",
      "sourceType": "upload",
      "metadata": {
        "size": 123456,
        "contentType": "image/png"
      },
      "createdAt": "2025-11-02T10:00:00.000Z",
      "creator": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": "uuid",
      "title": "Fix login bug",
      "subtitle": "Pull Request #123",
      "url": "https://github.com/org/repo/pull/123",
      "sourceType": "github",
      "createdAt": "2025-11-02T11:00:00.000Z"
    }
  ]
}
```

### Issue View Response

```json
{
  "issue": {
    "identifier": "ENG-123",
    "title": "Task title",
    "description": "...",
    "state": { "name": "In Progress" },
    "team": { "key": "ENG", "name": "Engineering" },
    "assignee": { "name": "John", "email": "john@example.com" },
    "priority": 1,
    "estimate": 5,
    "dueDate": "2025-12-31",
    "project": { "name": "API Redesign" },
    "milestone": { "name": "Phase 1", "targetDate": "2026-03-31" },
    "parent": { "identifier": "ENG-100" },
    "children": [{ "identifier": "ENG-124" }],
    "relations": {
      "nodes": [
        { "type": "blocks", "issue": { "identifier": "ENG-125" } }
      ]
    },
    "inverseRelations": {
      "nodes": [
        { "type": "blocks", "issue": { "identifier": "ENG-122" } }
      ]
    },
    "labels": {
      "nodes": [
        { "name": "Bugfix", "parent": { "name": "Work-Type" } }
      ]
    }
  }
}
```

## 🎯 Best Practices for Agents

### 1. Plan Before Executing

```bash
# Get context first
TEAM=$(linear whoami  | jq -r '.configuration.team_id')
PROJECT=$(linear project list --team $TEAM  | jq -r '.projects[0].slug')

# Then create with full context
linear issue create \
  --title "Task" \
  --team $TEAM \
  --project $PROJECT \
```

### 2. Use Consistent Naming

```bash
# Good: Descriptive, actionable titles
"Fix authentication timeout on mobile"
"Implement OAuth 2.0 provider integration"
"Add caching layer to API endpoints"

# Avoid: Vague or unclear
"Fix bug"
"Update code"
"Changes"
```

### 3. Link Related Work

Always create relationships between related issues:

```bash
# When you discover dependencies
linear issue create \
  --title "Add API tests" \
  --team ENG \
  --blocks ENG-123 \
  

# When working on related features
linear issue update ENG-124 \
  --related-to ENG-123 \
```

### 4. Keep Content in Files

```bash
# ✅ Good: Keep content in files
linear issue create \
  --title "Task" \
  --description "$(cat spec.md)" \
  

# ❌ Avoid: Inline content for long text
linear issue create \
  --title "Task" \
  --description "Very long content..." \
```

### 5. Verify Operations

```bash
# Always check the result
RESULT=$(linear issue create --title "Task" )
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
  echo "Created $ISSUE_ID"
else
  echo "Failed: $(echo "$RESULT" | jq -r '.error.message')"
fi
```

## 🔍 Configuration

### Check Current Configuration

```bash
linear whoami
```

### Set Defaults

```bash
linear config set defaults.team ENG
linear config set defaults.project.status "In Progress"
```

### Get Configuration Values

```bash
linear config get defaults.team
```

## 📚 Additional Resources

- **Full Documentation**: `docs/USAGE.md`
- **AI Agent Guide**: `docs/AI_AGENT_GUIDE.md`
- **Installation**: `docs/INSTALLATION.md`
- **Examples**: `examples/` directory

## 🚨 Critical Reminders

1. **JSON is the default output** - No flags needed! Use `--human` for readable format
2. **Always check `success` field in response**
3. **Use `@me` for self-assignment, not `self`**
4. **Label groups require `--is-group` flag for parent**
5. **Space-separate multiple labels: `--label A B C`**
6. **Milestones need project UUID, not slug**
7. **Cross-references need full URLs in markdown format**
8. **Content fields support rich markdown and cross-refs**
9. **VCS context is automatically detected from git branches**
10. **All relationship types are bidirectional (show outgoing + incoming)**

---

**This CLI is optimized for AI agents.** Use these patterns consistently for best results.
