# Contributing to Linear CLI

Thank you for your interest in contributing to the Linear CLI! This project extends the excellent foundation laid by [@schpet](https://github.com/schpet) with enhanced AI agent capabilities.

## 🤝 How to Contribute

We welcome contributions of all kinds:

- 🐛 Bug reports and fixes
- ✨ New features and enhancements
- 📝 Documentation improvements
- 🧪 Tests and test coverage
- 💡 Ideas and suggestions

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) 1.37 or higher
- Linear API key (get one at https://linear.app/settings/api)
- Git for version control

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/linear-agent-cli.git
   cd linear-agent-cli
   ```

2. **Install Dependencies**
   ```bash
   deno task install
   ```

3. **Configure Linear API**
   ```bash
   # Set your API key
   export LINEAR_API_KEY="lin_api_..."

   # Or use the interactive setup
   linear config setup
   ```

4. **Verify Setup**
   ```bash
   deno task check    # Type checking
   deno task test     # Run tests
   linear --version   # Test CLI
   ```

## 🛠️ Development Workflow

### Project Structure

```
linear-agent-cli/
├── src/
│   ├── commands/        # Command implementations
│   ├── utils/           # Utility functions
│   ├── __codegen__/     # Generated GraphQL types
│   └── main.ts          # CLI entry point
├── test/                # Test files
├── docs/                # Documentation
├── graphql/             # GraphQL schema
└── examples/            # Usage examples
```

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Write Code**
   - Follow existing code style
   - Add TypeScript types (avoid `any`)
   - Use `foo == null` instead of `foo === undefined`
   - Prefer static imports over dynamic imports

3. **Update GraphQL Types** (if you modified GraphQL queries)
   ```bash
   deno task codegen
   ```

4. **Run Tests**
   ```bash
   # Run all tests
   deno task test

   # Run specific test file
   deno test test/commands/issue/issue-create.test.ts

   # Update snapshots
   deno task snapshot
   ```

5. **Check Code Quality**
   ```bash
   # Type checking
   deno task check

   # Lint
   deno lint

   # Format
   deno fmt
   ```

## 📝 Code Guidelines

### TypeScript Style

```typescript
// ✅ Good
export async function createIssue(options: CreateOptions) {
  const client = getGraphQLClient()
  if (options.title == null) {
    throw new Error("Title is required")
  }
  // ...
}

// ❌ Avoid
export async function createIssue(options: any) {
  const client = getGraphQLClient()
  if (options.title === undefined || options.title === null) {
    throw new Error("Title is required")
  }
  // ...
}
```

### Command Structure

Each command should:

- Support both interactive and flag-based modes
- Provide JSON output with `--json` flag
- Include helpful error messages
- Follow existing command patterns

Example:

```typescript
export const myCommand = new Command()
  .name("my-command")
  .description("Description of command")
  .option("-n, --name <name:string>", "Name option")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    // Interactive mode
    if (!options.name && !options.json) {
      options.name = await Input.prompt({
        message: "Name:",
      })
    }

    // Validation
    if (!options.name) {
      console.error("Name is required")
      Deno.exit(1)
    }

    // Execute
    const result = await doSomething(options.name)

    // Output
    if (options.json) {
      console.log(JSON.stringify({ success: true, result }))
    } else {
      console.log(`✓ Success: ${result}`)
    }
  })
```

### Testing

- Write tests for new features
- Follow snapshot testing patterns for command output
- Use `NO_COLOR` env var for snapshot tests
- Mirror command structure in test directory

Example test structure:

```
src/commands/issue/issue-create.ts
test/commands/issue/issue-create.test.ts
```

## 📋 Adding Features

### New Commands

1. Create command file in `src/commands/`
2. Register command in parent command
3. Add tests in `test/commands/`
4. Update documentation in `docs/USAGE.md`
5. Add changelog entry

### GraphQL Schema Changes

1. Update queries/mutations in command files
2. Run `deno task codegen` to regenerate types
3. Test with Linear API
4. Document in code comments

### Documentation

- Update `README.md` for major features
- Update `docs/USAGE.md` for command options
- Add examples to `examples/` directory
- Update `CHANGELOG.md` with changes

## 🧪 Testing Guidelines

### Unit Tests

```typescript
import { assertEquals } from "@std/assert"

Deno.test("function does what it should", () => {
  const result = myFunction("input")
  assertEquals(result, "expected")
})
```

### Snapshot Tests

```typescript
import { assertSnapshot } from "@cliffy/testing"

Deno.test("command output matches snapshot", async (t) => {
  Deno.env.set("NO_COLOR", "1")
  const output = await runCommand(["arg1", "arg2"])
  await assertSnapshot(t, output)
})
```

### Integration Tests

Test with real Linear API:

```bash
# Set test API key
export LINEAR_API_KEY="lin_api_test_..."

# Run integration tests
deno test --allow-net --allow-env
```

## 📦 Pull Request Process

1. **Before Submitting**
   - [ ] All tests pass (`deno task test`)
   - [ ] Code is formatted (`deno fmt`)
   - [ ] Types check (`deno task check`)
   - [ ] Documentation updated
   - [ ] Changelog entry added

2. **Commit Messages**
   - Use clear, descriptive messages
   - Reference issues: `fix: resolve issue with labels (#123)`
   - Follow conventional commits format

3. **Pull Request**
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes
   - Request review

4. **Code Review**
   - Address feedback
   - Keep discussions focused
   - Be respectful and constructive

## 🔧 Changelog Guidelines

Add entries to `CHANGELOG.md` using the changelog CLI:

```bash
# Add new feature
changelog add --type added "support for label groups with --is-group flag"

# Add bug fix
changelog add --type fixed "issue relationships not displaying inverse relations"

# Add breaking change
changelog add --type changed "rename --assignee self to --assignee @me"
```

Types:

- `added` - New features
- `changed` - Changes in existing functionality
- `deprecated` - Soon-to-be removed features
- `removed` - Removed features
- `fixed` - Bug fixes
- `security` - Security fixes

## 🐛 Reporting Bugs

When reporting bugs, include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Minimal steps to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - OS and version
  - Deno version (`deno --version`)
  - CLI version (`linear --version`)
- **Error Messages**: Full error output
- **Screenshots**: If applicable

## 💡 Suggesting Features

Feature requests should include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Examples**: Usage examples or mockups

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions
- Keep discussions professional

## 🙏 Recognition

Contributors will be:

- Listed in release notes
- Credited in documentation
- Acknowledged in the project

## 📞 Getting Help

- **Documentation**: Check [docs/](./docs/)
- **Examples**: See [examples/](./examples/)
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions

## 📚 Additional Resources

- [Linear API Documentation](https://developers.linear.app/docs)
- [Deno Documentation](https://deno.land/manual)
- [Cliffy Documentation](https://cliffy.io/)
- [GraphQL Codegen](https://the-guild.dev/graphql/codegen)

---

**Thank you for contributing!** 🎉

Your contributions help make this tool better for everyone.
