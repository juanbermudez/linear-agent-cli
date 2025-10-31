# Linear CLI for AI Agents

A command-line interface for Linear designed to enable **spec-driven software engineering** with AI coding agents.

> **Originally created by [@schpet](https://github.com/schpet)**, this fork extends the CLI with enhanced AI agent capabilities for full-lifecycle development collaboration.

**Inspired by** [@dexhorthy](https://x.com/dexhorthy)'s "Advanced Context Engineering" approach: the specification of what we want from our software is more valuable than the code itself. When AI writes the implementation, well-documented specs become the source of truth—just like source code was for compiled artifacts. This CLI makes Linear the platform for that spec-driven workflow.

[![Advanced Context Engineering - Dex Horthy](https://img.youtube.com/vi/IS_y40zY-hc/maxresdefault.jpg)](https://www.youtube.com/watch?v=IS_y40zY-hc)

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

| Feature                          | This CLI | Linear MCP |
| -------------------------------- | -------- | ---------- |
| Full CRUD operations             | ✅       | Partial    |
| Cross-entity ops (project + doc) | ✅       | ❌         |
| VCS integration (git/jj)         | ✅       | ❌         |
| JSON output everywhere           | ✅       | ❌         |
| Offline-first config             | ✅       | ❌         |
| Composable with shell tools      | ✅       | Limited    |

## 🎓 Claude Code Plugin

A comprehensive **Linear CLI Expert plugin** for Claude Code is available that includes this CLI, specialized AI agents (research, planning, engineering), and a complete spec-driven development workflow.

### Plugin Repository

Visit the [Hyper-Engineering Tools](https://github.com/juanbermudez/hyper-engineering-tools) repository to:
- Install the complete Claude Code plugin with sub-agents
- Access the plugin marketplace
- Get documentation on spec-driven workflows
- Learn about AI agent orchestration patterns

### Quick Plugin Installation

```bash
# In Claude Code
/plugin marketplace add https://github.com/juanbermudez/hyper-engineering-tools/marketplace
/plugin install linear-cli-expert@hyper-engineering-tools
```

The plugin includes:
- **This Linear CLI** - Auto-installed when you load the plugin
- **3 Specialized Agents** - Research, planning, and engineering sub-agents
- **Workflow Orchestration** - Coordinated research → planning → implementation
- **Complete Linear Integration** - Full CRUD operations for all Linear resources

## 📖 AI Agent Guides

This repository includes example documentation for AI agents using the CLI:

### For Claude/Claude Code
See [`EXAMPLE_CLAUDE.md`](./EXAMPLE_CLAUDE.md) for comprehensive guidance on:
- JSON output patterns
- Command success checking
- Non-interactive command examples
- Best practices for automation
- Full workflow examples

### For Other AI Coding Agents
See [`EXAMPLE_AGENTS.md`](./EXAMPLE_AGENTS.md) for:
- Quick start examples for ChatGPT, Copilot, Cursor, etc.
- Command patterns and common workflows
- JSON API reference
- Error handling strategies

**Tip**: You can use these example files as a starting point for your own AI agent configurations. Copy them to your project and customize based on your workflow needs.

## ✨ Key Features

### Comprehensive Resource Management

| Resource        | Create | Update | Delete | Restore | List | View | Search | Relationships |
| --------------- | ------ | ------ | ------ | ------- | ---- | ---- | ------ | ------------- |
| **Issues**      | ✅     | ✅     | ✅     | ❌      | ✅   | ✅   | ❌     | ✅            |
| **Projects**    | ✅     | ✅     | ✅     | ✅      | ✅   | ✅   | ❌     | N/A           |
| **Initiatives** | ✅     | ✅     | ❌     | ✅      | ✅   | ✅   | ❌     | N/A           |
| **Documents**   | ✅     | ✅     | ✅     | ✅      | ✅   | ✅   | ❌     | N/A           |
| **Labels**      | ✅     | ✅     | ✅     | ❌      | ✅   | ❌   | ❌     | ✅ (Groups)   |
| **Teams**       | ✅     | ❌     | ❌     | ❌      | ✅   | ❌   | ❌     | N/A           |
| **Users**       | ❌     | ❌     | ❌     | ❌      | ✅   | ❌   | ✅     | N/A           |

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
- 🏷️ **Label Groups**: Hierarchical label organization with parent/child relationships
- 🔗 **Issue Relationships**: Create and manage blocks, related, duplicate, and similar relationships
- 🎯 **Milestones & Cycles**: Attach issues to project milestones and sprint cycles
- 📋 **Rich Metadata**: Full support for content fields in projects and initiatives
- 📊 **Enhanced Views**: Issue views display all metadata, relationships, and hierarchy

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
# Get help and usage guide
linear usage                         # Display quick usage guide and content formatting

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

# Label Groups (Hierarchical labels)
linear label create --name "Priority" --is-group --team ENG
linear label create --name "Critical" --parent "Priority" --team ENG

# Issue Relationships
linear issue relate DIV-123 DIV-124 --blocks
linear issue relate DIV-123 DIV-125 --related-to
linear issue unrelate DIV-123 DIV-124
linear issue relations DIV-123

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

# Create project with rich markdown content
linear project create \
  --name "API Redesign" \
  --description "Modernize API with GraphQL" \
  --content "$(cat project-overview.md)" \
  --team ENG \
  --priority 1 \
  --lead @me \
  --json

# Update project content
linear project update PROJECT-ID --content "$(cat updated-overview.md)"

# Create initiative with content
linear initiative create \
  --name "Q1 2025 Goals" \
  --content "$(cat q1-initiatives.md)" \
  --owner @me \
  --json

# Create issue with milestones, cycles, and relationships
linear issue create \
  --title "Implement OAuth" \
  --team ENG \
  --project "API Redesign" \
  --milestone "Phase 1" \
  --cycle "Sprint 5" \
  --priority 1 \
  --estimate 8 \
  --blocks ENG-100 ENG-101 \
  --related-to ENG-102 \
  --label Backend New-Feature \
  --json

# VCS-aware document creation
linear document create \
  --current-project \
  --title "Implementation Notes" \
  --json

# Chain operations
PROJECT_ID=$(linear project create --name "API" --json | jq -r '.project.id')
linear document create --project "$PROJECT_ID" --title "API Design" --json

# Create label hierarchy and use on issues
linear label create --name "Work-Type" --is-group --team ENG
linear label create --name "Bugfix" --parent "Work-Type" --team ENG
linear issue create --title "Fix bug" --label Bugfix --json

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

### Content Formatting & Cross-References

Linear supports rich markdown content with cross-references. Here's what you need to know:

#### Project Content vs Description

Projects have **two separate text fields**:

```bash
# Description: Short summary (max 255 characters)
--description "Brief project summary"

# Content: Full project body with rich markdown
--content "$(cat overview.md)"
```

**Example:**

```bash
linear project create \
  --name "Mobile App" \
  --description "iOS and Android mobile applications" \
  --content "# Mobile App Project

## Overview
Full project details with markdown formatting...

## Architecture
\`\`\`mermaid
graph TB
    App --> API
\`\`\`
" \
  --team MOBILE
```

#### Cross-Reference Syntax

Linear requires **markdown link format with full URLs** for all resource cross-references:

| Resource Type  | Format                         | Example                                                                       |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| **Issues**     | `[TEAM-NUM](url)`              | `[ENG-123](https://linear.app/workspace/issue/ENG-123/slug)`                  |
| **Documents**  | `[Title](url)`                 | `[Spec](https://linear.app/workspace/document/slug-id)`                       |
| **Projects**   | `[Name](url)`                  | `[Project](https://linear.app/workspace/project/slug-id)`                     |
| **Milestones** | `[Name](url#milestone-id)`     | `[Phase 1](https://linear.app/workspace/project/slug/overview#milestone-abc)` |
| **Labels**     | `[name](url)`                  | `[bug](https://linear.app/workspace/issue-label/bug)`                         |
| **Users**      | `@username` or `@Display Name` | `@john` or `@John Doe`                                                        |

**What doesn't work:**

- ❌ Plain identifiers: `ENG-123`
- ❌ @ symbol for issues: `@ENG-123`
- ❌ # symbol for issues: `#ENG-123`
- ❌ Square brackets alone: `[ENG-123]`

**Example with cross-references:**

```markdown
## Task Overview

This task ([ENG-123](https://linear.app/workspace/issue/ENG-123)) is assigned to @john.

### Dependencies

- Depends on: [ENG-122](https://linear.app/workspace/issue/ENG-122)
- Part of [API Project](https://linear.app/workspace/project/api-redesign-abc)

### Documentation

See [Technical Spec](https://linear.app/workspace/document/tech-spec-123).

### Milestone

Targeting [Phase 2](https://linear.app/workspace/project/api-redesign-abc/overview#milestone-xyz).

Tagged: [backend](https://linear.app/workspace/issue-label/backend)
```

#### Content Length Limits

| Resource | Field       | Limit              |
| -------- | ----------- | ------------------ |
| Project  | description | 255 characters     |
| Project  | content     | ~200KB (estimated) |
| Issue    | description | ~200KB             |
| Document | content     | ~200KB             |
| Comment  | body        | ~200KB (estimated) |

**Supported Markdown Features:**

- ✅ Headers, bold, italic, code blocks
- ✅ Lists, tables, blockquotes
- ✅ Mermaid diagrams (flowcharts, sequence, state, gantt, ER)
- ✅ Interactive checklists
- ✅ Syntax highlighting in code blocks
- ✅ Cross-references with full URLs

## 🤖 AI Agent Integration

This CLI was built from the ground up for AI coding agents. See the [AI Agent Guide](./docs/AI_AGENT_GUIDE.md) for:

- JSON output patterns
- Error handling
- VCS context usage
- Bulk operations
- Full workflow automation examples

### Quick Integration

```typescript
import { execSync } from "child_process"

// Get current issue from VCS
const result = execSync("linear issue view --json").toString()
const issue = JSON.parse(result).issue

// Create related document
execSync(`linear document create \
  --current-project \
  --title "Notes for ${issue.title}" \
  --json`)
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

### For Users
- [Installation Guide](./docs/INSTALLATION.md) - Detailed setup instructions
- [Usage Guide](./docs/USAGE.md) - Comprehensive command reference
- [AI Agent Guide](./docs/AI_AGENT_GUIDE.md) - AI integration patterns
- [Changelog](./CHANGELOG.md) - Version history

### For AI Agents
- [EXAMPLE_CLAUDE.md](./EXAMPLE_CLAUDE.md) - Guidance for Claude/Claude Code
- [EXAMPLE_AGENTS.md](./EXAMPLE_AGENTS.md) - Guidance for ChatGPT, Copilot, etc.

### For Developers
- [CLAUDE.md](./CLAUDE.md) - Development guide for Claude Code working on source
- [AGENTS.md](./AGENTS.md) - Development guide for other AI agents working on source

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

- **Original Author**: [@schpet](https://github.com/schpet) - Created the foundational Linear CLI that this project builds upon
- **Inspiration**: [@dexhorthy](https://x.com/dexhorthy) and [@vaibcode](https://x.com/vaibcode) - Their insights on using Linear as a collaboration platform for AI-human teams and spec-driven software engineering have been invaluable. Thank you for sharing your learnings and pioneering this approach to AI-human collaboration.
- **AI Enhancements**: Extended for AI agent use cases with cross-entity operations, comprehensive JSON output, VCS integration, and the Linear CLI Expert skill for Claude Code

## 🔗 Links

- [Linear API Documentation](https://developers.linear.app/docs)
- [Original CLI Repository](https://github.com/schpet/linear-cli)
- [Report Issues](https://github.com/juanbermudez/linear-agent-cli/issues)
- [Discussions](https://github.com/juanbermudez/linear-agent-cli/discussions)

---

**Made for AI agents** 🤖 | **Built with** [Deno](https://deno.land/) | **Powered by** [Linear](https://linear.app/)
