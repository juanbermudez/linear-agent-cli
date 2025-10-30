# Linear CLI JSON API Reference

Complete guide to parsing and working with JSON responses from the Linear CLI.

## Response Structure

All Linear CLI commands with `--json` flag return structured JSON responses.

### Success Response Format

```json
{
  "success": true,
  "operation": "create|update|delete",
  "resource": {
    "id": "uuid",
    "...": "resource-specific fields"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Error Codes

| Code                     | Meaning                     | Common Causes                               |
| ------------------------ | --------------------------- | ------------------------------------------- |
| `MISSING_REQUIRED_FIELD` | Required field not provided | Missing `--title`, `--team`, etc.           |
| `NOT_FOUND`              | Resource not found          | Invalid team key, issue ID, or project slug |
| `INVALID_VALUE`          | Field value is invalid      | Invalid priority (not 1-4), malformed date  |
| `API_ERROR`              | Linear API error            | Network issues, API key issues, rate limits |
| `PERMISSION_DENIED`      | Insufficient permissions    | User lacks permission for operation         |

## Resource Response Schemas

### Issue Create/Update Response

```json
{
  "success": true,
  "operation": "create",
  "issue": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "identifier": "ENG-123",
    "title": "Issue title",
    "description": "Issue description...",
    "url": "https://linear.app/workspace/issue/ENG-123",
    "state": {
      "id": "state-uuid",
      "name": "In Progress",
      "type": "started"
    },
    "team": {
      "id": "team-uuid",
      "key": "ENG",
      "name": "Engineering"
    },
    "assignee": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "priority": 1,
    "estimate": 5,
    "dueDate": "2026-12-31",
    "createdAt": "2025-10-29T10:00:00.000Z",
    "updatedAt": "2025-10-29T15:30:00.000Z"
  }
}
```

### Issue View Response

```json
{
  "issue": {
    "id": "uuid",
    "identifier": "ENG-123",
    "title": "Issue title",
    "description": "Full description...",
    "url": "https://linear.app/workspace/issue/ENG-123",
    "state": {
      "id": "uuid",
      "name": "In Progress",
      "type": "started",
      "position": 2
    },
    "team": {
      "id": "uuid",
      "key": "ENG",
      "name": "Engineering"
    },
    "assignee": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "displayName": "John"
    },
    "priority": 1,
    "priorityLabel": "Urgent",
    "estimate": 5,
    "dueDate": "2026-12-31",
    "project": {
      "id": "uuid",
      "name": "API Redesign",
      "slug": "api-redesign",
      "url": "https://linear.app/workspace/project/api-redesign"
    },
    "milestone": {
      "id": "uuid",
      "name": "Phase 1",
      "targetDate": "2026-03-31"
    },
    "cycle": {
      "id": "uuid",
      "name": "Sprint 5",
      "startsAt": "2026-01-01",
      "endsAt": "2026-01-14"
    },
    "parent": {
      "id": "uuid",
      "identifier": "ENG-100",
      "title": "Parent epic"
    },
    "children": {
      "nodes": [
        {
          "id": "uuid",
          "identifier": "ENG-124",
          "title": "Sub-task 1"
        }
      ]
    },
    "relations": {
      "nodes": [
        {
          "id": "uuid",
          "type": "blocks",
          "issue": {
            "id": "uuid",
            "identifier": "ENG-125",
            "title": "Blocked issue"
          }
        }
      ]
    },
    "inverseRelations": {
      "nodes": [
        {
          "id": "uuid",
          "type": "blocks",
          "issue": {
            "id": "uuid",
            "identifier": "ENG-122",
            "title": "Blocking issue"
          }
        }
      ]
    },
    "labels": {
      "nodes": [
        {
          "id": "uuid",
          "name": "Bug",
          "color": "#ef4444",
          "parent": {
            "id": "uuid",
            "name": "Work-Type"
          }
        }
      ]
    },
    "comments": {
      "nodes": [
        {
          "id": "uuid",
          "body": "Comment text",
          "createdAt": "2025-10-29T12:00:00.000Z",
          "user": {
            "name": "Jane Doe"
          }
        }
      ]
    },
    "createdAt": "2025-10-29T10:00:00.000Z",
    "updatedAt": "2025-10-29T15:30:00.000Z",
    "completedAt": null
  }
}
```

### Issue List Response

```json
{
  "issues": [
    {
      "identifier": "ENG-123",
      "title": "Issue title",
      "state": { "name": "In Progress" },
      "assignee": { "name": "John Doe" },
      "priority": 1,
      "url": "https://linear.app/workspace/issue/ENG-123"
    }
  ]
}
```

### Project Create/Update Response

```json
{
  "success": true,
  "operation": "create",
  "project": {
    "id": "uuid",
    "name": "API Redesign",
    "slug": "api-redesign",
    "description": "Short description",
    "content": "Full markdown content...",
    "url": "https://linear.app/workspace/project/api-redesign",
    "state": "started",
    "progress": 0.35,
    "team": {
      "id": "uuid",
      "key": "ENG",
      "name": "Engineering"
    },
    "lead": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "color": "#6366F1",
    "icon": "🚀",
    "priority": 1,
    "startDate": "2026-01-01",
    "targetDate": "2026-09-30",
    "createdAt": "2025-10-29T10:00:00.000Z"
  }
}
```

### Project View Response

```json
{
  "project": {
    "id": "uuid",
    "name": "API Redesign",
    "slug": "api-redesign",
    "description": "Short description",
    "content": "Full markdown content...",
    "url": "https://linear.app/workspace/project/api-redesign",
    "state": "started",
    "progress": 0.35,
    "team": {
      "id": "uuid",
      "key": "ENG",
      "name": "Engineering"
    },
    "lead": {
      "id": "uuid",
      "name": "Jane Doe"
    },
    "milestones": {
      "nodes": [
        {
          "id": "uuid",
          "name": "Phase 1",
          "targetDate": "2026-03-31",
          "sortOrder": 1
        }
      ]
    },
    "issues": {
      "nodes": [
        {
          "identifier": "ENG-123",
          "title": "Issue title",
          "state": { "name": "In Progress" }
        }
      ]
    },
    "createdAt": "2025-10-29T10:00:00.000Z",
    "updatedAt": "2025-10-29T15:30:00.000Z"
  }
}
```

### Label Create Response

```json
{
  "success": true,
  "operation": "create",
  "label": {
    "id": "uuid",
    "name": "Bug",
    "color": "#ef4444",
    "isGroup": false,
    "parent": {
      "id": "uuid",
      "name": "Work-Type"
    },
    "team": {
      "id": "uuid",
      "key": "ENG"
    }
  }
}
```

### Document Create Response

```json
{
  "success": true,
  "operation": "create",
  "document": {
    "id": "uuid",
    "title": "Technical Specification",
    "content": "Markdown content...",
    "url": "https://linear.app/workspace/document/uuid",
    "project": {
      "id": "uuid",
      "name": "API Redesign"
    },
    "createdAt": "2025-10-29T10:00:00.000Z",
    "updatedAt": "2025-10-29T10:00:00.000Z"
  }
}
```

## Parsing Examples

### Bash with jq

```bash
# Extract issue identifier
RESULT=$(linear issue create --title "Task" --team ENG --json)
ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
echo "Created: $ISSUE_ID"

# Check success
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  echo "Success!"
else
  ERROR=$(echo "$RESULT" | jq -r '.error.message')
  echo "Error: $ERROR"
fi

# Extract multiple fields
linear issue view ENG-123 --json | jq '{
  identifier: .issue.identifier,
  title: .issue.title,
  state: .issue.state.name,
  assignee: .issue.assignee.name,
  priority: .issue.priority
}'

# List all blocking issues
linear issue relations ENG-123 --json | jq '
  .relations.nodes[] |
  select(.type == "blocks") |
  .issue.identifier
'

# Get all labels (including parent)
linear issue view ENG-123 --json | jq '
  .issue.labels.nodes[] |
  if .parent then
    "\(.parent.name)/\(.name)"
  else
    .name
  end
'
```

### Python

```python
import json
import subprocess

def linear_exec(command: list) -> dict:
    """Execute Linear CLI command and return parsed JSON"""
    result = subprocess.run(
        ['linear'] + command + ['--json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Create issue
result = linear_exec(['issue', 'create', '--title', 'Task', '--team', 'ENG'])
if result['success']:
    issue_id = result['issue']['identifier']
    print(f"Created: {issue_id}")
else:
    print(f"Error: {result['error']['message']}")

# View issue
issue = linear_exec(['issue', 'view', 'ENG-123'])
print(f"Title: {issue['issue']['title']}")
print(f"State: {issue['issue']['state']['name']}")
print(f"Assignee: {issue['issue']['assignee']['name']}")

# Get all relationships
relations = linear_exec(['issue', 'relations', 'ENG-123'])
for rel in relations['relations']['nodes']:
    print(f"Blocks: {rel['issue']['identifier']}")
for rel in relations['inverseRelations']['nodes']:
    print(f"Blocked by: {rel['issue']['identifier']}")

# List issues with filter
result = linear_exec(['issue', 'list', '--team', 'ENG'])
for issue in result['issues']:
    if issue['state']['name'] == 'In Progress':
        print(f"{issue['identifier']}: {issue['title']}")
```

### JavaScript/Node.js

```javascript
const { exec } = require("child_process")
const util = require("util")
const execAsync = util.promisify(exec)

async function linearExec(command) {
  const { stdout } = await execAsync(`linear ${command.join(" ")} --json`)
  return JSON.parse(stdout)
}

// Create issue
const result = await linearExec([
  "issue",
  "create",
  "--title",
  "Task",
  "--team",
  "ENG",
])
if (result.success) {
  console.log(`Created: ${result.issue.identifier}`)
} else {
  console.log(`Error: ${result.error.message}`)
}

// View issue
const issue = await linearExec(["issue", "view", "ENG-123"])
console.log(`Title: ${issue.issue.title}`)
console.log(`State: ${issue.issue.state.name}`)
console.log(`Assignee: ${issue.issue.assignee.name}`)

// Get relationships
const relations = await linearExec(["issue", "relations", "ENG-123"])
relations.relations.nodes.forEach((rel) => {
  console.log(`Blocks: ${rel.issue.identifier}`)
})
relations.inverseRelations.nodes.forEach((rel) => {
  console.log(`Blocked by: ${rel.issue.identifier}`)
})

// List and filter issues
const list = await linearExec(["issue", "list", "--team", "ENG"])
const inProgress = list.issues.filter((i) => i.state.name === "In Progress")
inProgress.forEach((issue) => {
  console.log(`${issue.identifier}: ${issue.title}`)
})
```

## Common Parsing Patterns

### Extract Nested Fields

```bash
# Get project UUID from slug
PROJECT_ID=$(linear project view api-redesign --json | jq -r '.project.id')

# Get milestone names
linear project view api-redesign --json | jq -r '.project.milestones.nodes[].name'

# Get label with parent
linear issue view ENG-123 --json | jq -r '
  .issue.labels.nodes[] |
  if .parent then "\(.parent.name)/\(.name)" else .name end
'
```

### Handle Missing Fields

```bash
# Safe extraction with default values
ASSIGNEE=$(linear issue view ENG-123 --json | jq -r '.issue.assignee.name // "Unassigned"')
DUE_DATE=$(linear issue view ENG-123 --json | jq -r '.issue.dueDate // "No due date"')
```

### Batch Operations

```bash
# Create multiple issues and collect IDs
ISSUES=()
for title in "Task 1" "Task 2" "Task 3"; do
  RESULT=$(linear issue create --title "$title" --team ENG --json)
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
  ISSUES+=("$ISSUE_ID")
done

echo "Created: ${ISSUES[@]}"
```

### Error Handling

```bash
create_issue() {
  local result=$(linear issue create "$@" --json)

  if echo "$result" | jq -e '.success' > /dev/null; then
    echo "$result" | jq -r '.issue.identifier'
    return 0
  else
    local error=$(echo "$result" | jq -r '.error.message')
    echo "Error: $error" >&2
    return 1
  fi
}

# Usage
if ISSUE_ID=$(create_issue --title "Task" --team ENG); then
  echo "Created: $ISSUE_ID"
else
  echo "Failed to create issue"
fi
```

## Response Field Reference

### Common Fields Across Resources

| Field       | Type              | Description           |
| ----------- | ----------------- | --------------------- |
| `id`        | string (UUID)     | Unique identifier     |
| `url`       | string            | Linear web URL        |
| `createdAt` | string (ISO 8601) | Creation timestamp    |
| `updatedAt` | string (ISO 8601) | Last update timestamp |

### Issue-Specific Fields

| Field           | Type         | Description                                      |
| --------------- | ------------ | ------------------------------------------------ |
| `identifier`    | string       | Team key + number (e.g., "ENG-123")              |
| `title`         | string       | Issue title                                      |
| `description`   | string       | Full description (markdown)                      |
| `state`         | object       | Workflow state                                   |
| `priority`      | number       | 0=No priority, 1=Urgent, 2=High, 3=Normal, 4=Low |
| `priorityLabel` | string       | Human-readable priority                          |
| `estimate`      | number       | Story points estimate                            |
| `dueDate`       | string       | Due date (YYYY-MM-DD)                            |
| `completedAt`   | string\|null | Completion timestamp                             |

### Project-Specific Fields

| Field         | Type   | Description                                             |
| ------------- | ------ | ------------------------------------------------------- |
| `slug`        | string | URL-safe identifier                                     |
| `name`        | string | Project name                                            |
| `description` | string | Short description (max 255 chars)                       |
| `content`     | string | Full content (markdown)                                 |
| `state`       | string | "planned", "started", "paused", "completed", "canceled" |
| `progress`    | number | Progress percentage (0-1)                               |
| `startDate`   | string | Start date (YYYY-MM-DD)                                 |
| `targetDate`  | string | Target completion date (YYYY-MM-DD)                     |

### Relationship Object Structure

```json
{
  "id": "uuid",
  "type": "blocks|relatedTo|duplicate|similar",
  "issue": {
    "id": "uuid",
    "identifier": "ENG-123",
    "title": "Related issue"
  }
}
```

### Label Object Structure

```json
{
  "id": "uuid",
  "name": "Bug",
  "color": "#ef4444",
  "isGroup": false,
  "parent": {
    "id": "uuid",
    "name": "Work-Type"
  }
}
```
