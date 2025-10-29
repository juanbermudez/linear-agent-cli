# Linear CLI Examples

Practical examples and demo scripts for using the Linear CLI with any workspace.

## Quick Start

### Option A: Interactive Setup (Recommended)

The easiest way to get started:

```bash
# Run the interactive setup wizard
linear config setup  # or: linear config init

# The wizard will guide you through:
# • API key setup (with masked input)
# • Workspace and team selection
# • Cache and auto-branch preferences
# • Configuration file generation
```

### Option B: Manual Setup

1. **Set your workspace and team**:
```bash
export LINEAR_API_KEY="lin_api_YOUR_KEY"
export LINEAR_WORKSPACE="your-workspace"
export LINEAR_TEAM_ID="YOUR-TEAM"
```

2. **Run Setup Script**:
```bash
cd examples/scripts
chmod +x *.sh
./setup-demo.sh
```

3. **See Features**:
```bash
./demo-features.sh
```

4. **Create Demo Project**:
```bash
./create-ai-project.sh
```

## Files

### Documentation

- **[DEMO.md](./DEMO.md)** - Comprehensive guide with 12 parts covering all features, real-world use cases, and AI agent automation examples

### Scripts

All scripts are in the `scripts/` directory:

#### 1. setup-demo.sh
Initial configuration and environment setup.

**What it does**:
- Checks Linear CLI installation
- Verifies API key
- Configures workspace and team
- Warms up caches
- Creates `.linear.toml` config file
- Tests connection

**Usage**:
```bash
./setup-demo.sh
```

**Requirements**:
- Linear API key (get at https://linear.app/settings/api)

---

#### 2. demo-features.sh
Interactive demonstration of all CLI features.

**What it demonstrates**:
- Configuration system
- Workflow management with caching
- Project status management
- Issue management
- JSON output for AI agents
- Label management
- Cache performance comparison
- Flexible resource identification
- VCS integration
- Cross-entity operations
- Environment variable precedence

**Usage**:
```bash
./demo-features.sh
```

**Duration**: ~5 minutes (interactive with pauses)

---

#### 3. create-ai-project.sh
Creates a complete demo project with issues and documents.

**What it creates**:
- 1 Project: "🤖 AI Investment Analysis Tool"
- 8 Issues with priorities and labels
- 3 Documents (Technical Spec, Meeting Notes, Implementation)
- 3 Labels (demo-ai, demo-backend, demo-frontend)

**Usage**:
```bash
./create-ai-project.sh
```

**Output**: Creates `project-summary-YYYYMMDD-HHMMSS.json` with all created resource IDs

---

#### 4. ai-agent-automation.sh
Examples of AI agent automation patterns.

**What it shows**:
- Daily standup report generation
- Automated issue triage
- Sprint planning assistant
- Project health dashboard
- Smart label suggestions
- Workflow state automation
- Release notes generation

**Usage**:
```bash
./ai-agent-automation.sh
```

---

## Workspace Configuration

Configure these environment variables for your workspace:
```bash
export LINEAR_WORKSPACE="your-workspace"
export LINEAR_TEAM_ID="YOUR-TEAM"
export LINEAR_API_KEY="lin_api_YOUR_KEY"
```

Or use the CLI configuration file `.linear.toml`:
```toml
[defaults]
workspace = "your-workspace"
team_id = "YOUR-TEAM"

[auth]
token = "lin_api_YOUR_KEY"
```

## Features Demonstrated

### 1. Configuration Management
- Environment variables vs config files
- Precedence order
- Per-directory configuration

### 2. Caching System
- Automatic 24-hour caching
- Cache performance comparison
- Force refresh with `--refresh` flag

### 3. Workflow Management
- List workflow states with colors
- Cache workflows per team
- JSON output for automation

### 4. Project & Issue Management
- Create projects with documents
- Create and manage issues
- Cross-entity operations
- Flexible resource identification

### 5. AI Agent Automation
- JSON parsing with `jq`
- Automated reporting
- Smart categorization
- Workflow automation

## Prerequisites

1. **Install Linear CLI**:
```bash
curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
```

2. **Get API Key**:
   - Go to https://linear.app/settings/api
   - Create new key
   - Copy key (starts with `lin_api_`)

3. **Set API Key**:
```bash
export LINEAR_API_KEY="lin_api_YOUR_KEY"
echo 'export LINEAR_API_KEY="lin_api_YOUR_KEY"' >> ~/.zshrc
```

## Running the Examples

### Option A: Full Demo (Recommended)
```bash
cd examples/scripts

# 1. Setup
./setup-demo.sh

# 2. See features
./demo-features.sh

# 3. Create project
./create-ai-project.sh

# 4. See automation
./ai-agent-automation.sh
```

### Option B: Individual Commands
```bash
# List workflows (using configured team from env or config)
linear workflow list

# List statuses
linear status list

# List issues
linear issue list

# Create project
linear project create --name "My Project" --with-doc

# Get JSON output for AI agents
linear issue list --json | jq '.issues[0]'
```

## Troubleshooting

### "Command not found: linear"
```bash
# Check installation
which linear

# If not found, add to PATH
export PATH="$HOME/.deno/bin:$PATH"
```

### "Please set LINEAR_API_KEY"
```bash
# Set API key
export LINEAR_API_KEY="lin_api_YOUR_KEY"

# Verify
echo $LINEAR_API_KEY
```

### "Failed to connect to Linear"
1. Check API key is correct
2. Verify workspace access
3. Confirm team exists
4. Test connection: `linear team list`

### Cache Issues
```bash
# Clear cache
rm -rf ~/.cache/linear-cli/

# Disable cache
export LINEAR_CACHE_ENABLED=false
```

## Advanced Usage

### Custom Automation

Create your own automation script:

```bash
#!/bin/bash
# my-automation.sh

# Get all high-priority issues
linear issue list --json | \
  jq '.issues[] | select(.priority == 1)' > high-priority.json

# Create sprint from high-priority issues
PROJECT=$(linear project create --name "Sprint 23" --json)
PROJECT_ID=$(echo "$PROJECT" | jq -r '.project.id')

cat high-priority.json | jq -r '.id' | while read ISSUE_ID; do
  linear issue update "$ISSUE_ID" --project "$PROJECT_ID"
done
```

### Integration with CI/CD

```yaml
# .github/workflows/linear-update.yml
name: Update Linear on Deploy

on:
  deployment_status:

jobs:
  update-linear:
    runs-on: ubuntu-latest
    steps:
      - name: Install Linear CLI
        run: |
          curl -fsSL https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/install.sh | bash
          export PATH="$HOME/.deno/bin:$PATH"

      - name: Update issue status
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: |
          linear issue update ${{ github.event.deployment.payload.issue_id }} \
            --status "Done" \
            --comment "Deployed to production"
```

## Example Outputs

### Workflow List
```
Type          Name            Position  ID
● triage      Triage          0         abc123
● backlog     Backlog         1         def456
● unstarted   Todo            2         ghi789
● started     In Progress     3         jkl012
✓ completed   Done            4         mno345
✗ canceled    Canceled        5         pqr678
```

### Project Summary JSON
```json
{
  "project": {
    "id": "abc123",
    "name": "AI Investment Analysis Tool",
    "url": "https://linear.app/workspace/project/...",
    "team": "TEAM"
  },
  "issues": ["TEAM-123", "TEAM-124", "TEAM-125"],
  "documents": ["doc1", "doc2", "doc3"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Resources

- **Main Documentation**: [../README.md](../README.md)
- **AI Agent Guide**: [../docs/AI_AGENT_GUIDE.md](../docs/AI_AGENT_GUIDE.md)
- **Installation Guide**: [../docs/INSTALLATION.md](../docs/INSTALLATION.md)
- **Repository**: https://github.com/juanbermudez/linear-agent-cli
- **Linear API**: https://developers.linear.app/docs

## Contributing

Have a useful example or automation script? Contributions welcome!

1. Create your script in `examples/scripts/`
2. Add documentation to this README
3. Submit a pull request

## License

MIT License - see [../LICENSE](../LICENSE) for details
