# Installation Guide

## Prerequisites

- [Deno](https://deno.land/) (v2.0 or later)
- Linear API key ([create one here](https://linear.app/settings/api))

## Installing Deno

### macOS / Linux
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### Windows
```powershell
irm https://deno.land/install.ps1 | iex
```

### Using Homebrew (macOS)
```bash
brew install deno
```

## Installing linear-cli

### Install from Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/juanbermudez/linear-agent-cli.git
cd linear-agent-cli

# Install globally
deno task install
```

The CLI will be installed as `linear` and available globally in your terminal.

### Verify Installation

```bash
linear --version
```

## Setup

### 1. Get Your Linear API Key

1. Go to [Linear API Settings](https://linear.app/settings/api)
2. Click "Create key"
3. Give it a name (e.g., "CLI Access")
4. Copy the generated key (starts with `lin_api_`)

### 2. Configure the CLI

Run the setup wizard:

```bash
linear config setup
```

This will:
- Prompt you to enter your API key
- Let you select a default team
- Create a `.linear.toml` configuration file in your project directory

### 3. Verify Setup

```bash
linear team list
```

If you see your teams, you're all set!

## Configuration File

The CLI stores configuration in `.linear.toml` files. It searches for config in this order:

1. `./linear.toml` (current directory)
2. `./.linear.toml` (current directory, hidden)
3. Git root directory (if in a git repo)
4. `.config/linear.toml` (in git root)

Example `.linear.toml`:

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
confirmDestructive = true

[output]
format = "text"
color = true

[vcs]
autoDetectContext = true
```

## Environment Variables

You can also set configuration via environment variables:

```bash
export LINEAR_API_KEY="lin_api_..."
export LINEAR_TEAM="ENG"
```

Environment variables take precedence over config file values.

## Updating

To update to the latest version:

```bash
cd linear-agent-cli
git pull
deno task install
```

## Uninstalling

```bash
deno task uninstall
```

Or manually:

```bash
deno uninstall -g linear
```

## Troubleshooting

### "Command not found: linear"

Make sure Deno's bin directory is in your PATH:

```bash
export PATH="$HOME/.deno/bin:$PATH"
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent.

### "Permission denied" errors

The CLI needs the following permissions:
- `--allow-env` - Read environment variables
- `--allow-read` - Read config files
- `--allow-write` - Write config files
- `--allow-run` - Run git/jj commands for VCS integration
- `--allow-net=api.linear.app` - Make API requests to Linear

These are automatically granted during installation via `deno task install`.

### "Invalid API key" errors

1. Check your API key is correct: `linear config get auth.token`
2. Regenerate your key at [Linear API Settings](https://linear.app/settings/api)
3. Update your config: `linear config set auth.token "lin_api_..."`

### GraphQL errors

If you see GraphQL validation errors, the Linear API schema may have changed. Try:

```bash
deno task sync-schema  # Sync latest GraphQL schema
deno task codegen      # Regenerate types
deno task install      # Reinstall CLI
```
