# Linear CLI Guide for AI Coding Agents

**Target Audience**: ChatGPT Code Interpreter, GitHub Copilot CLI, Codex, and other AI coding assistants

This comprehensive guide helps AI agents effectively use the Linear CLI for issue tracking, project management, and team collaboration.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Command Patterns](#command-patterns)
- [Common Workflows](#common-workflows)
- [JSON API](#json-api)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Quick Start

### Installation Check

```bash
# Verify installation
linear --version

# Check configuration
linear whoami --json
```

### First Commands

```bash
# List issues
linear issue list --json

# Create issue
linear issue create --title "Fix bug" --team ENG --json

# View issue
linear issue view ENG-123 --json
```

---

## Core Concepts

### 1. JSON-First Design

**ALWAYS use `--json` flag for programmatic operations:**

```bash
linear issue list --json
linear project create --name "Project" --json
linear issue view ENG-123 --json
```

### 2. Non-Interactive Mode

**Provide all required options to avoid prompts:**

```bash
# ✓ Correct: Fully specified
linear issue create \
  --title "Task" \
  --team ENG \
  --priority 1 \
  --json

# ✗ Incorrect: Will wait for user input
linear issue create --json
```

### 3. Response Structure

All commands return consistent JSON:

```json
{
  "success": true,
  "operation": "create",
  "resource": {
    "id": "...",
    "...": "..."
  }
}
```

Or on error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### 4. Resource Identifiers

- **Issues**: Team key + number (e.g., `ENG-123`)
- **Projects**: Slug or UUID
- **Teams**: Key (e.g., `ENG`, `DESIGN`)
- **Users**: Username, email, or `@me` for self

---

## Command Patterns

### Issues

#### Create

```bash
linear issue create \
  --title "string" \
  --description "string or $(cat file.md)" \
  --team "TEAM" \
  --assignee "@me|username" \
  --priority 1-4 \
  --estimate number \
  --label "label1 label2" \
  --project "Project Name" \
  --milestone "Milestone Name" \
  --cycle "Cycle Name" \
  --parent TEAM-NUM \
  --state "State Name" \
  --due-date YYYY-MM-DD \
  --blocks TEAM-NUM1 TEAM-NUM2 \
  --related-to TEAM-NUM \
  --duplicate-of TEAM-NUM \
  --similar-to TEAM-NUM \
  --json
```

#### Update

```bash
linear issue update TEAM-NUM \
  [same options as create] \
  --json
```

#### View

```bash
linear issue view TEAM-NUM --json
```

#### List

```bash
linear issue list --team TEAM --json
```

#### Relationships

```bash
# Create relationships
linear issue relate TEAM-NUM1 TEAM-NUM2 --blocks
linear issue relate TEAM-NUM1 TEAM-NUM2 --related-to
linear issue relate TEAM-NUM1 TEAM-NUM2 --duplicate-of
linear issue relate TEAM-NUM1 TEAM-NUM2 --similar-to

# Remove relationship
linear issue unrelate TEAM-NUM1 TEAM-NUM2

# List relationships
linear issue relations TEAM-NUM --json
```

### Projects

#### Create

```bash
linear project create \
  --name "string" \
  --description "string (max 255 chars)" \
  --content "$(cat markdown-file.md)" \
  --team TEAM \
  --lead "@me|username" \
  --color "#RRGGBB" \
  --start-date YYYY-MM-DD \
  --target-date YYYY-MM-DD \
  --priority 0-4 \
  --status "Status Name" \
  --json
```

#### Update

```bash
linear project update PROJECT-SLUG \
  --name "string" \
  --content "$(cat updated.md)" \
  --lead username \
  --priority number \
  --status "Status Name" \
  --json
```

#### Milestones

```bash
# Create (requires UUID)
PROJECT_ID=$(linear project view SLUG --json | jq -r '.project.id')
linear project milestone create $PROJECT_ID \
  --name "Phase 1" \
  --target-date YYYY-MM-DD \
  --json

# List
linear project milestone list --project SLUG --json
```

#### Status Updates

```bash
linear project update-create PROJECT-SLUG \
  --body "$(cat update.md)" \
  --health onTrack|atRisk|offTrack \
  --json
```

### Labels

#### Create

```bash
# Simple label
linear label create \
  --name "bug" \
  --color "#FF0000" \
  --team TEAM \
  --json

# Label group (parent)
linear label create \
  --name "Priority" \
  --color "#COLOR" \
  --team TEAM \
  --is-group \
  --json

# Sub-label (child)
linear label create \
  --name "Critical" \
  --color "#COLOR" \
  --team TEAM \
  --parent "Priority" \
  --json
```

**Note**: Label groups display as `parent/child` on issues.

### Initiatives

```bash
linear initiative create \
  --name "Q1 Goals" \
  --description "string" \
  --content "$(cat initiative.md)" \
  --owner "@me|username" \
  --json
```

### Documents

```bash
# Create
linear document create \
  --title "string" \
  --content "$(cat doc.md)" \
  --project "Project Name" \
  --json

# VCS-aware (auto-detects current project)
linear document create \
  --current-project \
  --title "Notes" \
  --content "$(cat notes.md)" \
  --json
```

### Workflow & Users

```bash
# List workflow states
linear workflow list --team TEAM --json

# List users
linear user list --json

# Search users
linear user search "name" --json
```

---

## Common Workflows

### Workflow 1: Create Issue with Full Metadata

```bash
#!/bin/bash

# Read spec from file
SPEC=$(cat specification.md)

# Create issue
RESULT=$(linear issue create \
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
  --json)

# Check success
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
  echo "Created issue: $ISSUE_ID"
else
  echo "Error: $(echo "$RESULT" | jq -r '.error.message')"
  exit 1
fi
```

### Workflow 2: Project with Milestones

```bash
#!/bin/bash

# 1. Create project
PROJECT=$(linear project create \
  --name "Mobile App" \
  --description "iOS and Android" \
  --content "$(cat project-spec.md)" \
  --team MOBILE \
  --lead @me \
  --priority 1 \
  --start-date 2026-01-01 \
  --target-date 2026-06-30 \
  --json)

PROJECT_ID=$(echo "$PROJECT" | jq -r '.project.id')
PROJECT_SLUG=$(echo "$PROJECT" | jq -r '.project.slug')

# 2. Create milestones
linear project milestone create $PROJECT_ID \
  --name "Phase 1" \
  --target-date 2026-03-31 \
  --json

# 3. Create issues
linear issue create \
  --title "Setup auth" \
  --team MOBILE \
  --project "$PROJECT_SLUG" \
  --milestone "Phase 1" \
  --priority 1 \
  --assignee @me \
  --json

# 4. Status update
linear project update-create $PROJECT_SLUG \
  --body "Week 1: Kickoff complete" \
  --health onTrack \
  --json
```

### Workflow 3: Label Hierarchy

```bash
#!/bin/bash

TEAM="ENG"

# 1. Create parent labels
linear label create --name "Work-Type" --is-group --team $TEAM --json
linear label create --name "Scope" --is-group --team $TEAM --json

# 2. Create children
linear label create --name "Bugfix" --parent "Work-Type" --team $TEAM --json
linear label create --name "Feature" --parent "Work-Type" --team $TEAM --json
linear label create --name "Backend" --parent "Scope" --team $TEAM --json
linear label create --name "Frontend" --parent "Scope" --team $TEAM --json

# 3. Use on issue
linear issue create \
  --title "Fix API bug" \
  --label Bugfix Backend \
  --team $TEAM \
  --json
```

### Workflow 4: Issue Dependencies

```bash
#!/bin/bash

# Create parent
PARENT=$(linear issue create \
  --title "Database migration" \
  --team ENG \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# Create dependents
linear issue create \
  --title "Update API" \
  --team ENG \
  --parent $PARENT \
  --blocks ENG-200 ENG-201 \
  --json

# View relationships
linear issue relations $PARENT --json
```

---

## JSON API

### Parsing Responses

```python
import json
import subprocess

def create_issue(title, team):
    result = subprocess.run(
        ['linear', 'issue', 'create',
         '--title', title,
         '--team', team,
         '--json'],
        capture_output=True,
        text=True
    )

    data = json.loads(result.stdout)

    if data['success']:
        return data['issue']['identifier']
    else:
        raise Exception(data['error']['message'])

# Usage
issue_id = create_issue("Fix bug", "ENG")
print(f"Created: {issue_id}")
```

```javascript
const { exec } = require("child_process")
const util = require("util")
const execAsync = util.promisify(exec)

async function createIssue(title, team) {
  const { stdout } = await execAsync(
    `linear issue create --title "${title}" --team ${team} --json`,
  )

  const result = JSON.parse(stdout)

  if (result.success) {
    return result.issue.identifier
  } else {
    throw new Error(result.error.message)
  }
}

// Usage
createIssue("Fix bug", "ENG")
  .then((id) => console.log(`Created: ${id}`))
  .catch((err) => console.error(err))
```

### Response Schemas

#### Issue Create/Update Response

```json
{
  "success": true,
  "operation": "create",
  "issue": {
    "id": "uuid",
    "identifier": "ENG-123",
    "title": "string",
    "url": "https://linear.app/...",
    "state": { "name": "Todo" },
    "team": { "key": "ENG", "name": "Engineering" },
    "assignee": { "name": "string", "email": "string" },
    "priority": 1,
    "estimate": 5
  }
}
```

#### Issue View Response

```json
{
  "issue": {
    "identifier": "ENG-123",
    "title": "string",
    "description": "string",
    "state": { "name": "In Progress" },
    "team": { "key": "ENG", "name": "Engineering" },
    "assignee": { "name": "string" },
    "priority": 1,
    "estimate": 5,
    "dueDate": "2025-12-31",
    "project": { "name": "string", "slug": "string" },
    "milestone": { "name": "string", "targetDate": "2026-03-31" },
    "parent": { "identifier": "ENG-100" },
    "children": [{ "identifier": "ENG-124" }],
    "relations": {
      "nodes": [{ "type": "blocks", "issue": { "identifier": "ENG-125" } }]
    },
    "inverseRelations": {
      "nodes": [{ "type": "blocks", "issue": { "identifier": "ENG-122" } }]
    },
    "labels": {
      "nodes": [{ "name": "Bugfix", "parent": { "name": "Work-Type" } }]
    }
  }
}
```

---

## Error Handling

### Error Codes

| Code                     | Meaning                | Action                         |
| ------------------------ | ---------------------- | ------------------------------ |
| `MISSING_REQUIRED_FIELD` | Required field missing | Provide the missing field      |
| `NOT_FOUND`              | Resource not found     | Check identifier/name          |
| `API_ERROR`              | Linear API error       | Check API key and permissions  |
| `INVALID_VALUE`          | Invalid field value    | Check field format/constraints |

### Handling Errors

```python
import json
import subprocess

def safe_create_issue(title, team):
    try:
        result = subprocess.run(
            ['linear', 'issue', 'create',
             '--title', title,
             '--team', team,
             '--json'],
            capture_output=True,
            text=True,
            check=True
        )

        data = json.loads(result.stdout)

        if not data['success']:
            error_code = data['error']['code']
            error_msg = data['error']['message']

            if error_code == 'NOT_FOUND':
                print(f"Team '{team}' not found")
            elif error_code == 'MISSING_REQUIRED_FIELD':
                print(f"Missing required field: {error_msg}")
            else:
                print(f"Error ({error_code}): {error_msg}")

            return None

        return data['issue']['identifier']

    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Invalid JSON response: {e}")
        return None
```

---

## Best Practices

### 1. Always Use JSON Output

```bash
# ✓ Correct
linear issue list --json | jq '.issues[].title'

# ✗ Incorrect
linear issue list  # Human-readable, hard to parse
```

### 2. Check Success Before Proceeding

```bash
RESULT=$(linear issue create --title "Task" --team ENG --json)

if echo "$RESULT" | jq -e '.success' > /dev/null; then
  # Success - continue
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
else
  # Error - handle
  echo "Error: $(echo "$RESULT" | jq -r '.error.message')"
  exit 1
fi
```

### 3. Store Content in Files

```bash
# ✓ Correct: Content in files
cat > spec.md << 'EOF'
# Specification
...
EOF

linear issue create \
  --title "Task" \
  --description "$(cat spec.md)" \
  --json

# ✗ Incorrect: Inline long content
linear issue create \
  --title "Task" \
  --description "Very long text..." \
  --json
```

### 4. Use Descriptive Titles

```bash
# ✓ Correct: Clear, actionable
"Fix authentication timeout on mobile devices"
"Implement OAuth 2.0 provider integration"
"Add Redis caching to API endpoints"

# ✗ Incorrect: Vague
"Fix bug"
"Update code"
"Changes"
```

### 5. Link Related Work

```bash
# Create relationships
linear issue create \
  --title "Add tests" \
  --blocks ENG-123 \
  --json

linear issue update ENG-124 \
  --related-to ENG-123 \
  --json
```

### 6. Use Label Hierarchy

```bash
# Create organized label structure
linear label create --name "Type" --is-group --team ENG --json
linear label create --name "Bug" --parent "Type" --team ENG --json
linear label create --name "Feature" --parent "Type" --team ENG --json

# Use on issues
linear issue create \
  --title "Task" \
  --label Bug \
  --team ENG \
  --json
```

---

## Examples

### Python Integration

```python
#!/usr/bin/env python3
import json
import subprocess
from typing import Optional, Dict, Any

class LinearCLI:
    """Wrapper for Linear CLI"""

    @staticmethod
    def _exec(command: list[str]) -> Dict[str, Any]:
        """Execute Linear CLI command"""
        result = subprocess.run(
            ['linear'] + command + ['--json'],
            capture_output=True,
            text=True
        )
        return json.loads(result.stdout)

    @staticmethod
    def create_issue(
        title: str,
        team: str,
        description: Optional[str] = None,
        priority: Optional[int] = None,
        assignee: Optional[str] = None,
        labels: Optional[list[str]] = None
    ) -> Optional[str]:
        """Create issue and return identifier"""

        cmd = ['issue', 'create', '--title', title, '--team', team]

        if description:
            cmd.extend(['--description', description])
        if priority:
            cmd.extend(['--priority', str(priority)])
        if assignee:
            cmd.extend(['--assignee', assignee])
        if labels:
            cmd.extend(['--label'] + labels)

        result = LinearCLI._exec(cmd)

        if result['success']:
            return result['issue']['identifier']
        else:
            raise Exception(result['error']['message'])

    @staticmethod
    def get_issue(identifier: str) -> Dict[str, Any]:
        """Get issue details"""
        result = LinearCLI._exec(['issue', 'view', identifier])
        return result['issue']

    @staticmethod
    def update_issue(
        identifier: str,
        state: Optional[str] = None,
        priority: Optional[int] = None
    ) -> bool:
        """Update issue"""

        cmd = ['issue', 'update', identifier]

        if state:
            cmd.extend(['--state', state])
        if priority:
            cmd.extend(['--priority', str(priority)])

        result = LinearCLI._exec(cmd)
        return result['success']

# Usage example
if __name__ == '__main__':
    # Create issue
    issue_id = LinearCLI.create_issue(
        title="Fix login bug",
        team="ENG",
        priority=1,
        assignee="@me",
        labels=["bug", "security"]
    )
    print(f"Created: {issue_id}")

    # Get issue
    issue = LinearCLI.get_issue(issue_id)
    print(f"Title: {issue['title']}")
    print(f"State: {issue['state']['name']}")

    # Update issue
    LinearCLI.update_issue(issue_id, state="In Progress")
    print("Updated to In Progress")
```

### Node.js Integration

```javascript
#!/usr/bin/env node
const { exec } = require("child_process")
const util = require("util")
const execAsync = util.promisify(exec)

class LinearCLI {
  /**
   * Execute Linear CLI command
   */
  static async exec(command) {
    const { stdout } = await execAsync(
      `linear ${command.join(" ")} --json`,
    )
    return JSON.parse(stdout)
  }

  /**
   * Create issue
   */
  static async createIssue({
    title,
    team,
    description,
    priority,
    assignee,
    labels,
  }) {
    const cmd = ["issue", "create", "--title", `"${title}"`, "--team", team]

    if (description) cmd.push("--description", `"${description}"`)
    if (priority) cmd.push("--priority", priority)
    if (assignee) cmd.push("--assignee", assignee)
    if (labels) cmd.push("--label", ...labels)

    const result = await this.exec(cmd)

    if (result.success) {
      return result.issue.identifier
    } else {
      throw new Error(result.error.message)
    }
  }

  /**
   * Get issue
   */
  static async getIssue(identifier) {
    const result = await this.exec(["issue", "view", identifier])
    return result.issue
  }

  /**
   * Update issue
   */
  static async updateIssue(identifier, { state, priority }) {
    const cmd = ["issue", "update", identifier]

    if (state) cmd.push("--state", `"${state}"`)
    if (priority) cmd.push("--priority", priority)

    const result = await this.exec(cmd)
    return result.success
  }
}

// Usage example
async function main() {
  try {
    // Create issue
    const issueId = await LinearCLI.createIssue({
      title: "Fix login bug",
      team: "ENG",
      priority: 1,
      assignee: "@me",
      labels: ["bug", "security"],
    })
    console.log(`Created: ${issueId}`)

    // Get issue
    const issue = await LinearCLI.getIssue(issueId)
    console.log(`Title: ${issue.title}`)
    console.log(`State: ${issue.state.name}`)

    // Update issue
    await LinearCLI.updateIssue(issueId, { state: "In Progress" })
    console.log("Updated to In Progress")
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

main()
```

---

## Important Notes

### 1. User References

- Use `@me` for yourself, not `self`
- Use username or email for others

### 2. Labels

- Space-separated: `--label A B C`
- NOT repeated: `--label A --label B`

### 3. Label Groups

- Parent must have `--is-group` flag
- Children use `--parent "ParentName"`
- Display as `parent/child`

### 4. Milestones

- Require project UUID (not slug)
- Get UUID: `linear project view SLUG --json | jq -r '.project.id'`

### 5. Cross-References

- Use markdown links with full URLs
- Format: `[Text](https://linear.app/...)`
- Plain text like `ENG-123` won't link

### 6. Content Fields

- Project description: Max 255 chars
- Project content: ~200KB
- Issue description: ~200KB
- Use files for long content: `--content "$(cat file.md)"`

### 7. Relationships

- All types are bidirectional
- View both directions with `issue relations`
- Types: blocks, related, duplicate, similar

### 8. VCS Context

- CLI auto-detects issue from git branch
- Format: `feature/ENG-123-description`
- Use `issue view` without ID to see current

---

## Quick Reference

### Priority Values

- `1` = Urgent
- `2` = High
- `3` = Normal
- `4` = Low

### Health Values (Projects)

- `onTrack`
- `atRisk`
- `offTrack`

### Relationship Types

- `--blocks` = This blocks other issues
- `--related-to` = General relation
- `--duplicate-of` = Mark as duplicate
- `--similar-to` = Similar issues

### Common Flags

- `--json` = JSON output (always use)
- `--team TEAM` = Team key
- `--project "Name"` = Project name
- `--assignee @me` = Self-assign
- `--priority 1-4` = Priority level
- `--estimate N` = Story points

---

## Resources

- **Full Documentation**: `docs/USAGE.md`
- **AI Agent Guide**: `docs/AI_AGENT_GUIDE.md`
- **Examples**: `examples/` directory
- **Installation**: `docs/INSTALLATION.md`

---

**This CLI is optimized for AI agents. Follow these patterns for best results.**
