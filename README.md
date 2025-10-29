# Linear CLI for AI Agents

A comprehensive, AI-agent-optimized CLI for Linear that goes beyond issues. Designed specifically for coding agents like Claude Code, Cursor, and Codex as an alternative to the official Linear MCP.

> **Originally created by [@schpet](https://github.com/schpet)**, this fork extends the CLI with enhanced AI agent capabilities, cross-entity operations, and comprehensive JSON output for all commands.

**Inspired by** context engineering principles shared by [@dexhorthy](https://x.com/dexhorthy) and [@vaibcode](https://x.com/vaibcode).

## ⚡ Quick Start

**One-command installation** (automatically installs Deno if needed):

```bash
curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
```

Then reload your shell and run the interactive setup:

```bash
# Reload shell (or restart terminal)
source ~/.zshrc  # or ~/.bashrc for bash

# Run interactive setup wizard 🚀
linear config setup  # or: linear config init

# The wizard will guide you through:
# • API key (with optional save to shell profile)
# • Workspace and team selection
# • Cache and auto-branch preferences
# • Configuration file generation

# Start using!
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

| Resource | Create | Update | Delete | Restore | List | View | Search |
|----------|--------|--------|--------|---------|------|------|--------|
| **Issues** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Projects** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Initiatives** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Documents** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Labels** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Teams** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Users** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

### Special Capabilities

- 🔗 **VCS Integration**: Automatic context from git/jj branches
- 🎯 **Cross-Entity Operations**: Create related resources in one command
- ⚙️ **Flexible Configuration**: Dot notation for nested config, env variable priority
- 🤖 **AI-First Design**: JSON output and error codes everywhere
- 🎨 **Dual Mode**: Interactive prompts or flag-based for automation
- 🔍 **Smart Resource Resolution**: Accept URLs, IDs, or titles for issues/projects
- 💾 **Intelligent Caching**: Automatic 24h caching for workflows, statuses, labels, and users
- ⚡ **Workflow Management**: List and cache issue workflow states
- 📊 **Status Management**: List and cache project statuses
- 👤 **User Management**: List and search users for assignments and mentions (cached)
- 🆔 **Whoami Command**: View current user and configuration status

## 📦 Installation

### Automatic Installation (Recommended)

One command installs everything (Deno + Linear CLI):

```bash
curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
```

This script will:
- ✅ Detect your OS and shell (bash/zsh/fish)
- ✅ Install Deno if not present
- ✅ Configure PATH automatically
- ✅ Install Linear CLI
- ✅ Work on macOS, Linux, and Windows (WSL)

After installation, reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc, or restart terminal
linear --version
```

### Manual Installation

If you prefer to install manually:

```bash
# 1. Install Deno (if not installed)
curl -fsSL https://deno.land/install.sh | sh

# 2. Add Deno to PATH
export PATH="$HOME/.deno/bin:$PATH"

# 3. Clone and install Linear CLI
git clone https://github.com/juanbermudez/linear-agent-cli.git
cd linear-agent-cli
deno task install

# 4. Verify
linear --version
```

### Uninstalling

```bash
curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/uninstall.sh | bash
```

### Setup

After installation, configure your Linear API key:

```bash
# Interactive setup wizard
linear config setup

# Or set manually
linear config set auth.token "lin_api_..."
linear config set defaults.team "ENG"
```

Get your API key at: https://linear.app/settings/api

See [Installation Guide](./docs/INSTALLATION.md) for detailed instructions and troubleshooting.

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

# Workflows (Issue States)
linear workflow list --team ENG         # List workflow states with caching
linear workflow cache --team ENG        # Force refresh cache

# Project Statuses
linear status list                      # List project statuses with caching
linear status cache                     # Force refresh cache

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

# Check current configuration
linear whoami --json | jq '.configuration'

# List users for assignment (cached)
linear user list --json | jq '.users[].displayName'

# Search for user by name
linear user search "john" --json | jq '.users[0].id'

# Find active admins
linear user list --active-only --admins-only --json
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

- **Environment variable priority**: CLI args > Env vars > Config file > Defaults
- Nested values with dot notation
- Multiple search paths (local, git root, ~/.config)
- Directory/repo-specific configuration
- Type-aware value parsing

### Interactive Setup Wizard

The easiest way to configure the CLI is using the interactive setup wizard:

```bash
linear config setup  # or: linear config init
```

The wizard will guide you through:

1. **API Key Setup**
   - Prompts for your Linear API key (masked input)
   - Validates the key format
   - Optionally saves to your shell profile (~/.zshrc or ~/.bashrc)

2. **Workspace & Team Selection**
   - Automatically fetches your workspace
   - Lists all available teams
   - Choose between:
     - Single team (default)
     - Multiple teams
     - All teams

3. **Preferences Configuration**
   - Enable 24-hour caching (recommended)
   - Auto-create git branches when starting issues
   - Default issue sort order

4. **Configuration File**
   - Generates `.linear.toml` in your project root
   - Detects git repository for proper placement
   - Includes helpful comments

### Configuration Precedence

The CLI follows this precedence order (highest to lowest):
1. CLI flags (e.g., `--team ENG`)
2. Environment variables (e.g., `LINEAR_TEAM_ID=ENG`)
3. Config file (`.linear.toml`)
4. Built-in defaults

### Example Configuration

```toml
[auth]
token = "lin_api_..."

[defaults]
team_id = "ENG"                # Default team for all commands
workspace = "my-workspace"     # Linear workspace slug

[defaults.project]
status = "In Progress"
color = "#4A90E2"

[vcs]
autoBranch = true             # Auto-create git branches (default: true)

[cache]
enabled = true                # Enable caching (default: true)

[interactive]
enabled = true

[output]
format = "json"              # Default to JSON for AI agents
```

### Environment Variables

For AI agents and automation, use environment variables:

```bash
export LINEAR_API_KEY="lin_api_..."
export LINEAR_TEAM_ID="ENG"
export LINEAR_WORKSPACE="my-workspace"
export LINEAR_AUTO_BRANCH="false"    # Disable auto git branching
export LINEAR_CACHE_ENABLED="true"   # Enable caching (default)
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
git clone https://github.com/juanbermudez/linear-agent-cli.git
cd linear-agent-cli

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
- [Report Issues](https://github.com/juanbermudez/linear-agent-cli/issues)
- [Discussions](https://github.com/juanbermudez/linear-agent-cli/discussions)

---

**Made for AI agents** 🤖 | **Built with** [Deno](https://deno.land/) | **Powered by** [Linear](https://linear.app/)
