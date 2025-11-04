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

### 5. Issue Collaboration with Comments

```typescript
// Add status update comment
execSync(`linear issue comment create ENG-123 \
  --body "Completed initial implementation, ready for review" \
  `)

// Request review with mention
execSync(`linear issue comment create ENG-123 \
  --body "@alice Please review the API changes when you get a chance" \
  `)

// Add multi-line decision document
const decisionDoc = `
## Decision: Use PostgreSQL for User Data

### Context
We need a reliable database for user authentication and profiles.

### Options Considered
1. MongoDB - Document flexibility
2. PostgreSQL - ACID compliance
3. DynamoDB - Serverless scaling

### Decision
PostgreSQL for strong consistency and relational data.
`
execSync(`linear issue comment create ENG-123 \
  --body "${decisionDoc.trim()}" \
  `)

// List and analyze comments
const result = execSync("linear issue comment list ENG-123 ").toString()
const { comments } = JSON.parse(result)

// Find comments with mentions
const mentions = comments.filter((c) => c.body.includes("@"))

// Extract action items from comments
const actionItems = comments.flatMap((c) => {
  const matches = c.body.match(/TODO: (.*)/g) || []
  return matches.map((m) => ({
    author: c.author.displayName,
    item: m,
    createdAt: c.createdAt,
  }))
})
```

### 6. Managing Issue Attachments

```typescript
// Create attachment from uploaded file URL
const createResult = execSync(`linear issue attachment create ENG-123 \
  --title "Bug Screenshot" \
  --url "https://example.com/uploads/error-screenshot.png" \
  --subtitle "Error on production" \
  `).toString()
const { attachment } = JSON.parse(createResult)

// Add GitHub PR as attachment
execSync(`linear issue attachment create ENG-123 \
  --title "Pull Request #456" \
  --url "https://github.com/org/repo/pull/456" \
  `)

// Add Figma design link
execSync(`linear issue attachment create ENG-123 \
  --title "Final Design" \
  --url "https://figma.com/file/abc123" \
  --subtitle "Approved by design team" \
  `)

// List attachments to discover context
const result = execSync("linear issue attachment list ENG-123 ").toString()
const { attachments } = JSON.parse(result)

// Find screenshots for bug reports
const screenshots = attachments.filter((a) =>
  a.title.toLowerCase().includes("screenshot") ||
  a.url.includes(".png") ||
  a.url.includes(".jpg")
)

// Get GitHub PR links
const githubPRs = attachments.filter((a) =>
  a.sourceType === "github" &&
  a.url.includes("/pull/")
)

// Get Figma design links
const figmaLinks = attachments.filter((a) => a.url.includes("figma.com"))

// Download attachment URLs for analysis
const imageUrls = attachments
  .filter((a) => a.sourceType === "upload")
  .map((a) => a.url)

// Use with vision APIs to analyze screenshots
for (const url of imageUrls) {
  // Send to vision API to extract text, identify UI elements, etc.
  const analysis = await analyzeImage(url)
  console.log(`Screenshot analysis: ${analysis}`)
}

// Clean up old attachments
const oldAttachments = attachments.filter((a) =>
  new Date(a.createdAt) < new Date("2024-01-01")
)
for (const att of oldAttachments) {
  execSync(`linear issue attachment delete ${att.id} --confirm `)
}

// Embed images directly in issue description
execSync(`linear issue update ENG-123 \
  --description "## Bug Report

![Screenshot](${screenshots[0].url})

The error appears when clicking the login button." \
  `)
```

### 7. Finding Resources with Search

```typescript
// Search for issues across the workspace
const issueResult = execSync("linear issue search 'authentication bug' ")
  .toString()
const { issues, totalCount } = JSON.parse(issueResult)

// Filter by team-specific results
const teamResult = execSync("linear issue search 'API' --team TEAM-UUID ")
  .toString()

// Search including archived items for historical context
const archivedResult = execSync(
  "linear issue search 'deprecated feature' --include-archived ",
).toString()

// Search in comments for discussions and decisions
const commentSearch = execSync(
  "linear issue search 'migration plan' --include-comments ",
).toString()

// Search projects for related work
const projectResult = execSync("linear project search 'mobile app' ").toString()
const { projects } = JSON.parse(projectResult)

// Find relevant documentation
const docResult = execSync("linear document search 'technical specification' ")
  .toString()
const { documents } = JSON.parse(docResult)

// Combine search across resources
const allResults = {
  issues:
    JSON.parse(execSync("linear issue search 'authentication' ").toString())
      .issues,
  projects:
    JSON.parse(execSync("linear project search 'authentication' ").toString())
      .projects,
  documents:
    JSON.parse(execSync("linear document search 'authentication' ").toString())
      .documents,
}

// Build context from search results
const context = `
Found ${allResults.issues.length} issues, ${allResults.projects.length} projects,
and ${allResults.documents.length} documents related to authentication.

Key issues:
${
  allResults.issues.slice(0, 3).map((i) => `- ${i.identifier}: ${i.title}`)
    .join("\n")
}
`
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
