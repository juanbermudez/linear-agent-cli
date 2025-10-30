# Claude Code Skills for Linear CLI

This directory contains specialized skills for Claude and Claude Code that enhance the Linear CLI experience with expert guidance, templates, and automation tools.

## 📦 Available Skills

### linear-cli-expert

A comprehensive skill that transforms Claude into an expert Linear CLI user with deep knowledge of workflows, templates, and best practices.

**Location**: `linear-cli-expert/` **Packaged Version**: `linear-cli-expert/linear-cli-expert.zip`

## 🎯 What are Claude Code Skills?

Skills are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. They act as "onboarding guides" for specific domains—transforming Claude from a general-purpose agent into a specialized expert.

### Anatomy of a Skill

```
linear-cli-expert/
├── SKILL.md                    # Main skill instructions (loaded when triggered)
├── scripts/                    # Executable utilities
│   ├── linear_wrapper.py       # Python API wrapper with retry logic
│   ├── setup_labels.sh         # Automated label hierarchy setup
│   └── create_from_template.py # Template-based creation
├── references/                 # Documentation (loaded as needed)
│   ├── command-reference.md    # Complete command syntax
│   ├── relationship-patterns.md # Issue dependency patterns
│   └── json-api.md             # JSON response formats
├── assets/                     # Files used in output
│   ├── templates/              # Ready-to-use templates
│   │   ├── issue-bug.json
│   │   ├── issue-feature.json
│   │   ├── issue-task.json
│   │   ├── project-template.json
│   │   ├── prd.md
│   │   ├── tech-spec.md
│   │   └── status-update.md
│   └── config/                 # Customizable configuration
│       ├── preferences.json
│       └── label-structure.json
└── linear-cli-expert.zip       # Packaged for distribution
```

## 🚀 Installation

### For Claude Code Users

**Option 1: Copy from Repository**

```bash
# Clone or navigate to the repository
cd linear-cli-main/.claude-skills/linear-cli-expert

# Copy to your Claude Code skills directory
cp -r . ~/.claude/skills/linear-cli-expert
```

**Option 2: Install from Package**

```bash
# Unzip the packaged skill
unzip linear-cli-main/.claude-skills/linear-cli-expert/linear-cli-expert.zip -d ~/.claude/skills/
```

**Verify Installation**

```bash
# Check that the skill is installed
ls ~/.claude/skills/linear-cli-expert/SKILL.md
```

### For Regular Claude Users

The skill package can be shared and installed in any Claude environment that supports skills:

```bash
# Share the packaged skill
linear-cli-main/.claude-skills/linear-cli-expert/linear-cli-expert.zip

# Recipients can install it in their Claude environment
```

## ⚙️ Configuration

The skill is highly customizable through configuration files in `assets/config/`:

### 1. Workflow Preferences (`preferences.json`)

Configure how the skill adapts to your team's workflow:

```json
{
  "team": {
    "default_team": "ENG"
  },
  "workflow": {
    "type": "agile", // agile, kanban, or custom
    "sprint_length_weeks": 2,
    "use_cycles": true,
    "use_milestones": true
  },
  "issue_defaults": {
    "assignee": "@me",
    "priority": 3
  },
  "label_structure": {
    "use_label_groups": true,
    "required_groups": ["Work-Type", "Scope"]
  }
}
```

### 2. Label Structure (`label-structure.json`)

Define your team's label hierarchy:

```json
{
  "label_groups": [
    {
      "name": "Work-Type",
      "children": [
        { "name": "Feature", "color": "#10B981" },
        { "name": "Bug", "color": "#EF4444" },
        { "name": "Enhancement", "color": "#3B82F6" }
      ]
    },
    {
      "name": "Scope",
      "children": [
        { "name": "Frontend", "color": "#EC4899" },
        { "name": "Backend", "color": "#14B8A6" },
        { "name": "API", "color": "#06B6D4" }
      ]
    }
  ]
}
```

## 🎨 Customizing Templates

All templates support variable substitution using `{{VARIABLE}}` syntax:

### Issue Templates

**Bug Report** (`assets/templates/issue-bug.json`):

```json
{
  "title": "{{TITLE}}",
  "team": "{{TEAM}}",
  "description": "## Bug Description\n{{BUG_DESCRIPTION}}\n\n## Steps to Reproduce\n1. {{STEP_1}}\n2. {{STEP_2}}",
  "priority": 1,
  "labels": ["Bug"]
}
```

**Feature Request** (`assets/templates/issue-feature.json`):

```json
{
  "title": "{{TITLE}}",
  "team": "{{TEAM}}",
  "description": "## User Story\nAs a {{USER_TYPE}}, I want to {{ACTION}} so that {{BENEFIT}}.",
  "estimate": 5,
  "labels": ["Feature"]
}
```

### Document Templates

**PRD** (`assets/templates/prd.md`):

- Product requirements document with sections for goals, user stories, technical requirements
- 300+ lines with comprehensive structure

**Technical Spec** (`assets/templates/tech-spec.md`):

- Architecture, API design, data models, testing strategy
- 400+ lines with detailed technical sections

**Status Update** (`assets/templates/status-update.md`):

- Weekly/sprint status updates with metrics, highlights, blockers
- Progress tracking and timeline visualization

### Using Templates

```bash
# Create issue from template
python3 scripts/create_from_template.py issue assets/templates/issue-bug.json

# With variables file
cat > vars.json <<EOF
{
  "TITLE": "Login fails on mobile",
  "TEAM": "ENG",
  "BUG_DESCRIPTION": "Users cannot log in on iOS devices"
}
EOF

python3 scripts/create_from_template.py issue assets/templates/issue-bug.json vars.json
```

## 🛠️ Using the Scripts

### 1. Python API Wrapper (`scripts/linear_wrapper.py`)

Provides a Python interface with error handling and retry logic:

```python
from scripts.linear_wrapper import LinearCLI

cli = LinearCLI()

# Create issue
result = cli.create_issue(
    title="Fix authentication bug",
    team="ENG",
    priority=1,
    labels=["Bug", "Security"],
    blocks=["ENG-100"]
)

print(f"Created: {result['issue']['identifier']}")

# Update issue
cli.update_issue("ENG-123", state="In Progress", priority=1)

# Get issue
issue = cli.get_issue("ENG-123")
```

### 2. Label Setup Script (`scripts/setup_labels.sh`)

Automate label hierarchy creation for your team:

```bash
# Setup standard label structure for a team
bash scripts/setup_labels.sh ENG

# Creates:
# - Work-Type/ (Feature, Bug, Enhancement, Refactor, Documentation)
# - Scope/ (Frontend, Backend, API, Database, Infrastructure, DevOps)
# - Priority/ (Critical, High, Medium, Low)
# - Status labels (Blocked, Needs-Review, In-Testing, Ready-to-Deploy)
```

### 3. Template Creation Script (`scripts/create_from_template.py`)

Create issues and projects from templates with variable substitution:

```bash
# Create from template
python3 scripts/create_from_template.py issue assets/templates/issue-bug.json

# With variables
python3 scripts/create_from_template.py issue assets/templates/issue-bug.json variables.json

# Create project
python3 scripts/create_from_template.py project assets/templates/project-template.json
```

## 📚 Reference Documentation

The skill includes comprehensive reference documentation in the `references/` directory:

### 1. Command Reference (`command-reference.md`)

Complete syntax for all Linear CLI commands:

- Issue operations (create, update, view, list, relate, relations)
- Project operations (create, update, milestones, status updates)
- Label operations (create, update, delete, groups)
- Document operations (create, update, list)
- User and team operations

### 2. Relationship Patterns (`relationship-patterns.md`)

Detailed guide to managing issue dependencies:

- 4 relationship types (blocks, related, duplicate, similar)
- 5 workflow patterns (epics, sequential features, cross-team, bugs, refactoring)
- Best practices and anti-patterns
- Integration with milestones and projects

### 3. JSON API Reference (`json-api.md`)

Complete guide to parsing CLI responses:

- Response schemas for all resources
- Error codes and handling
- Parsing examples in Bash, Python, and JavaScript
- Common patterns and filters

## 🎯 How Claude Uses the Skill

When you ask Claude to work with Linear, it will:

1. **Trigger the Skill**: The skill name and description help Claude recognize when to use it
2. **Load SKILL.md**: Core instructions and capabilities load into context
3. **Load Resources as Needed**: Claude loads references and templates when required
4. **Execute Operations**: Uses scripts and templates to complete tasks
5. **Adapt to Preferences**: Reads configuration to match your workflow

### Example Interactions

**"Create a bug report for the login issue"** → Claude loads bug template, asks for details, creates issue with proper structure

**"Set up our team's label hierarchy"** → Claude runs `setup_labels.sh` script with your team key

**"Generate a PRD for the OAuth feature"** → Claude uses PRD template, fills in details, creates Linear document

**"Show me all issues blocking ENG-123"** → Claude uses relationship patterns to query and visualize dependencies

**"Create a project with milestones for Q1"** → Claude uses project template with milestone structure

## 🔄 Skill Updates

The skill is versioned with the Linear CLI repository. To update:

```bash
# Pull latest changes
cd linear-cli-main
git pull

# Reinstall skill
cp -r .claude-skills/linear-cli-expert ~/.claude/skills/linear-cli-expert
```

## 🤝 Customization for Your Team

The skill is designed to be customized:

1. **Edit Preferences**: Modify `assets/config/preferences.json` to match your workflow
2. **Adjust Label Structure**: Update `assets/config/label-structure.json` for your labels
3. **Customize Templates**: Edit templates in `assets/templates/` to match your standards
4. **Add Team-Specific Scripts**: Add custom scripts to `scripts/` directory
5. **Extend Documentation**: Add team-specific guides to `references/`

## 📊 Skill Statistics

- **Total Lines**: 4,000+ lines of content
- **Scripts**: 3 executable utilities
- **Templates**: 7 ready-to-use templates
- **References**: 1,400+ lines of documentation
- **Configurations**: 2 customizable configs
- **Core Capabilities**: 7 documented workflows

## 🎓 Learning Resources

- **SKILL.md**: Main skill documentation with workflows and examples
- **Command Reference**: Complete CLI syntax in `references/command-reference.md`
- **Relationship Patterns**: Dependency management in `references/relationship-patterns.md`
- **JSON API**: Response formats in `references/json-api.md`
- **Main README**: Repository documentation at `../README.md`
- **Usage Guide**: Comprehensive guide at `../docs/USAGE.md`

## 🐛 Troubleshooting

### Skill Not Triggering

If Claude doesn't automatically use the skill:

1. Verify installation: `ls ~/.claude/skills/linear-cli-expert/SKILL.md`
2. Explicitly mention "Linear" in your request
3. Be specific: "Create a Linear issue" vs "Create an issue"

### Scripts Not Executing

If scripts fail to execute:

1. Make scripts executable: `chmod +x scripts/*.sh`
2. Ensure Python 3 is available: `python3 --version`
3. Check script paths are relative to skill directory

### Templates Not Found

If templates aren't working:

1. Verify template paths in `preferences.json`
2. Check templates exist: `ls assets/templates/`
3. Ensure JSON templates are valid: `jq . assets/templates/issue-bug.json`

## 💡 Tips for Best Results

1. **Keep Preferences Updated**: Review and update `preferences.json` as your workflow evolves
2. **Customize Templates**: Adapt templates to match your team's documentation standards
3. **Use Descriptive Requests**: Clear requests help Claude choose the right tools
4. **Leverage Scripts**: Use automation scripts for repetitive tasks
5. **Reference Documentation**: Claude can load references for complex operations

## 🔗 Links

- **Main Repository**: [linear-cli-main](../)
- **Installation Guide**: [docs/INSTALLATION.md](../docs/INSTALLATION.md)
- **Usage Guide**: [docs/USAGE.md](../docs/USAGE.md)
- **AI Agent Guide**: [docs/AI_AGENT_GUIDE.md](../docs/AI_AGENT_GUIDE.md)
- **Linear API Docs**: https://developers.linear.app/docs

---

**Built for Claude Code** 🎓 | **Optimized for Linear CLI** 🚀 | **Customizable for Your Team** ⚙️
