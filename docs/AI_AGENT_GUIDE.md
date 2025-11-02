# AI Agent Integration Guide

This CLI was specifically designed to be used by AI coding agents like Claude Code, Cursor, and Codex as an alternative to the official Linear MCP.

## Why Use This CLI for AI Agents?

### Advantages Over Linear MCP

1. **Complete CRUD Operations**: Full create, read, update, delete support for all resources
2. **Cross-Entity Operations**: Create related resources in one command (e.g., project + document)
3. **VCS-Aware**: Automatic context detection from git/jj branches
4. **JSON by Default**: All commands return JSON without any flags needed
5. **Error Codes**: Machine-readable error codes for better error handling
6. **Composable**: Designed to be chained with other CLI tools (jq, grep, etc.)

> **Note:** JSON output is the default. Use `--human` for human-readable format.

### Design Philosophy

This CLI follows the principles shared by [@dexhorthy](https://x.com/dexhorthy) and [@vaibcode](https://x.com/vaibcode) in their context engineering talks:

- **Explicit over implicit**: Clear command structure and predictable output
- **Composable primitives**: Small, focused commands that combine well
- **Context-aware**: Leverages VCS context to reduce manual input
- **Machine-first, human-friendly**: JSON output with human-readable fallbacks

## JSON Output Format

### Success Response

```json
{
  "success": true,
  "issue": {
    "id": "abc123",
    "identifier": "ENG-123",
    "title": "Fix login bug",
    "url": "https://linear.app/company/issue/ENG-123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Issue ENG-123 not found"
  }
}
```

### Error Codes

- `NOT_FOUND`: Resource doesn't exist
- `MISSING_REQUIRED_FIELD`: Required parameter missing
- `INVALID_VALUE`: Parameter value is invalid
- `VCS_CONTEXT_NOT_FOUND`: No VCS context available for --current-project
- `API_ERROR`: Linear API error

## Integration Patterns

### 1. Context-Aware Issue Management

```typescript
// Get current issue from VCS context
const result = execSync("linear issue view ").toString()
const issue = JSON.parse(result).issue

// Create document for current issue's project
execSync(`linear document create \
  --current-project \
  --title "Implementation Notes for ${issue.title}" \
  `)
```

### 2. Project Kickoff Automation

```typescript
// Create project with document in one command
const result = execSync(`linear project create \
  --name "${projectName}" \
  --team ENG \
  --with-doc \
  --doc-title "Technical Specification" \
  `).toString()

const { project, document } = JSON.parse(result)

// Create initial issues
const issues = [
  "Setup project structure",
  "Implement core API",
  "Add tests",
].map((title) => {
  const res = execSync(`linear issue create \
    --title "${title}" \
    --project ${project.id} \
    `).toString()
  return JSON.parse(res).issue
})
```

### 3. Bulk Operations

```typescript
// Get all issues for a project
const result = execSync("linear issue list --project PROJ-123 ")
  .toString()
const issues = JSON.parse(result).issues

// Update all issues to "In Review"
for (const issue of issues) {
  execSync(`linear issue update ${issue.identifier} \
    --status "In Review" \
    `)
}
```

### 4. Initiative Planning

```typescript
// Create initiative
const initResult = execSync(`linear initiative create \
  --name "Q1 2024 Goals" \
  --status active \
  `).toString()
const initiative = JSON.parse(initResult).initiative

// Create and link projects
const projects = ["Backend", "Frontend", "Mobile"]
for (const name of projects) {
  const projResult = execSync(`linear project create \
    --name "Q1 - ${name}" \
    `).toString()
  const project = JSON.parse(projResult).project

  execSync(`linear initiative link ${initiative.id} \
    --project ${project.id}`)
}
```

## Configuration for AI Agents

### JSON Output is Already Default

No configuration needed - JSON is the default:

```bash
# Already outputs JSON by default
linear issue list

# Use --human for readable output
linear issue list --human
```

### Disable Interactive Prompts

```bash
linear config set interactive.enabled false
```

### Set Default Team

```bash
linear config set defaults.team "ENG"
```

### Environment Variables

```bash
export LINEAR_API_KEY="lin_api_..."
export LINEAR_OUTPUT_FORMAT="json"
export LINEAR_TEAM="ENG"
```

## Using with jq

The CLI pairs perfectly with `jq` for JSON processing:

```bash
# Extract issue IDs
linear issue list  | jq -r '.issues[].id'

# Get project names
linear project list  | jq -r '.projects[].name'

# Filter and transform
linear issue list  | \
  jq '.issues | map(select(.priority == "high")) | .[].title'

# Build objects
linear project view PROJ-123  | \
  jq '{name: .project.name, url: .project.url, teamCount: (.project.teams | length)}'
```

## Error Handling

### Checking Success

```bash
if output=$(linear issue create --title "Test"  2>&1); then
  id=$(echo "$output" | jq -r '.issue.id')
  echo "Created issue: $id"
else
  error=$(echo "$output" | jq -r '.error.message')
  echo "Error: $error"
  exit 1
fi
```

### Handling Specific Errors

```bash
output=$(linear document create --current-project --title "Notes"  2>&1)
code=$(echo "$output" | jq -r '.error.code')

case $code in
  "VCS_CONTEXT_NOT_FOUND")
    echo "No VCS context. Specify --project instead."
    ;;
  "NOT_FOUND")
    echo "Project not found"
    ;;
  *)
    echo "Unknown error: $(echo "$output" | jq -r '.error.message')"
    ;;
esac
```

## Best Practices

### 1. JSON Output is Default

JSON output is automatic - no flags needed:

```bash
# Good - JSON by default
linear issue create --title "Test"

# Also good - Use --human for readable output
linear issue create --title "Test"
```

### 2. Check Success Field

Always check the `success` field before accessing data:

```typescript
const result = JSON.parse(output)
if (result.success) {
  processData(result.issue)
} else {
  handleError(result.error)
}
```

### 3. Use VCS Context When Available

Leverage automatic context detection to reduce parameters:

```bash
# Instead of:
linear document create --project PROJ-123 --title "Notes"

# Use:
linear document create --current-project --title "Notes"
```

### 4. Compose with Standard Tools

Chain with standard Unix tools for powerful workflows:

```bash
# Find all high-priority issues and create a summary
linear issue list  | \
  jq -r '.issues[] | select(.priority == "high") | "- [\(.identifier)] \(.title)"' > high-priority.md
```

## Example: Full Workflow Automation

```typescript
#!/usr/bin/env ts-node

import { execSync } from "child_process"

interface LinearResult {
  success: boolean
  project?: any
  document?: any
  error?: { code: string; message: string }
}

function runLinear(cmd: string): LinearResult {
  try {
    const output = execSync(`linear ${cmd} `, { encoding: "utf-8" })
    return JSON.parse(output)
  } catch (error) {
    const output = error.stdout || error.stderr
    return JSON.parse(output)
  }
}

async function setupProject(name: string, team: string) {
  // Create project with document
  const result = runLinear(
    `project create --name "${name}" --team ${team} --with-doc`,
  )

  if (!result.success) {
    throw new Error(`Failed to create project: ${result.error?.message}`)
  }

  console.log(`Created project: ${result.project.name}`)
  console.log(`Created document: ${result.document.title}`)

  // Create milestones
  const milestones = [
    { name: "Alpha", date: "2024-06-30" },
    { name: "Beta", date: "2024-09-30" },
    { name: "GA", date: "2024-12-31" },
  ]

  for (const milestone of milestones) {
    runLinear(`project milestone create ${result.project.id} \
      --name "${milestone.name}" \
      --target-date ${milestone.date}`)
  }

  // Create initial issues
  const tasks = [
    "Setup project structure",
    "Implement core API",
    "Add authentication",
    "Write tests",
    "Documentation",
  ]

  for (const task of tasks) {
    const issueResult = runLinear(`issue create \
      --title "${task}" \
      --project ${result.project.id}`)

    if (issueResult.success) {
      console.log(`Created issue: ${issueResult.issue.identifier}`)
    }
  }

  return result.project
}

// Run
setupProject("Mobile App v2", "MOBILE")
  .then((project) => console.log(`\nProject ready: ${project.url}`))
  .catch((error) => console.error(error))
```

## Testing with AI Agents

When building tools that use this CLI:

1. **Mock the CLI**: Use dependency injection to swap real CLI calls with mocks
2. **Test JSON parsing**: Ensure your code handles all response formats
3. **Handle errors**: Test error codes and fallback behavior
4. **Verify VCS context**: Test both with and without VCS context

Example test setup:

```typescript
// Mock for testing
class MockLinearCLI {
  exec(cmd: string): LinearResult {
    if (cmd.includes("issue create")) {
      return {
        success: true,
        issue: { id: "test-123", identifier: "TEST-123" },
      }
    }
    // ... handle other commands
  }
}

// Use in tests
const cli = new MockLinearCLI()
const result = cli.exec('issue create --title "Test"')
expect(result.success).toBe(true)
```

## Resources

- [Installation Guide](./INSTALLATION.md)
- [Usage Guide](./USAGE.md)
- [Linear API Documentation](https://developers.linear.app/docs)
- [Context Engineering Talks](https://x.com/dexhorthy) (inspiration for this design)
