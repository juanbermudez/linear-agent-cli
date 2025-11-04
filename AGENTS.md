# Linear CLI Development Guide for AI Coding Agents

**Target Audience**: ChatGPT, GitHub Copilot, Cursor, Cody, and other AI coding assistants working on the Linear CLI source code.

**For using the CLI** (not developing it), see `EXAMPLE_AGENTS.md`.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Adding Features](#adding-features)
- [Testing](#testing)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is This?

A Deno-based CLI tool for Linear API that's optimized for AI agent automation:

- JSON output by default (use `--human` for readable format)
- Non-interactive (no prompts required)
- VCS-aware (detects issues from git branches)
- Type-safe with TypeScript and Linear SDK

### Tech Stack

- **Runtime**: Deno (not Node.js)
- **Language**: TypeScript
- **API Client**: `@linear/sdk`
- **CLI Parsing**: `@std/cli/parse-args`
- **Testing**: Deno's built-in test runner

### Key Files

```
src/main.ts           - Entry point and command router
src/api/client.ts     - Linear API client setup
src/commands/         - All command implementations
src/utils/vcs.ts      - Git integration
src/utils/output.ts   - JSON/human output formatting
deno.json             - Project configuration
```

---

## Quick Start

### Setup Development Environment

```bash
# Install Deno if needed
curl -fsSL https://deno.land/install.sh | sh

# Clone and navigate
git clone https://github.com/juanbermudez/linear-agent-cli
cd linear-agent-cli

# Run without installing
deno run --allow-all src/main.ts --version

# Test a command (JSON is default)
deno run --allow-all src/main.ts issue list
```

### Test Your Changes

```bash
# Format code (do this before committing)
deno fmt

# Lint code
deno lint

# Run tests
deno test --allow-all

# Install locally for testing
deno install --global --allow-all --name linear-dev src/main.ts
linear-dev issue list --json
```

---

## Architecture

### Command Pattern

Every command follows this structure:

```typescript
// src/commands/resource/action.ts
import { parseArgs } from "@std/cli/parse-args"
import { getClient } from "../../api/client.ts"

export async function resourceAction(args: string[]) {
  // 1. Parse arguments
  const parsed = parseArgs(args, {
    string: ["required-field", "optional-field"],
    boolean: ["human"],
    default: { human: false },
  })

  // 2. Validate input
  if (!parsed["required-field"]) {
    throw new Error("--required-field is required")
  }

  // 3. Call Linear API
  const client = getClient()
  const result = await client.doSomething({
    requiredField: parsed["required-field"],
  })

  // 4. Format output (JSON is default)
  if (parsed.human) {
    console.log(`✓ Success: ${result.name}`)
  } else {
    console.log(JSON.stringify({ success: true, data: result }))
  }
}
```

### File Organization

```
src/commands/
├── issue/
│   ├── issue-create.ts       # linear issue create
│   ├── issue-update.ts       # linear issue update
│   ├── issue-list.ts         # linear issue list
│   └── issue-view.ts         # linear issue view
├── project/
│   ├── project-create.ts     # linear project create
│   └── ...
└── ...
```

Each resource gets its own directory. Each action gets its own file.

### API Integration

```typescript
// src/api/client.ts
import { LinearClient } from "@linear/sdk"
import { getConfig } from "../config/manager.ts"

export function getClient(): LinearClient {
  const config = getConfig()
  if (!config.api_key) {
    throw new Error("No API key configured. Run: linear whoami")
  }
  return new LinearClient({ apiKey: config.api_key })
}
```

Use this in commands:

```typescript
const client = getClient()
const issue = await client.issue("ENG-123")
```

---

## Development Workflow

### 1. Understand the Task

```bash
# Read existing similar command
cat src/commands/issue/issue-create.ts

# Check types available from Linear SDK
# Browse: https://developers.linear.app/docs/sdk/getting-started
```

### 2. Implement

Follow the command pattern shown in [Architecture](#architecture).

Key points:

- Use `parseArgs` from `@std/cli/parse-args`
- Always support `--json` flag
- Validate required fields
- Use `getClient()` for API access
- Handle errors with clear messages

### 3. Test

```bash
# Test command locally
deno run --allow-all src/main.ts your-command --json

# Run test suite
deno test --allow-all

# Format code
deno fmt
```

### 4. Document

Update `docs/USAGE.md` with:

- Command syntax
- Available options
- Example usage
- JSON response format

---

## Adding Features

### Adding a New Command

**Step 1: Create command file**

```typescript
// src/commands/comment/comment-create.ts
import { parseArgs } from "@std/cli/parse-args"
import { getClient } from "../../api/client.ts"

export async function commentCreate(args: string[]) {
  const parsed = parseArgs(args, {
    string: ["issue", "body"],
    boolean: ["json"],
    default: { json: false },
  })

  if (!parsed.issue || !parsed.body) {
    throw new Error("--issue and --body are required")
  }

  const client = getClient()
  const comment = await client.createComment({
    issueId: parsed.issue,
    body: parsed.body,
  })

  if (parsed.json) {
    console.log(JSON.stringify({ success: true, comment }))
  } else {
    console.log(`✓ Comment added to ${parsed.issue}`)
  }
}
```

**Step 2: Register in router**

```typescript
// src/main.ts
import { commentCreate } from "./commands/comment/comment-create.ts"

// In command routing logic (find similar pattern)
if (command === "comment" && subcommand === "create") {
  await commentCreate(remainingArgs)
}
```

**Step 3: Add tests**

```typescript
// test/commands/comment/comment-create.test.ts
import { assertEquals } from "@std/assert"

Deno.test("comment create - success", async () => {
  // Add test implementation
})
```

**Step 4: Update docs**

Add to `docs/USAGE.md`:

```markdown
### Create Comment

\`\`\`bash linear comment create\
--issue ENG-123\
--body "Great work!"\
--json \`\`\`
```

### Adding an Option to Existing Command

```typescript
// In src/commands/issue/issue-create.ts

// 1. Add to parseArgs
const parsed = parseArgs(args, {
  string: ["title", "new-option"], // <-- Add here
  boolean: ["json"],
})

// 2. Pass to API
const issue = await client.createIssue({
  title: parsed.title,
  newField: parsed["new-option"], // <-- Add here
})
```

---

## Testing

### Test Structure

```typescript
// test/commands/issue/issue-create.test.ts
import { assertEquals, assertExists, assertRejects } from "@std/assert"
import { issueCreate } from "../../../src/commands/issue/issue-create.ts"

Deno.test("issue create - minimal options", async () => {
  const args = ["--title", "Test", "--team", "ENG", "--json"]
  const result = await issueCreate(args)
  assertExists(result)
})

Deno.test("issue create - missing title", async () => {
  const args = ["--team", "ENG", "--json"]
  await assertRejects(
    async () => await issueCreate(args),
    Error,
    "--title is required",
  )
})
```

### Running Tests

```bash
# All tests
deno test --allow-all

# Specific test file
deno test --allow-all test/commands/issue/issue-create.test.ts

# With coverage
deno test --allow-all --coverage=coverage
deno coverage coverage
```

### Mocking API Calls

For tests that shouldn't hit real API:

```typescript
// Mock the client
import { stub } from "@std/testing/mock"

Deno.test("mocked API call", async () => {
  // Create stub
  const createStub = stub(
    client,
    "createIssue",
    () => Promise.resolve({ id: "123", identifier: "ENG-123" }),
  )

  // Test your command
  await issueCreate(["--title", "Test", "--json"])

  // Verify
  assertEquals(createStub.calls.length, 1)

  // Cleanup
  createStub.restore()
})
```

---

## Common Tasks

### Task: Add Human-Readable Output to Command

```typescript
// Before: JSON only (default)
console.log(JSON.stringify({ success: true, issue: result }))

// After: Support both modes
if (parsed.human) {
  console.log(`✓ Created issue ${result.identifier}`)
} else {
  console.log(JSON.stringify({ success: true, issue: result }))
}
```

### Task: Add VCS Context Detection

```typescript
import { detectIssueFromBranch } from "../../utils/vcs.ts"

// In your command
if (!parsed.issue) {
  parsed.issue = detectIssueFromBranch()
  if (!parsed.issue) {
    throw new Error("--issue required or run from git branch with issue ID")
  }
}
```

### Task: Add New Linear Resource Support

1. Check Linear SDK for available methods:
   - Visit: https://developers.linear.app/docs/sdk/getting-started
   - Search for resource (e.g., "roadmap", "initiative")

2. Create command directory:
   ```bash
   mkdir -p src/commands/resource
   ```

3. Implement CRUD operations:
   - `resource-create.ts`
   - `resource-list.ts`
   - `resource-view.ts`
   - `resource-update.ts`
   - `resource-delete.ts`

4. Register commands in `src/main.ts`

5. Add tests in `test/commands/resource/`

6. Document in `docs/USAGE.md`

### Task: Update Linear SDK Version

```json
// deno.json
{
  "imports": {
    "@linear/sdk": "npm:@linear/sdk@^30.0.0"
  }
}
```

Types update automatically from npm package.

---

## Troubleshooting

### Error: `command not found: deno`

Install Deno:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

The installer automatically adds Deno to your PATH. Restart your shell or run `source ~/.bashrc` (or `~/.zshrc`) to load it.

### Error: `No API key configured`

This is expected during development. To test:

```bash
# Run whoami flow to set up API key
deno run --allow-all src/main.ts whoami
```

Or mock the API client in tests.

### Error: Type errors from @linear/sdk

```bash
# Clear Deno cache
deno cache --reload src/main.ts

# Or update SDK version in deno.json
```

### Error: Tests failing after changes

```bash
# Check what broke
deno test --allow-all --fail-fast

# Run specific failing test
deno test --allow-all test/commands/issue/issue-create.test.ts

# Add debug logging
console.error("DEBUG:", parsed)
```

### Debugging API Calls

```typescript
// Add before API call
console.error("API Request:", JSON.stringify(variables, null, 2))

// Add after API call
console.error("API Response:", JSON.stringify(result, null, 2))
```

---

## Code Style Guidelines

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `issue-create.ts`)
- **Functions**: `camelCase` (e.g., `issueCreate()`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_VERSION`)
- **Types**: `PascalCase` (e.g., `IssueCreateOptions`)

### TypeScript Usage

```typescript
// ✅ Good: Explicit types
function issueCreate(args: string[]): Promise<void>

// ❌ Avoid: Implicit any
function issueCreate(args)

// ✅ Good: Use Linear SDK types
const issue: Issue = await client.issue("ENG-123")

// ❌ Avoid: Custom types for SDK data
interface MyIssue {
  id: string
}
```

### Error Handling

```typescript
// ✅ Good: Clear error messages
if (!parsed.title) {
  throw new Error('--title is required. Example: --title "Fix bug"')
}

// ❌ Avoid: Vague errors
if (!parsed.title) {
  throw new Error("Missing field")
}
```

### Command Validation

```typescript
// ✅ Good: Validate early
if (!parsed.title || parsed.title.length > 255) {
  throw new Error("Title must be 1-255 characters")
}
const result = await client.createIssue(...)

// ❌ Avoid: Validation after API call
const result = await client.createIssue(...)
if (!parsed.title) {
  throw new Error("Title required")
}
```

---

## Important Reminders

### Before Committing

```bash
# 1. Format code
deno fmt

# 2. Lint code
deno lint

# 3. Run tests
deno test --allow-all

# 4. Test command manually
deno run --allow-all src/main.ts your-command --json
```

### Development Principles

1. **AI-Agent First**: Design for programmatic use
2. **JSON by Default**: JSON is the default output (use `--human` for readable format)
3. **No Prompts**: Never require interactive input
4. **Type Safety**: Use Linear SDK types
5. **Clear Errors**: Actionable error messages
6. **Test Coverage**: Test new functionality

### Security

- Never commit API keys
- Never log sensitive data
- Validate all user input
- Use Linear SDK (don't build raw GraphQL)

---

## Resources

### Documentation

- **Deno Manual**: https://docs.deno.com/runtime/manual
- **Linear SDK**: https://developers.linear.app/docs/sdk/getting-started
- **Linear GraphQL API**: https://developers.linear.app/docs/graphql/working-with-the-graphql-api

### Related

- **Usage Guide**: See `EXAMPLE_AGENTS.md`
- **Claude Code Guide**: See `EXAMPLE_CLAUDE.md`
- **Plugin**: https://github.com/juanbermudez/hyper-engineering-tools

---

## Quick Reference

### Command Template

```typescript
import { parseArgs } from "@std/cli/parse-args"
import { getClient } from "../../api/client.ts"

export async function myCommand(args: string[]) {
  const parsed = parseArgs(args, {
    string: ["field"],
    boolean: ["human"],
    default: { human: false },
  })

  if (!parsed.field) throw new Error("--field is required")

  const client = getClient()
  const result = await client.doSomething({ field: parsed.field })

  // JSON is default
  if (parsed.human) {
    console.log(`✓ ${result.name}`)
  } else {
    console.log(JSON.stringify({ success: true, data: result }))
  }
}
```

### Test Template

```typescript
import { assertEquals } from "@std/assert"

Deno.test("my command - success case", async () => {
  // Setup (JSON is default)
  const args = ["--field", "value"]

  // Execute
  const result = await myCommand(args)

  // Assert
  assertEquals(result.success, true)
})
```

---

**Ready to contribute? Check `CONTRIBUTING.md` for guidelines.**
