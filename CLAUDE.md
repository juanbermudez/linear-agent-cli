**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See AGENTS.md for workflow details.

## basics

- this is a deno app
- after editing any graphql documents, run `deno task codegen` to get the updated types after it's updated, `const result = await client.request(query, { teamId });` should work and be typed (and not require explicit types)
- graphql/schema.graphql has the graphql schema document for linear's api
- for diagnostics, use `deno check` and `deno lint` (do not use tsc or rely on LSP for this)
- when coloring or styling terminal text, use deno's @std/fmt/colors package
- prefer `foo == null` and `foo != null` over `foo === undefined` and `foo !== undefined`
- import: use dynamic import only when necessary, the static form is preferable
- avoid the typescript `any` type - prefer strict typing, if you can't find a good way to fix a type issue (particularly with graphql data or documents) explain the problem instead of working around it

## changelog entries

do not update the CHANGELOG.md manually. if asked to add a changelog entry use the changelog cli

    changelog add --type <TYPE> <DESCRIPTION>

- description should be lowercase
- types is one of added|changed|deprecated|removed|fixed|security
- write in the imperative (i.e. 'fix' and not 'fixes' or 'fixed')

## tests

- tests on commands should mirror the directory structure of the src, e.g.
  - src/commands/issue/issue-view.ts
  - test/commands/issue/issue-view.test.ts
- use `deno task test` instead of `deno test`, use `deno task snapshot` to update snapshots
- use the NO_COLOR variable for snapshot tests so they don't include ansi escape codes

## project documentation

This project uses a structured approach to planning and documenting new features in `.claude/project/`:

```
.claude/project/
├── overview.md                          # Project PRD
└── tasks/
    ├── 001-task-name.md                # Individual task specs
    ├── 002-another-task.md
    └── ...
```

### project overview (overview.md)

The overview.md is a Product Requirements Document (PRD) inspired by Linear and Stripe's approach:

**Required Sections:**

1. **Title & Metadata**
   - Project name
   - Status (Planning | In Progress | Completed)
   - Start date
   - Owner/Lead

2. **Overview**
   - Brief summary (2-3 sentences)
   - Problem statement
   - Goals and success metrics

3. **Motivation**
   - Why are we building this?
   - User needs and pain points
   - Business/product value

4. **Scope**
   - **In Scope**: What we're building
   - **Out of Scope**: What we're explicitly NOT building (this iteration)
   - **Future Considerations**: Features deferred to later

5. **User Experience**
   - User stories or scenarios
   - Example command usage with expected output
   - Error cases and edge cases

6. **Technical Approach**
   - High-level architecture
   - GraphQL schema analysis (what endpoints/mutations are available)
   - Integration points (VCS, GitHub, etc.)
   - Dependencies and constraints

7. **Implementation Plan**
   - Breakdown of tasks with references to task files
   - Dependencies between tasks
   - Estimated complexity/effort

8. **Success Criteria**
   - How do we know we're done?
   - Testing strategy
   - Documentation requirements

9. **Open Questions**
   - Unknowns that need research or decisions
   - Alternative approaches considered

### task specifications (tasks/NNN-task-name.md)

Each task file must be detailed enough for a junior developer to execute successfully while maintaining code quality.

**Required Sections:**

1. **Task Metadata**
   ```
   Task: NNN
   Title: [Descriptive title]
   Status: [Not Started | In Progress | Blocked | Completed]
   Dependencies: [List of task numbers this depends on]
   Estimated Effort: [Small | Medium | Large]
   ```

2. **Objective**
   - Clear, specific goal
   - Acceptance criteria (checklist format)

3. **Research Summary**
   - GraphQL schema analysis (relevant types, queries, mutations, fragments)
   - Existing code patterns to follow (with file references)
   - Similar implementations in codebase (with examples)
   - External dependencies or APIs

4. **Technical Specification**

   **GraphQL Schema:**
   - List exact types, fields, and mutations from schema
   - Include field types and nullability
   - Document pagination requirements
   - Note any required fragments

   **Command Design:**
   - Command structure (parent command, subcommands)
   - Flag specifications (name, type, description, default, required)
   - Interactive prompt flows (if applicable)
   - Output format (table, JSON, etc.)

   **Code Structure:**
   ```
   Files to create/modify:
   - src/commands/[area]/[command].ts     # Command definition
   - src/utils/linear.ts                   # Add GraphQL queries/mutations
   - test/commands/[area]/[command].test.ts # Tests
   ```

   **Implementation Details:**
   - Function signatures
   - Error handling requirements
   - Validation rules
   - Display formatting (colors, tables, paging)

5. **Design Patterns to Follow**

   Based on existing codebase patterns:

   **Command Structure:**
   ```typescript
   // Follow pattern from src/commands/issue/issue-list.ts
   import { Command } from "@cliffy/command"
   import { gql } from "../../__codegen__/gql.ts"
   import { getGraphQLClient } from "../../utils/graphql.ts"
   // ... etc

   export const commandName = new Command()
     .description("Brief description")
     .option("-f, --flag <value>", "Flag description")
     .action(async (options) => {
       // Implementation
     })
   ```

   **GraphQL Queries:**
   ```typescript
   // Define in src/utils/linear.ts
   const query = gql(/* GraphQL */ `
     query QueryName($input: Type!) {
       field(input: $input) {
         id
         name
         # ... fields
       }
     }
   `)

   export async function functionName(params: Type): Promise<ReturnType> {
     const client = getGraphQLClient()
     const data = await client.request(query, params)
     return data.field
   }
   ```

   **Display Utilities:**
   ```typescript
   // Use utils/display.ts for formatting
   import { formatTable } from "../../utils/display.ts"
   import { colors } from "@std/fmt/colors"

   // For long output, use pager
   import { displayWithPager } from "../../utils/pager.ts"
   ```

   **Error Handling:**
   ```typescript
   // Descriptive errors with context
   if (!result) {
     console.error(colors.red(`Error: Could not find [resource] with ID ${id}`))
     Deno.exit(1)
   }
   ```

   **Interactive Prompts:**
   ```typescript
   // Use Cliffy prompts
   import { Select, Input, Checkbox } from "@cliffy/prompt"

   const value = await Select.prompt({
     message: "Select an option:",
     options: items.map(item => ({
       name: item.name,
       value: item.id,
     })),
     search: true,  // Enable search for long lists
   })
   ```

   **Testing:**
   ```typescript
   // Snapshot tests for help text
   Deno.test("command --help", async () => {
     const output = await runCommand(["command", "--help"])
     assertSnapshot(t, output)
   })

   // Mock Linear API for integration tests
   // See test/utils/mock_linear_server.ts
   ```

6. **Step-by-Step Implementation Guide**

   Detailed steps in order:
   1. Research GraphQL schema (document findings)
   2. Add GraphQL query/mutation to src/utils/linear.ts
   3. Run `deno task codegen` to generate types
   4. Create command file with basic structure
   5. Implement core logic
   6. Add display/formatting
   7. Add error handling
   8. Create tests
   9. Update help text and documentation
   10. Run quality checks (lint, format, type check)
   11. Add changelog entry

7. **Testing Requirements**
   - Unit tests for utility functions
   - Snapshot tests for command help text
   - Integration tests with mock Linear server
   - Manual testing checklist

8. **Examples**

   **Expected Usage:**
   ```bash
   # Show actual command examples
   linear command --flag value

   # Expected output (formatted)
   ```

   **Edge Cases:**
   ```bash
   # Document error scenarios
   linear command --invalid
   # Expected: Error message
   ```

9. **Checklist**
   - [ ] GraphQL schema researched and documented
   - [ ] Similar patterns identified in codebase
   - [ ] Command structure designed
   - [ ] GraphQL queries/mutations added
   - [ ] Types generated (`deno task codegen`)
   - [ ] Command implemented
   - [ ] Tests written and passing
   - [ ] Help text accurate
   - [ ] Error handling comprehensive
   - [ ] Code formatted and linted
   - [ ] Changelog entry added
   - [ ] Documentation updated (if needed)

### research requirements

Before creating any task specification, **mandatory research** includes:

1. **GraphQL Schema Analysis**
   - Search graphql/schema.graphql for relevant types
   - Document all available fields, mutations, queries
   - Note field types, nullability, and relationships
   - Check for pagination requirements (Connection types)
   - Identify required fragments or nested types

2. **Existing Code Patterns**
   - Find 2-3 similar commands in codebase
   - Document the patterns they use
   - Note utility functions they leverage
   - Identify reusable components

3. **Dependencies**
   - What other tasks must be completed first?
   - What utilities need to be created/modified?
   - What GraphQL types need to be added?

4. **Edge Cases**
   - What can go wrong?
   - What validation is needed?
   - How to handle missing data?
   - What are the permission requirements?

### code quality standards

All implementations must maintain existing quality:

**Required Checks:**
```bash
deno check src/commands/[your-file].ts   # Type checking
deno lint                                  # Linting
deno fmt                                   # Formatting
deno task test                             # All tests pass
```

**Code Principles:**
- **Type Safety**: No `any` types, leverage GraphQL codegen
- **Null Safety**: Use `== null` / `!= null` for checks
- **Error Handling**: Descriptive messages with context
- **User Experience**: Colors, paging, interactive prompts
- **Consistency**: Follow existing command patterns exactly
- **Testing**: Mirror directory structure, use snapshots
- **Documentation**: Clear help text and examples

**GraphQL Workflow:**
1. Add query/mutation with `gql` template tag
2. Run `deno task codegen` to generate types
3. Use generated types (no manual typing needed)
4. Handle errors from API gracefully

**Display Standards:**
- Use `@std/fmt/colors` for terminal colors
- Respect `NO_COLOR` environment variable
- Use pager for long output (see utils/pager.ts)
- Tables should be unicode-width aware
- Include visual indicators (emojis, symbols) where helpful
- Provide both human-readable and JSON output options (when applicable)

### workflow

When working on a project:

1. **Planning Phase**
   - Create overview.md with comprehensive PRD
   - Research GraphQL schema thoroughly
   - Identify all tasks and dependencies
   - Create detailed task specifications

2. **Implementation Phase**
   - Work on one task at a time
   - Follow task specification exactly
   - Run quality checks continuously
   - Update task status as you progress

3. **Completion**
   - All tests passing
   - All quality checks green
   - Changelog entries added
   - Documentation updated
   - Task marked completed

**Never:**
- Skip research phase
- Start coding without a detailed spec
- Bypass quality checks
- Leave tasks partially complete
