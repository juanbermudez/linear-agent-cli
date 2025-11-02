# Linear CLI Development Guide for Claude Code

This document provides guidance for Claude Code agents working on the **Linear CLI source code itself**. For guidance on **using** the Linear CLI, see `EXAMPLE_CLAUDE.md`.

## 🎯 Project Overview

The Linear CLI is a Deno-based command-line tool that provides comprehensive Linear API access optimized for AI agents. It's designed to be:

- **JSON-first**: JSON is the default output format (use `--human` for readable output)
- **Non-interactive**: Fully automatable with no required prompts
- **VCS-aware**: Detects Linear issues from git branch context
- **Type-safe**: Built with TypeScript and auto-generated GraphQL types

## 🏗️ Architecture

### Project Structure

```
linear-agent-cli/
├── src/
│   ├── main.ts              # CLI entry point, command router
│   ├── commands/            # Command implementations
│   │   ├── issue/           # Issue CRUD operations
│   │   ├── project/         # Project management
│   │   ├── label/           # Label operations
│   │   ├── document/        # Document management
│   │   ├── initiative/      # Initiative operations
│   │   ├── user/            # User queries
│   │   ├── workflow/        # Workflow state queries
│   │   └── config/          # Configuration management
│   ├── api/
│   │   ├── client.ts        # GraphQL client setup
│   │   └── queries/         # GraphQL query/mutation definitions
│   ├── config/
│   │   └── manager.ts       # Configuration file handling
│   ├── utils/
│   │   ├── vcs.ts           # Git context detection
│   │   ├── output.ts        # JSON/human output formatting
│   │   └── prompts.ts       # Interactive prompts (fallback)
│   └── types/
│       └── generated.ts     # Auto-generated GraphQL types
├── docs/                    # User documentation
├── test/                    # Test suites
├── deno.json                # Deno configuration
└── README.md                # Installation and usage guide
```

### Key Design Patterns

**1. Command Structure**

Each command follows this pattern:

```typescript
// src/commands/issue/issue-create.ts
import { parseArgs } from "@std/cli/parse-args"
import { executeCreateIssue } from "../../api/queries/issue-create.ts"
import { formatOutput } from "../../utils/output.ts"

export async function issueCreate(args: string[]) {
  const parsed = parseArgs(args, {
    string: ["title", "description", "team", "assignee"],
    boolean: ["human"],
    default: { human: false },
  })

  // Validation
  if (!parsed.title) {
    throw new Error("--title is required")
  }

  // API call
  const result = await executeCreateIssue({
    title: parsed.title,
    description: parsed.description,
    // ... more fields
  })

  // Output formatting (JSON is default)
  if (parsed.human) {
    formatOutput(result)
  } else {
    console.log(JSON.stringify({ success: true, issue: result }))
  }
}
```

**2. GraphQL Client**

Uses `@linear/sdk` for type-safe API access:

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

**3. VCS Context Detection**

Automatically finds issue identifiers from git branches:

```typescript
// src/utils/vcs.ts
export function detectIssueFromBranch(): string | null {
  // Check git branch name
  const branch = execSync("git branch --show-current")
  // Match patterns: feature/ENG-123, ENG-123-description, etc.
  const match = branch.match(/([A-Z]+-\d+)/)
  return match ? match[1] : null
}
```

**4. Dual Output Modes**

All commands support both human-readable and JSON output:

```typescript
// src/utils/output.ts
export function formatOutput(data: any, human: boolean) {
  if (human) {
    // Pretty print for humans
    console.log(`✓ ${data.title}`)
    console.log(`  ${data.identifier} - ${data.state.name}`)
  } else {
    // JSON is default
    console.log(JSON.stringify({ success: true, data }))
  }
}
```

## 🔧 Development Setup

### Prerequisites

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Verify installation
deno --version
```

### Local Development

```bash
# Clone repository
git clone https://github.com/juanbermudez/linear-agent-cli
cd linear-agent-cli

# Run locally (no install needed)
deno run --allow-all src/main.ts --version

# Run specific command (JSON is default)
deno run --allow-all src/main.ts issue list

# Run tests
deno test --allow-all

# Format code
deno fmt

# Lint code
deno lint
```

### Testing Changes

```bash
# Test a specific command locally (JSON is default)
deno run --allow-all src/main.ts issue create \
  --title "Test issue" \
  --team ENG

# Install locally for testing
deno install --global --allow-all --name linear-dev src/main.ts

# Test installed version (JSON is default)
linear-dev issue list

# Uninstall test version
deno uninstall linear-dev
```

## 📝 Adding New Commands

### 1. Create Command File

```typescript
// src/commands/resource/resource-action.ts
import { parseArgs } from "@std/cli/parse-args"
import { getClient } from "../../api/client.ts"

export async function resourceAction(args: string[]) {
  const parsed = parseArgs(args, {
    string: ["required-field"],
    boolean: ["human", "optional-flag"],
    default: { human: false },
  })

  // Validate required fields
  if (!parsed["required-field"]) {
    throw new Error("--required-field is required")
  }

  // Get Linear API client
  const client = getClient()

  // Execute operation
  const result = await client.resourceAction({
    requiredField: parsed["required-field"],
    // ... more fields
  })

  // Output result (JSON is default)
  if (parsed.human) {
    console.log(`✓ ${result.name}`)
  } else {
    console.log(JSON.stringify({ success: true, resource: result }))
  }
}
```

### 2. Register Command

Add to command router in `src/main.ts`:

```typescript
// src/main.ts
import { resourceAction } from "./commands/resource/resource-action.ts"

// In command routing logic
if (command === "resource" && subcommand === "action") {
  await resourceAction(remainingArgs)
}
```

### 3. Add Tests

```typescript
// test/commands/resource/resource-action.test.ts
import { assertEquals } from "@std/assert"
import { resourceAction } from "../../../src/commands/resource/resource-action.ts"

Deno.test("resource action creates resource", async () => {
  // Mock API client
  // Test command execution
  // Assert expected output
})
```

### 4. Document Command

Update `docs/USAGE.md` with:

- Command syntax
- Available options
- Example usage
- JSON response format

## 🔍 GraphQL Integration

### Using the Linear SDK

The CLI uses `@linear/sdk` which provides:

- Type-safe API access
- Auto-complete for fields
- Relationship traversal

```typescript
import { getClient } from "../../api/client.ts"

const client = getClient()

// Create issue
const issue = await client.createIssue({
  title: "New feature",
  teamId: "team-uuid",
  projectId: "project-uuid",
})

// Query with relationships
const issueWithProject = await client.issue("ENG-123")
const project = await issueWithProject.project
console.log(project.name)
```

### Type Generation

Types are manually managed from `@linear/sdk`. When Linear API changes:

```bash
# Update SDK dependency in deno.json
# Types are automatically available from @linear/sdk
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
// test/commands/issue/issue-create.test.ts
import { assertEquals, assertExists } from "@std/assert"
import { issueCreate } from "../../../src/commands/issue/issue-create.ts"

Deno.test("issue create - minimal options", async () => {
  // Setup (JSON is default)
  const args = ["--title", "Test", "--team", "ENG"]

  // Execute
  const result = await issueCreate(args)

  // Assert
  assertExists(result)
  assertEquals(result.success, true)
})

Deno.test("issue create - missing required field", async () => {
  const args = ["--team", "ENG"]

  // Should throw error
  await assertRejects(
    async () => await issueCreate(args),
    Error,
    "--title is required",
  )
})
```

### Running Tests

```bash
# Run all tests
deno test --allow-all

# Run specific test file
deno test --allow-all test/commands/issue/issue-create.test.ts

# Run with coverage
deno test --allow-all --coverage=coverage

# Generate coverage report
deno coverage coverage --lcov > coverage.lcov
```

## 🎨 Code Style

### Pre-Commit Verification (CRITICAL)

**ALWAYS run these commands BEFORE every commit:**

```bash
# 1. Format code
deno fmt

# 2. Lint code (catches unused ignores, type errors, etc.)
deno lint

# 3. Run all tests
deno test --allow-all

# 4. Verify git status
git status
```

**Why this matters:**

- `deno fmt` only fixes formatting - it does NOT catch code issues
- `deno lint` catches actual errors like unused lint-ignore directives, type issues
- Tests ensure functionality still works
- CI will fail if any of these fail, wasting time

**Example of what goes wrong without linting:**

```typescript
// This will pass fmt but FAIL lint:
// deno-lint-ignore no-explicit-any
.command("comment", commentCommand)  // ❌ No 'as any' cast - ignore is unused!

// Correct:
.command("comment", commentCommand)
// deno-lint-ignore no-explicit-any
.command("attachment", attachmentCommand) as any  // ✅ Cast present - ignore is used
```

### Formatting

```bash
# Format all files
deno fmt

# Check formatting without changes
deno fmt --check

# Format specific files
deno fmt src/commands/issue/
```

### Linting

```bash
# Lint all files
deno lint

# Fix auto-fixable issues
deno lint --fix
```

### Conventions

- **File names**: Use kebab-case (`issue-create.ts`)
- **Function names**: Use camelCase (`issueCreate()`)
- **Constants**: Use UPPER_SNAKE_CASE (`API_VERSION`)
- **Interfaces**: Use PascalCase (`IssueCreateOptions`)
- **Always use TypeScript types**: No `any` types
- **Prefer explicit over implicit**: Clear parameter names and types
- **Single responsibility**: One command per file

## 🐛 Debugging

### Local Development

```bash
# Run with verbose output
deno run --allow-all --log-level=debug src/main.ts issue list

# Inspect API calls (add to code)
console.error("DEBUG:", JSON.stringify(variables, null, 2))
```

### Common Issues

**Issue**: `Error: No API key configured`

```bash
# Solution: Run auth flow
linear whoami
# Enter API key when prompted
```

**Issue**: `Error: Team not found`

```bash
# Debug: List available teams (JSON is default)
linear whoami | jq '.teams'
```

**Issue**: Type errors from @linear/sdk

```bash
# Solution: Update SDK version in deno.json
```

## 📦 Release Process

### Version Bumping

1. Update version in `deno.json`:
   ```json
   {
     "version": "0.2.1"
   }
   ```

2. Update `CHANGELOG.md` with changes

### Publishing

```bash
# Commit version bump
git add deno.json CHANGELOG.md
git commit -m "chore: bump version to 0.2.1"

# Tag release
git tag v0.2.1
git push origin main --tags
```

Users install directly from GitHub:

```bash
deno install --global --allow-all --name linear \
  https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/src/main.ts
```

## 🔐 Security Considerations

### API Key Storage

- Stored in `~/.config/linear-cli/config.json`
- File permissions: `0600` (read/write owner only)
- Never log or expose API keys in error messages

### Input Validation

```typescript
// Always validate user input
if (!parsed.title || parsed.title.length > 255) {
  throw new Error("Title must be 1-255 characters")
}

// Sanitize for shell injection (if using exec)
const sanitized = parsed.input.replace(/[;&|]/g, "")
```

## 📚 Resources

### Deno Documentation

- [Deno Manual](https://docs.deno.com/runtime/manual)
- [Deno Standard Library](https://deno.land/std)
- [Testing in Deno](https://docs.deno.com/runtime/manual/basics/testing)

### Linear API

- [Linear SDK Documentation](https://developers.linear.app/docs/sdk/getting-started)
- [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [Linear API Schema](https://studio.apollographql.com/public/Linear-API/home)

### Related Projects

- [Original linear-cli by @schpet](https://github.com/schpet/linear-cli)
- [Claude Code Plugin](https://github.com/juanbermudez/hyper-engineering-tools)

## 🎯 Development Philosophy

### Core Principles

1. **AI-Agent First**: Design for programmatic use, human use is secondary
2. **No Surprises**: Predictable behavior, no hidden prompts
3. **JSON Everything**: All data should be machine-parseable
4. **Type Safety**: Leverage TypeScript and Linear SDK types
5. **VCS Integration**: Smart defaults from git context
6. **Fail Fast**: Clear error messages with actionable feedback

### Decision Framework

When adding features:

1. **Does it serve AI agents?** JSON output, non-interactive
2. **Is it type-safe?** Use Linear SDK types
3. **Is it testable?** Can we write automated tests?
4. **Is it documented?** Update docs and examples
5. **Is it consistent?** Follow existing patterns

## 🚨 Important Reminders

### Pre-Commit Checklist (MANDATORY)

Before EVERY commit, run these in order:

1. ✅ `deno fmt` - Format code
2. ✅ `deno lint` - **CRITICAL**: Catches code issues that fmt misses
3. ✅ `deno test --allow-all` - Ensure tests pass
4. ✅ `git status` - Verify what's being committed

**If you skip `deno lint`, CI WILL fail.** Formatting alone is NOT enough.

### General Reminders

- **Never commit API keys or tokens**
- **JSON is the default output** (use `--human` for readable format)
- **Update docs when changing commands**
- **Add tests for new functionality**
- **Use Linear SDK types, don't create custom types**
- **Validate user input before API calls**
- **Handle errors gracefully with clear messages**

---

**For usage examples, see `EXAMPLE_CLAUDE.md`** **For agent integration patterns, see `EXAMPLE_AGENTS.md`**
