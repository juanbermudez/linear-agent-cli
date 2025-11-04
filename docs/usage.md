# Usage Guide

This guide covers common usage patterns for the Linear CLI.

## Table of Contents

- [Basic Commands](#basic-commands)
- [Issue Management](#issue-management)
- [Project Management](#project-management)
- [Initiative Management](#initiative-management)
- [Document Management](#document-management)
- [Label Management](#label-management)
- [Configuration](#configuration)
- [VCS Integration](#vcs-integration)
- [AI Agent Mode](#ai-agent-mode)

## Basic Commands

### Getting Help

```bash
# General help
linear --help

# Command-specific help
linear issue --help
linear project create --help
```

### Listing Resources

```bash
linear team list              # List all teams
linear issue list             # List your issues
linear project list           # List all projects
linear initiative list        # List all initiatives
linear document list          # List all documents
linear label list             # List all labels
```

## Issue Management

### Creating Issues

**All Available Options:**

```bash
linear issue create \
  --title "Fix login bug"                # Issue title (required without interactive)
  --description "$(cat description.md)"  # Markdown description
  --assignee @me                         # Assign to yourself (@me) or username
  --priority 1                           # 1=Urgent, 2=High, 3=Normal, 4=Low
  --estimate 5                           # Story points estimate
  --label bug feature                    # Multiple labels (space-separated)
  --team ENG                             # Team key
  --project "API Redesign"               # Project name or ID
  --milestone "Phase 1"                  # Project milestone name
  --cycle "Sprint 5"                     # Cycle/sprint name
  --parent ENG-100                       # Parent issue (for sub-tasks)
  --state "In Progress"                  # Workflow state name or type
  --due-date 2025-12-31                  # Due date (YYYY-MM-DD)
  --blocks ENG-101 ENG-102               # Issues this blocks (space-separated)
  --related-to ENG-103                   # Related issues (space-separated)
  --duplicate-of ENG-104                 # Mark as duplicate of issue
  --similar-to ENG-105                   # Similar to issue
  --start                                # Start working immediately (creates git branch)
                                   # Output as JSON
```

**Common Examples:**

```bash
# Interactive mode (recommended)
linear issue create

# Quick bug report
linear issue create \
  --title "Login button not working" \
  --priority 1 \
  --label bug \
  --assignee self

# Feature with full details and milestone
linear issue create \
  --title "Add OAuth support" \
  --description "$(cat oauth-spec.md)" \
  --project "Auth System" \
  --milestone "Phase 1: Authentication" \
  --cycle "Sprint 5" \
  --estimate 8 \
  --label Backend New-Feature \
  --state "Todo"

# Sub-task of existing issue
linear issue create \
  --title "Write unit tests" \
  --parent ENG-123 \
  --assignee @me \
  --estimate 3

# Create with relationships
linear issue create \
  --title "Implement API endpoint" \
  --team ENG \
  --blocks ENG-100 ENG-101 \
  --related-to ENG-102 \
  --label Backend

# Create and start working
linear issue create \
  --title "Fix memory leak" \
  --start
```

### Updating Issues

**All Available Options:**

```bash
linear issue update ENG-123 \
  --title "New title"                    # Change title
  --description "$(cat new-desc.md)"     # Update description
  --assignee john                        # Reassign to another user
  --priority 2                           # Change priority
  --estimate 3                           # Update estimate
  --label feature frontend               # Replace labels (space-separated)
  --team ENG                             # Move to different team
  --project "Different Project"          # Move to different project
  --milestone "Phase 2"                  # Change milestone
  --cycle "Sprint 6"                     # Change cycle
  --parent ENG-100                       # Change parent issue
  --state "Done"                         # Update workflow state
  --due-date 2025-11-15                  # Change due date
  --blocks ENG-124                       # Add blocking relationships
  --related-to ENG-125                   # Add related relationships
  --duplicate-of ENG-126                 # Mark as duplicate
  --similar-to ENG-127                   # Mark as similar
                                   # Output as JSON
```

**Common Examples:**

```bash
# Update status
linear issue update ENG-123 --state "In Progress"

# Reassign and update priority
linear issue update ENG-123 --assignee john --priority 1

# Update description from file
linear issue update ENG-123 --description "$(cat updated-spec.md)"

# Mark as done
linear issue update ENG-123 --state Done

# Move to different project
linear issue update ENG-123 --project "Infrastructure"
```

### Viewing Issues

```bash
# View specific issue
linear issue view ENG-123

# View current issue (from git branch)
linear issue view

# With comments
linear issue view ENG-123

# Without comments
linear issue view ENG-123 --no-comments

# Open in browser
linear issue view ENG-123 --web

# Open in Linear app
linear issue view ENG-123 --app

# JSON output (for AI agents)
linear issue view ENG-123
```

### Searching Issues

Search issues by keyword across titles and descriptions:

```bash
# Basic search
linear issue search "authentication bug"

# Search with limit
linear issue search "API" --limit 100

# Search including archived issues
linear issue search "deprecated" --include-archived

# Search in comments too
linear issue search "review needed" --include-comments

# Boost results from specific team
linear issue search "mobile" --team "MOBILE-TEAM-ID"

# Human-readable table output
linear issue search "login" --human

# JSON output (default)
linear issue search "payment"
```

**JSON Response:**

```json
{
  "issues": [
    {
      "id": "uuid",
      "identifier": "ENG-123",
      "title": "Fix authentication bug",
      "description": "Users unable to login...",
      "priority": 1,
      "estimate": 5,
      "state": { "name": "In Progress", "type": "started" },
      "team": { "key": "ENG", "name": "Engineering" },
      "assignee": { "name": "John Doe", "displayName": "John" }
    }
  ],
  "totalCount": 42,
  "hasMore": true,
  "query": "authentication",
  "filters": {
    "includeArchived": false,
    "includeComments": false,
    "team": null
  }
}
```

### Working with Issues

```bash
# Start working on an issue (creates git branch)
linear issue start ENG-123

# View current issue
linear issue view

# Close issue
linear issue close ENG-123

# List issues
linear issue list

# Delete issue
linear issue delete ENG-123
```

### Issue Relationships

**Creating Relationships:**

```bash
# Block other issues
linear issue relate ENG-123 ENG-124 --blocks
linear issue relate ENG-123 ENG-125 ENG-126 --blocks  # Multiple issues

# Mark as related
linear issue relate ENG-123 ENG-127 --related-to

# Mark as duplicate
linear issue relate ENG-123 ENG-128 --duplicate-of

# Mark as similar
linear issue relate ENG-123 ENG-129 --similar-to
```

**Removing Relationships:**

```bash
# Remove any type of relationship
linear issue unrelate ENG-123 ENG-124
```

**Viewing Relationships:**

```bash
# List all relationships for an issue
linear issue relations ENG-123

# Shows both:
# - Outgoing: issues this one blocks/relates to
# - Incoming: issues that block/relate to this one
```

**Common Examples:**

```bash
# Create issue that blocks others
linear issue create \
  --title "Database migration" \
  --blocks ENG-100 ENG-101 ENG-102

# Update issue to add relationships
linear issue update ENG-123 \
  --blocks ENG-124 \
  --related-to ENG-125

# View all relationships
linear issue relations ENG-123
# Output shows:
# - Blocks: ENG-124
# - Related: ENG-125
# - Blocked by: ENG-122 (inverse relationship)
```

### Issue Comments

**List Comments:**

```bash
# List comments on specific issue
linear issue comment list ENG-123

# List comments on current issue (from git branch)
linear issue comment list

# JSON output (default)
linear issue comment list ENG-123

# Human-readable table format
linear issue comment list ENG-123 --human

# Limit number of comments
linear issue comment list ENG-123 --limit 10
```

**Create Comments:**

```bash
# Add a comment
linear issue comment create ENG-123 --body "This looks good to merge"

# Add comment to current issue (from git branch)
linear issue comment create --body "Fixed in latest commit"

# Add comment from file
linear issue comment create ENG-123 --body-from-file comment.md

# Add comment from stdin
echo "Ready for review" | linear issue comment create ENG-123 --body-from-file -

# Multi-line comment
linear issue comment create ENG-123 --body "$(cat <<'EOF'
## Testing Results
- Unit tests: ✅
- Integration tests: ✅
- E2E tests: ✅
EOF
)"
```

**Common Examples:**

```bash
# Leave status update
linear issue comment create --body "Blocked waiting for design review"

# Request review
linear issue comment create ENG-123 --body "@alice Please review when you get a chance"

# Document decision
linear issue comment create ENG-123 --body "$(cat decision-doc.md)"

# Quick note
linear issue comment create --body "Fixed typo in title"
```

### Issue Attachments

Attachments in Linear are created using URLs (not direct file uploads). Upload files to a hosting service (GitHub, S3, Imgur, etc.) first, then attach the URL.

**Create Attachment:**

```bash
# Create attachment with URL (required: --title and --url)
linear issue attachment create ENG-123 \
  --title "Screenshot of error" \
  --url "https://example.com/screenshot.png"

# With optional subtitle and icon
linear issue attachment create ENG-123 \
  --title "Design mockup" \
  --url "https://figma.com/file/abc" \
  --subtitle "Final approved design" \
  --icon-url "https://example.com/icon.png"

# Create on current issue (from git branch)
linear issue attachment create \
  --title "Hero Image" \
  --url "https://raw.githubusercontent.com/user/repo/main/assets/hero.png"

# Human-readable output
linear issue attachment create ENG-123 \
  --title "PR Link" \
  --url "https://github.com/org/repo/pull/123" \
  --human
```

**Delete Attachment:**

```bash
# Delete attachment by ID
linear issue attachment delete att-456

# Skip confirmation prompt
linear issue attachment delete att-456 --confirm

# Human-readable output
linear issue attachment delete att-456 --human
```

**List Attachments:**

```bash
# List attachments on specific issue
linear issue attachment list ENG-123

# List attachments on current issue (from git branch)
linear issue attachment list

# JSON output (default)
linear issue attachment list ENG-123

# Human-readable table format
linear issue attachment list ENG-123 --human
```

**JSON Response Example (Create):**

```json
{
  "success": true,
  "operation": "create",
  "attachment": {
    "id": "att-456",
    "title": "Screenshot of error",
    "subtitle": null,
    "url": "https://example.com/screenshot.png",
    "source": null,
    "sourceType": "unknown",
    "createdAt": "2025-01-15T10:30:00Z",
    "issue": {
      "id": "abc-123",
      "identifier": "ENG-123",
      "title": "Fix login bug"
    }
  }
}
```

**JSON Response Example (List):**

```json
{
  "success": true,
  "issue": {
    "id": "abc-123",
    "identifier": "ENG-123",
    "title": "Fix login bug"
  },
  "attachments": [
    {
      "id": "att-456",
      "title": "Screenshot of error",
      "subtitle": null,
      "url": "https://linear.app/attachments/...",
      "createdAt": "2025-01-15T10:30:00Z",
      "creator": {
        "id": "user-789",
        "name": "alice",
        "displayName": "Alice Smith"
      },
      "sourceType": "upload",
      "metadata": {}
    }
  ],
  "count": 1
}
```

**Common Use Cases:**

```bash
# Add GitHub PR as attachment
linear issue attachment create ENG-123 \
  --title "Pull Request #456" \
  --url "https://github.com/org/repo/pull/456"

# Add Figma design
linear issue attachment create ENG-123 \
  --title "UI Design" \
  --url "https://figma.com/file/abc123" \
  --subtitle "Approved by design team"

# Embed images in issue description
linear issue update ENG-123 --description "Bug report

## Screenshot
![Error screenshot](https://example.com/screenshot.png)

The error occurs when clicking the login button."

# Check for screenshots on bug reports
linear issue attachment list ENG-123 | jq '.attachments[] | select(.title | contains("screenshot"))'

# List all attachment URLs
linear issue attachment list ENG-123 | jq '.attachments[].url'

# Delete old attachments
linear issue attachment list ENG-123 | \
  jq -r '.attachments[] | select(.createdAt < "2024-01-01") | .id' | \
  xargs -I {} linear issue attachment delete {} --confirm
```

## Project Management

### Creating Projects

Projects in Linear have **two separate text fields**:

- **description**: Short summary (max 255 characters) - shown in project lists
- **content**: Full project body with rich markdown - shown in project overview

**All Available Options:**

```bash
linear project create \
  --name "Mobile App"                    # Project name (required without interactive)
  --description "iOS and Android apps"   # Short summary (max 255 chars)
  --content "$(cat overview.md)"         # Full project body (rich markdown)
  --team ENG                             # Team key (can repeat for multiple teams)
  --status "In Progress"                 # Project status name or ID
  --lead john                            # Project lead (username or email)
  --icon "📱"                            # Icon emoji
  --color "#4A90E2"                      # Color (hex format: #RRGGBB)
  --start-date 2025-11-01                # Start date (YYYY-MM-DD)
  --target-date 2025-12-31               # Target date (YYYY-MM-DD)
  --priority 2                           # 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --with-doc                             # Create a design document with the project
  --doc-title "Technical Spec"           # Document title (used with --with-doc)
                                   # Output as JSON
```

**Common Examples:**

```bash
# Interactive mode (recommended)
linear project create

# Quick project
linear project create \
  --name "Mobile App" \
  --team MOBILE \
  --lead sarah

# Full project with all details
linear project create \
  --name "API Redesign" \
  --description "Modernize API with GraphQL" \
  --content "$(cat project-overview.md)" \
  --team ENG \
  --status "Planned" \
  --lead john \
  --icon "🚀" \
  --color "#4A90E2" \
  --start-date 2025-11-01 \
  --target-date 2025-12-31 \
  --priority 1 \
  

# Project with multiple teams
linear project create \
  --name "Cross-Team Initiative" \
  --team ENG \
  --team DESIGN \
  --lead john

# Project with design document
linear project create \
  --name "Mobile App" \
  --team MOBILE \
  --with-doc \
  --doc-title "Mobile App Technical Specification"
```

### Example Project Content File

```markdown
# API Redesign Project

## Overview

This project aims to modernize our API infrastructure with GraphQL.

## Goals

- Migrate from REST to GraphQL
- Improve response times by 50%
- Reduce API calls by 30%

## Architecture

\`\`\`mermaid graph TB Client --> Gateway Gateway --> GraphQL GraphQL --> Services \`\`\`

## Timeline

See [Phase 1](https://linear.app/workspace/project/api-redesign/overview#milestone-abc).

## Related Issues

- [ENG-101](https://linear.app/workspace/issue/ENG-101) - GraphQL schema design
- [ENG-102](https://linear.app/workspace/issue/ENG-102) - Migration plan
```

### Searching Projects

Search projects by keyword across names and descriptions:

```bash
# Basic search
linear project search "mobile app"

# Search with limit
linear project search "API" --limit 50

# Search including archived projects
linear project search "deprecated" --include-archived

# Search in comments too
linear project search "review" --include-comments

# Human-readable output
linear project search "infrastructure" --human
```

### Updating Projects

**All Available Options:**

```bash
linear project update PROJECT-123 \
  --name "New Name"                      # Change project name
  --description "New summary"            # Update short description
  --content "$(cat new-overview.md)"     # Update full project body
  --team ENG                             # Change teams (can repeat)
  --status "In Progress"                 # Update project status
  --lead sarah                           # Change project lead
  --icon "🎯"                            # Update icon
  --color "#FF5733"                      # Change color
  --start-date 2025-11-15                # Update start date
  --target-date 2026-01-31               # Update target date
  --priority 1                           # Change priority
                                   # Output as JSON
```

**Common Examples:**

```bash
# Update status
linear project update "API Redesign" --status "In Progress"

# Change lead and priority
linear project update PROJECT-123 --lead john --priority 1

# Update dates
linear project update PROJECT-123 \
  --start-date 2025-11-01 \
  --target-date 2025-12-31

# Update description (max 255 chars)
linear project update PROJECT-123 \
  --description "Modernizing our API infrastructure"

# Move to different team
linear project update PROJECT-123 --team PLATFORM

# Update project content
linear project update PROJECT-123 --content "$(cat updated-overview.md)"
```

### Viewing and Managing Projects

```bash
# List all projects
linear project list

# List projects for specific team
linear project list --team ENG

# View project details
linear project view "API Redesign"
linear project view PROJECT-123

# View as JSON
linear project view PROJECT-123 

# Delete project
linear project delete "API Redesign"

# Restore deleted project
linear project restore PROJECT-123
```

### Project Milestones

```bash
# Create milestone
linear project milestone create \
  --project "API Redesign" \
  --name "Phase 1: Foundation" \
  --target-date 2025-11-30

# List milestones for project
linear project milestone list --project "API Redesign"

# Update milestone
linear project milestone update MILESTONE-ID \
  --name "Phase 1: Updated" \
  --target-date 2025-12-15

# Delete milestone
linear project milestone delete MILESTONE-ID
```

## Initiative Management

### Creating Initiatives

**All Available Options:**

```bash
linear initiative create \
  --name "Q1 2025 Goals"                 # Initiative name (required without interactive)
  --description "Key objectives for Q1"  # Short description
  --content "$(cat initiative-plan.md)"  # Full initiative body (rich markdown)
  --owner @me                            # Initiative owner (username or email)
                                   # Output as JSON
```

**Common Examples:**

```bash
# Interactive mode
linear initiative create

# Quick initiative
linear initiative create \
  --name "Q1 2025 Goals" \
  --description "Key objectives for Q1"

# Full initiative with content
linear initiative create \
  --name "Platform Modernization" \
  --description "Modernize platform infrastructure and tooling" \
  --content "$(cat platform-modernization.md)" \
  --owner @me

# JSON output
linear initiative create \
  --name "Q1 Goals" \
  --content "$(cat q1-goals.md)" \
```

### Working with Initiatives

```bash
# List initiatives
linear initiative list
linear initiative list --status active

# View initiative
linear initiative view "Q1 Goals"

# Update initiative
linear initiative update "Q1 Goals" --status "In Progress"

# Restore deleted initiative
linear initiative restore INIT-123
```

## Document Management

### Creating Documents

```bash
# Interactive mode
linear document create

# With flags
linear document create \
  --title "Technical Specification" \
  --content "$(cat tech-spec.md)"

# Create for specific project
linear document create \
  --title "API Design" \
  --project "API Redesign" \
  --content "$(cat api-design.md)"

# VCS-aware: create for current project
linear document create \
  --current-project \
  --title "Implementation Notes" \
  --content "$(cat notes.md)"

# JSON output
linear document create --title "Notes"
```

### Searching Documents

Search documents by keyword across titles and content:

```bash
# Basic search
linear document search "technical spec"

# Search with limit
linear document search "API" --limit 50

# Search including archived documents
linear document search "old design" --include-archived

# Search in comments too
linear document search "feedback" --include-comments

# Human-readable output
linear document search "implementation" --human
```

### Working with Documents

```bash
# List all documents
linear document list

# List documents for specific project
linear document list --project "API Redesign"

# List documents for current project (VCS-aware)
linear document list --current-project

# View document
linear document view "Technical Specification"

# Update document
linear document update "Tech Spec" \
  --content "$(cat updated-spec.md)"

# Delete document
linear document delete "Old Doc"

# Restore deleted document
linear document restore DOC-123
```

## Label Management

### Creating Labels

**All Available Options:**

```bash
linear label create \
  --name "bug"                           # Label name (required without interactive)
  --description "Bug reports"            # Label description
  --color "#FF0000"                      # Color (hex format: #RRGGBB)
  --team ENG                             # Team key
  --is-group                             # Mark as group (for hierarchical labels)
  --parent "Category"                    # Parent label name (for sub-labels)
                                   # Output as JSON
```

**Common Examples:**

```bash
# Interactive mode
linear label create

# Simple label
linear label create \
  --name "bug" \
  --color "#FF0000" \
  --team ENG

# Create label group (parent)
linear label create \
  --name "Priority" \
  --description "Priority classification" \
  --color "#F59E0B" \
  --team ENG \
  --is-group

# Create sub-label (child)
linear label create \
  --name "Critical" \
  --description "Critical priority issues" \
  --color "#EF4444" \
  --team ENG \
  --parent "Priority"

# JSON output
linear label create \
  --name "feature" \
  --color "#00FF00" \
```

**Label Group Hierarchy:**

```bash
# Step 1: Create parent group
linear label create --name "Work-Type" --is-group --team ENG

# Step 2: Create children
linear label create --name "New-Feature" --parent "Work-Type" --team ENG
linear label create --name "Bugfix" --parent "Work-Type" --team ENG
linear label create --name "Enhancement" --parent "Work-Type" --team ENG

# Step 3: Use on issues
linear issue create --title "Fix bug" --label Bugfix --team ENG

# Result: Label displays as "Work-Type/Bugfix"
```

**Important Notes:**

- Parent labels MUST be created with `--is-group` flag
- Sub-labels reference parent by name using `--parent`
- Label groups display as `parent/child` format
- Team is required when using `--parent` option

````
### Working with Labels

```bash
# List all labels
linear label list

# List labels for specific team
linear label list --team ENG

# Update label properties
linear label update "bug-label-id" --color "#CC0000"
linear label update "bug-label-id" --name "critical-bug" --description "Critical bugs"

# Assign label to parent group (nest under group)
linear label update "frontend-label-id" --parent "scope-group-id"

# Note: Team assignment cannot be changed after creation (Linear API limitation)

# Delete label
linear label delete "old-label"
````

## Content Formatting

### Markdown Support

Linear supports GitHub Flavored Markdown (GFM) with additional features:

**Supported Features:**

- ✅ Headers (H1-H6)
- ✅ Bold, italic, strikethrough
- ✅ Inline code and code blocks with syntax highlighting
- ✅ Lists (ordered, unordered, nested)
- ✅ Tables
- ✅ Blockquotes
- ✅ Horizontal rules
- ✅ Links (internal and external)
- ✅ Interactive checklists
- ✅ Mermaid diagrams

### Mermaid Diagrams

Linear supports various Mermaid diagram types:

```markdown
## Flowchart

\`\`\`mermaid graph TB Start --> Process Process --> Decision{Is it ok?} Decision -->|Yes| End Decision -->|No| Process \`\`\`

## Sequence Diagram

\`\`\`mermaid sequenceDiagram Client->>API: Request API->>Database: Query Database-->>API: Data API-->>Client: Response \`\`\`

## Gantt Chart

\`\`\`mermaid gantt title Project Timeline section Phase 1 Design :a1, 2025-01-01, 30d Development :a2, after a1, 60d \`\`\`
```

### Cross-Reference Syntax

Linear requires **markdown link format with full URLs** for clickable cross-references:

#### Issue References

```markdown
# ✅ Works - Markdown link with full URL

Related to [ENG-123](https://linear.app/workspace/issue/ENG-123/issue-slug)

# ❌ Doesn't work

Related to ENG-123 Related to @ENG-123 Related to #ENG-123 Related to [ENG-123]
```

#### Document References

```markdown
# ✅ Works

See [Technical Spec](https://linear.app/workspace/document/tech-spec-123)

# ❌ Doesn't work

See Technical Spec See @Technical Spec
```

#### Project References

```markdown
# ✅ Works

Part of [API Redesign](https://linear.app/workspace/project/api-redesign-abc)

# ❌ Doesn't work

Part of API Redesign Part of @API Redesign
```

#### Milestone References

```markdown
# ✅ Works - Project URL + #milestone-{id}

Targeting [Phase 1](https://linear.app/workspace/project/api-redesign/overview#milestone-abc123)
```

#### Label References

```markdown
# ✅ Works - /issue-label/ URL

Tagged: [backend](https://linear.app/workspace/issue-label/backend)

# ❌ Doesn't work

Tagged: #backend Tagged: @backend
```

#### User Mentions

```markdown
# ✅ Works - @username format (exception to URL rule)

Assigned to @john CC: @alice

# ❌ Doesn't work - Display names or plain text

Assigned to john Assigned to @John Doe
```

### Complete Example with Cross-References

```markdown
# Task: API Migration

## Overview

This task migrates our REST API to GraphQL.

**Assigned to:** @john **Project:** [API Redesign](https://linear.app/workspace/project/api-redesign-abc) **Milestone:** [Phase 1](https://linear.app/workspace/project/api-redesign/overview#milestone-xyz)

## Dependencies

- Depends on: [ENG-101](https://linear.app/workspace/issue/ENG-101) (schema design)
- Blocks: [ENG-103](https://linear.app/workspace/issue/ENG-103) (client updates)

## Documentation

See the [Technical Specification](https://linear.app/workspace/document/tech-spec-456) for details.

## Labels

Tagged: [backend](https://linear.app/workspace/issue-label/backend), [migration](https://linear.app/workspace/issue-label/migration)

## Architecture

\`\`\`mermaid graph TB REST[REST API] --> Gateway Gateway --> GraphQL[GraphQL Layer] GraphQL --> Services \`\`\`

## Checklist

- [ ] Design GraphQL schema
- [ ] Implement resolvers
- [ ] Add tests
- [ ] Update documentation
```

### Content Length Limits

| Resource | Field       | Maximum Length |
| -------- | ----------- | -------------- |
| Project  | description | 255 characters |
| Project  | content     | ~200KB         |
| Issue    | description | ~200KB         |
| Document | content     | ~200KB         |
| Comment  | body        | ~200KB         |

**Tips:**

- Keep project descriptions under 255 chars
- Use `--content` for full project details
- Use `$(cat file.md)` to load content from files
- Test large content files before deploying

## Missing Features & Workarounds

The following features are supported by the Linear API but not yet implemented in the CLI. See [`CLI_FEATURE_SUPPORT.md`](../CLI_FEATURE_SUPPORT.md) for detailed analysis and implementation roadmap.

### ❌ Issue Milestones

**Status**: Not yet supported **Priority**: 🔴 High

**What's Missing**: Cannot attach issues to project milestones via CLI

**Workaround**: Use Linear UI to assign issues to milestones

**Coming Soon**:

```bash
# Planned syntax (not yet implemented)
linear issue create --title "Task" --milestone "Phase 1"
linear issue update ENG-123 --milestone "Phase 2"
```

### ❌ Issue Relationships

**Status**: Not yet supported **Priority**: 🔴 High

**What's Missing**: Cannot create issue relationships (blocks, related, duplicate) via CLI

**Available Relationship Types**:

- `blocks` - This issue blocks another
- `related` - Related issues
- `duplicate` - Mark as duplicate
- `similar` - Similar issues

**Workaround**: Use Linear UI to set relationships

**Coming Soon**:

```bash
# Planned syntax (not yet implemented)
linear issue relate ENG-123 --blocks ENG-124
linear issue relate ENG-123 --related-to ENG-125
linear issue relate ENG-123 --duplicate-of ENG-120
linear issue unrelate ENG-123 --blocks ENG-124
linear issue relations ENG-123
```

### ❌ Cycles (Sprints)

**Status**: Not yet supported **Priority**: 🟡 Medium

**What's Missing**: Cannot assign issues to cycles/sprints via CLI

**Workaround**: Use Linear UI to assign issues to cycles

**Coming Soon**:

```bash
# Planned syntax (not yet implemented)
linear issue create --title "Task" --cycle "Sprint 5"
linear issue update ENG-123 --cycle "Sprint 6"
```

### ⚠️ Project Content Update

**Status**: Partially supported **Priority**: 🔴 High

**What's Missing**: `project update` doesn't support `--content` flag (only `project create` does)

**Workaround**: Use `project create` with full details or Linear UI for updates

**Quick Fix Needed**: Add `--content` option to `project-update.ts` command

### ⚠️ Enhanced Issue View

**Status**: Limited output **Priority**: 🟡 Medium

**What's Missing**: `issue view` only shows title, description, URL, and comments

**Not Shown**:

- Priority, estimate, due date
- Assignee, state, team
- Project, milestone
- Parent/child relationships
- Issue relations (blocks, related to, etc.)
- Labels (including label groups)
- Timestamps

**Workaround**: Use `` flag and parse with `jq`

```bash
# View all fields with jq
linear issue view ENG-123  | jq '{
  title,
  priority,
  estimate,
  assignee,
  state,
  project,
  labels
}'
```

### ❓ Label Groups

**Status**: Unknown **Priority**: 🟢 Low

**Question**: Does `label create` support parent labels (label groups)?

**API Support**: Yes, via `parentId` in `IssueLabelCreateInput`

**Needs Testing**:

```bash
# Does this work? (needs verification)
linear label create --name "Bug: Critical" --parent "Bug"
```

## AI Agent Mode

All commands output JSON by default for machine-readable responses. Use `--human` for readable output.

> **Note:** JSON output is the default. No flags needed for programmatic use.

```bash
# Get structured output (JSON is default)
linear issue list | jq '.issues[].title'

# Chain operations
PROJECT_ID=$(linear project create --name "Test" --team ENG | jq -r '.project.id')
linear document create --title "Design Doc" --project "$PROJECT_ID"

# Use --human for readable output
linear issue list --human
```

For complete documentation, see the [docs](./docs) directory.
