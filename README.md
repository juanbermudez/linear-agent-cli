# Linear CLI for AI Agents

A comprehensive, AI-agent-optimized CLI for Linear that goes beyond issues. Designed specifically for coding agents like Claude Code, Cursor, and Codex as an alternative to the official Linear MCP.

> **Originally created by [@schpet](https://github.com/schpet)**, this fork extends the CLI with enhanced AI agent capabilities, cross-entity operations, and comprehensive JSON output for all commands.

**Inspired by** context engineering principles shared by [@dexhorthy](https://x.com/dexhorthy) and [@vaibcode](https://x.com/vaibcode).

## ⚡ Quick Start

```bash
# Install
git clone https://github.com/juanbermudez/linear-cli-agent.git
cd linear-cli-agent
deno task install

# Setup
linear config setup

# Start using
linear issue list
linear project create --name "My Project" --with-doc
linear document create --current-project --title "Notes"
```

## 🎯 Why This CLI?

### Built for AI Agents

This CLI is **specifically designed** to be used by AI coding agents:

- **Complete JSON output** for all commands (`--json` flag)
- **Consistent error codes** for programmatic error handling
- **Cross-entity operations** for complex workflows in single commands
- **VCS-aware** to reduce context switching and manual parameter passing
- **Composable** with standard CLI tools (jq, grep, awk)

### Advantages Over Linear MCP

| Feature | This CLI | Linear MCP |
|---------|----------|------------|
| Full CRUD operations | ✅ | Partial |
| Cross-entity ops (project + doc) | ✅ | ❌ |
| VCS integration (git/jj) | ✅ | ❌ |
| JSON output everywhere | ✅ | ❌ |
| Offline-first config | ✅ | ❌ |
| Composable with shell tools | ✅ | Limited |

## ✨ Key Features

### Comprehensive Resource Management

| Resource | Create | Update | Delete | Restore | List | View |
|----------|--------|--------|--------|---------|------|------|
| **Issues** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Projects** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Initiatives** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Documents** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Labels** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Teams** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Special Capabilities

- 🔗 **VCS Integration**: Automatic context from git/jj branches
- 🎯 **Cross-Entity Operations**: Create related resources in one command
- ⚙️ **Flexible Configuration**: Dot notation for nested config
- 🤖 **AI-First Design**: JSON output and error codes everywhere
- 🎨 **Dual Mode**: Interactive prompts or flag-based for automation

## 📦 Installation

### Prerequisites

- [Deno](https://deno.land/) (v2.0+)
- Linear API key ([create one](https://linear.app/settings/api))

### Install

```bash
# Clone repository
git clone https://github.com/juanbermudez/linear-cli-agent.git
cd linear-cli-agent

# Install globally
deno task install

# Verify
linear --version
```

### Setup

```bash
# Run setup wizard
linear config setup

# Or set manually
linear config set auth.token "lin_api_..."
linear config set defaults.team "ENG"
```

See [Installation Guide](./docs/INSTALLATION.md) for detailed instructions.

## 🚀 Usage

### Basic Commands

```bash
# Issues
linear issue list                    # List your issues
linear issue create --title "Bug"    # Create issue
linear issue start ENG-123           # Start working (creates git branch)
linear issue view                    # View current issue

# Projects
linear project list                  # List projects
linear project create --name "API"   # Create project
linear project view PROJ-123         # View details

# Documents (VCS-aware!)
linear document create --current-project --title "Notes"
linear document list --current-project

# Initiatives
linear initiative create --name "Q1 Goals"
linear initiative list --status active

# Labels
linear label create --name "bug" --color "#FF0000"
linear label list --team ENG

# Configuration
linear config set defaults.project.status "In Progress"
linear config get defaults.project
```

### AI Agent Examples

```bash
# JSON output for parsing
linear issue list --json | jq '.issues[].title'

# Create project with document (cross-entity)
linear project create \
  --name "Mobile App" \
  --team MOBILE \
  --with-doc \
  --doc-title "Technical Spec" \
  --json

# VCS-aware document creation
linear document create \
  --current-project \
  --title "Implementation Notes" \
  --json

# Chain operations
PROJECT_ID=$(linear project create --name "API" --json | jq -r '.project.id')
linear document create --project "$PROJECT_ID" --title "API Design" --json
```

See [Usage Guide](./docs/USAGE.md) for comprehensive examples.

## 🤖 AI Agent Integration

This CLI was built from the ground up for AI coding agents. See the [AI Agent Guide](./docs/AI_AGENT_GUIDE.md) for:

- JSON output patterns
- Error handling
- VCS context usage
- Bulk operations
- Full workflow automation examples

### Quick Integration

```typescript
import { execSync } from 'child_process';

// Get current issue from VCS
const result = execSync('linear issue view --json').toString();
const issue = JSON.parse(result).issue;

// Create related document
execSync(`linear document create \
  --current-project \
  --title "Notes for ${issue.title}" \
  --json`);
```

## 🔗 VCS Integration

The CLI automatically detects your VCS context:

```bash
# Git: reads issue ID from branch name
git checkout feature/ENG-123-login-fix
linear issue view  # Shows ENG-123

# Create document for current issue's project
linear document create --current-project --title "Implementation"

# Jujutsu: reads from commit trailers
jj commit -m "Fix" -m "Linear-Issue: ENG-123"
linear issue view  # Shows ENG-123
```

## ⚙️ Configuration

Configuration is stored in `.linear.toml` files with support for:

- Nested values with dot notation
- Environment variable overrides
- Multiple search paths (local, git root, ~/.config)
- Type-aware value parsing

```toml
[auth]
token = "lin_api_..."

[defaults]
team = "ENG"

[defaults.project]
status = "In Progress"
color = "#4A90E2"

[interactive]
enabled = true

[output]
format = "json"  # Default to JSON for AI agents
```

## 📚 Documentation

- [Installation Guide](./docs/INSTALLATION.md) - Detailed setup instructions
- [Usage Guide](./docs/USAGE.md) - Comprehensive command reference
- [AI Agent Guide](./docs/AI_AGENT_GUIDE.md) - AI integration patterns
- [Changelog](./CHANGELOG.md) - Version history

## 🤝 Contributing

Contributions are welcome! This project extends the excellent foundation laid by [@schpet](https://github.com/schpet).

### Development

```bash
# Clone
git clone https://github.com/juanbermudez/linear-cli-agent.git
cd linear-cli-agent

# Install dependencies
deno task install

# Run tests
deno task test

# Check types
deno task check

# Format code
deno fmt
```

### Testing

```bash
# Run all tests
deno task test

# Update snapshots
deno task snapshot

# Run specific test
deno test test/commands/document/
```

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Credits

- **Original Author**: [@schpet](https://github.com/schpet) - Created the foundational Linear CLI
- **Inspiration**: [@dexhorthy](https://x.com/dexhorthy) and [@vaibcode](https://x.com/vaibcode) - Context engineering principles
- **AI Enhancements**: Extended for AI agent use cases with cross-entity operations, comprehensive JSON output, and VCS integration

## 🔗 Links

- [Linear API Documentation](https://developers.linear.app/docs)
- [Original CLI Repository](https://github.com/schpet/linear-cli)
- [Report Issues](https://github.com/juanbermudez/linear-cli-agent/issues)
- [Discussions](https://github.com/juanbermudez/linear-cli-agent/discussions)

---

**Made for AI agents** 🤖 | **Built with** [Deno](https://deno.land/) | **Powered by** [Linear](https://linear.app/)
