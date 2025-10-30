---
name: linear-cli-expert
description: Expert guidance for using the Linear CLI to manage issues, projects, documents, and team workflows. This skill should be used when users need to interact with Linear for issue tracking, project management, creating PRDs/tech specs, setting up team label structures, managing issue relationships and dependencies, or automating Linear workflows. Particularly valuable for setting up new projects, organizing team workflows, creating structured documentation, and managing complex issue hierarchies with milestones and relationships.
---

# Linear CLI Expert

Expert assistant for the Linear CLI - a comprehensive command-line tool for Linear project management, optimized for AI agents and automation.

## Overview

The Linear CLI enables complete programmatic control over Linear workspaces, including:

- **Issue Management**: Create, update, and organize issues with full metadata
- **Project Management**: Manage projects with milestones, status updates, and rich content
- **Team Organization**: Set up label hierarchies, workflows, and team structures
- **Documentation**: Create PRDs, technical specifications, and project documents
- **Relationship Management**: Track dependencies, blockers, and related work
- **Automation**: Template-based workflows for consistent processes

## Core Capabilities

### 1. Issue Management with Full Metadata

Create and manage issues with comprehensive metadata including relationships, milestones, cycles, and hierarchical labels.

**When to use**:

- Creating bug reports, features, or tasks
- Tracking work in sprints or milestones
- Managing dependencies between issues
- Organizing work with label hierarchies

**Key Features**:

- Full CRUD operations on issues
- Parent/child hierarchies for epics and subtasks
- Issue relationships (blocks, related, duplicate, similar)
- Milestones and cycle assignments
- Label groups with hierarchical structure
- VCS integration (auto-detects issue from git branch)

**Common Commands**:

```bash
# Create issue with full metadata
linear issue create \
  --title "Implement OAuth 2.0" \
  --team ENG \
  --priority 1 \
  --estimate 8 \
  --assignee @me \
  --label Backend Security \
  --project "Auth System" \
  --milestone "Phase 1" \
  --blocks ENG-100 ENG-101 \
  --json

# Update issue
linear issue update ENG-123 \
  --state "In Progress" \
  --assignee jane \
  --json

# View with all metadata
linear issue view ENG-123 --json
```

**Use Python wrapper for complex operations**:

```python
from scripts.linear_wrapper import LinearCLI

cli = LinearCLI()
result = cli.create_issue(
    title="Fix authentication bug",
    team="ENG",
    priority=1,
    labels=["Bug", "Security"],
    blocks=["ENG-100"]
)
```

### 2. Template-Based Workflows

Use pre-configured templates for consistent issue and project creation across the team.

**Available Templates**:

- `assets/templates/issue-bug.json` - Bug report template
- `assets/templates/issue-feature.json` - Feature request template
- `assets/templates/issue-task.json` - Task template
- `assets/templates/project-template.json` - Project structure with milestones

**Using Templates**:

```bash
# Create issue from template with variable substitution
python3 scripts/create_from_template.py issue assets/templates/issue-bug.json

# With variables file
cat > vars.json <<EOF
{
  "TITLE": "Login fails on mobile",
  "TEAM": "ENG",
  "BUG_DESCRIPTION": "Users cannot log in on iOS devices",
  "STEP_1": "Open app on iOS",
  "STEP_2": "Enter credentials",
  "STEP_3": "Click login button"
}
EOF

python3 scripts/create_from_template.py issue assets/templates/issue-bug.json vars.json
```

**Customizing Templates**: Templates use `{{VARIABLE}}` syntax for substitution. Edit templates in `assets/templates/` to match your team's needs.

### 3. Label Hierarchy Management

Organize work using hierarchical label groups for better categorization.

**Setup Team Labels**:

```bash
# Automated label setup for a team
bash scripts/setup_labels.sh ENG
```

This creates:

- **Work-Type** group: Feature, Bug, Enhancement, Refactor, Documentation
- **Scope** group: Frontend, Backend, API, Database, Infrastructure, DevOps
- **Priority** group: Critical, High, Medium, Low
- **Status** labels: Blocked, Needs-Review, In-Testing, Ready-to-Deploy

**Custom Label Structure**: Modify `assets/config/label-structure.json` to customize label hierarchy for your organization.

**Using Labels**:

```bash
# Labels display as "parent/child"
linear issue create \
  --title "Fix API bug" \
  --label Bug Backend \
  --team ENG \
  --json
# Result: Labels show as "Work-Type/Bug, Scope/Backend"
```

### 4. Project Management with Milestones

Create and manage projects with structured phases, milestones, and status tracking.

**Complete Project Setup**:

```bash
# 1. Create project
PROJECT=$(linear project create \
  --name "Mobile App Redesign" \
  --description "Complete redesign of mobile experience" \
  --content "$(cat project-overview.md)" \
  --team ENG \
  --lead @me \
  --priority 1 \
  --start-date 2026-01-01 \
  --target-date 2026-06-30 \
  --json)

PROJECT_ID=$(echo "$PROJECT" | jq -r '.project.id')
PROJECT_SLUG=$(echo "$PROJECT" | jq -r '.project.slug')

# 2. Create milestones
linear project milestone create $PROJECT_ID \
  --name "Phase 1: Foundation" \
  --target-date 2026-03-31 \
  --json

linear project milestone create $PROJECT_ID \
  --name "Phase 2: Features" \
  --target-date 2026-05-31 \
  --json

# 3. Create issues linked to project and milestone
linear issue create \
  --title "Setup authentication flow" \
  --team ENG \
  --project "$PROJECT_SLUG" \
  --milestone "Phase 1: Foundation" \
  --priority 1 \
  --json

# 4. Add status update
linear project update-create $PROJECT_SLUG \
  --body "$(cat assets/templates/status-update.md)" \
  --health onTrack \
  --json
```

### 5. Issue Relationships & Dependencies

Manage complex dependencies between issues for better workflow visibility.

**Relationship Types**:

- `--blocks`: This issue must be completed before others
- `--related-to`: General relationship between issues
- `--duplicate-of`: Mark issue as duplicate
- `--similar-to`: Link similar issues

**Managing Dependencies**:

```bash
# Create foundation work
DB=$(linear issue create \
  --title "Database schema design" \
  --team ENG \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# Create dependent work
linear issue create \
  --title "API implementation" \
  --team ENG \
  --blocks $DB \
  --json

linear issue create \
  --title "Frontend integration" \
  --team ENG \
  --blocks $DB \
  --json

# View all relationships
linear issue relations $DB --json
```

**See `references/relationship-patterns.md` for comprehensive relationship management patterns.**

### 6. Documentation Creation

Create structured technical documentation linked to projects.

**Document Templates**:

- `assets/templates/prd.md` - Product Requirements Document
- `assets/templates/tech-spec.md` - Technical Specification
- `assets/templates/status-update.md` - Status Update

**Creating Documents**:

```bash
# Customize template
cat assets/templates/prd.md | sed 's/{{PROJECT_NAME}}/OAuth System/g' > prd.md
# ... edit prd.md with your content ...

# Create in Linear
linear document create \
  --title "OAuth System PRD" \
  --content "$(cat prd.md)" \
  --project "Auth System" \
  --json

# Or use VCS context to auto-detect project
linear document create \
  --title "Technical Spec: OAuth Flow" \
  --content "$(cat tech-spec.md)" \
  --current-project \
  --json
```

### 7. Workflow Automation

Automate repetitive workflows using scripts and templates.

**Common Automation Patterns**:

**A. Sprint/Cycle Setup**:

```bash
#!/bin/bash
# setup-sprint.sh
SPRINT="Sprint 5"
TEAM="ENG"

# Create sprint epic
EPIC=$(linear issue create \
  --title "$SPRINT Planning" \
  --team $TEAM \
  --cycle "$SPRINT" \
  --json | jq -r '.issue.identifier')

# Create sprint tasks
for task in "Backend work" "Frontend work" "Testing" "Documentation"; do
  linear issue create \
    --title "$task" \
    --team $TEAM \
    --parent $EPIC \
    --cycle "$SPRINT" \
    --assignee @me \
    --json
done
```

**B. Release Planning**:

```bash
# Create release milestone
PROJECT_ID=$(linear project view mobile-app --json | jq -r '.project.id')

linear project milestone create $PROJECT_ID \
  --name "v2.0 Release" \
  --target-date 2026-06-30 \
  --json

# Create release tasks
linear issue create \
  --title "Release notes" \
  --milestone "v2.0 Release" \
  --json

linear issue create \
  --title "QA testing" \
  --milestone "v2.0 Release" \
  --json
```

**C. Bug Triage Workflow**:

```python
# triage-bugs.py
from scripts.linear_wrapper import LinearCLI

cli = LinearCLI()

# Create bug from template
result = cli.create_issue(
    title="Login failure on mobile",
    team="ENG",
    priority=1,
    labels=["Bug", "Mobile"],
    description="""
## Bug Description
Users report login failures on iOS devices.

## Steps to Reproduce
1. Open app on iOS
2. Enter credentials
3. Click login

## Expected vs Actual
Expected: Successful login
Actual: Error message displayed
    """
)

issue_id = result['issue']['identifier']
print(f"Created bug: {issue_id}")
```

## Workflow Decision Tree

**Start Here**: What do you need to do in Linear?

### I need to create issues

1. **Simple issue**: Use `linear issue create` with required options
2. **Consistent format**: Use template - `python3 scripts/create_from_template.py issue assets/templates/[template].json`
3. **Bulk creation**: Use Python wrapper in a loop
4. **With dependencies**: Add `--blocks`, `--related-to` flags

→ See **Capability 1: Issue Management** above

### I need to set up a project

1. **Quick project**: Use `linear project create` directly
2. **Full project with milestones**: Use project template
3. **With documentation**: Create project, then use document templates

→ See **Capability 4: Project Management** above

### I need to organize labels

1. **First time setup**: Run `bash scripts/setup_labels.sh TEAM`
2. **Custom structure**: Modify `assets/config/label-structure.json`, then run setup script
3. **Single label**: Use `linear label create --name "..." --team TEAM`
4. **Label hierarchy**: Create parent with `--is-group`, then children with `--parent`

→ See **Capability 3: Label Hierarchy** above

### I need to create documentation

1. **PRD**: Customize `assets/templates/prd.md`
2. **Tech Spec**: Customize `assets/templates/tech-spec.md`
3. **Status Update**: Customize `assets/templates/status-update.md`
4. **Create in Linear**: Use `linear document create --content "$(cat file.md)"`

→ See **Capability 6: Documentation** above

### I need to manage dependencies

1. **Create blocking relationship**: Use `--blocks ISSUE-ID` when creating
2. **Add relationship later**: Use `linear issue relate ISSUE1 ISSUE2 --blocks`
3. **View relationships**: Use `linear issue relations ISSUE-ID --json`
4. **Complex patterns**: See `references/relationship-patterns.md`

→ See **Capability 5: Issue Relationships** above

### I need to automate workflows

1. **Repeatable processes**: Create bash script using Linear CLI commands
2. **Error handling**: Use Python wrapper from `scripts/linear_wrapper.py`
3. **Template-based**: Use `scripts/create_from_template.py`

→ See **Capability 7: Workflow Automation** above

## User Preferences & Customization

The skill includes customizable preferences in `assets/config/preferences.json`:

```json
{
  "team": {
    "default_team": "ENG"
  },
  "workflow": {
    "type": "agile",
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

**Adapting to User Preferences**:

1. Read preferences file to understand user's workflow
2. Apply defaults when creating issues/projects
3. Use preferred label structure
4. Follow naming conventions

**Example Workflow Adaptation**:

```bash
# Read user preferences
TEAM=$(jq -r '.team.default_team' assets/config/preferences.json)
PRIORITY=$(jq -r '.issue_defaults.priority' assets/config/preferences.json)

# Create issue with user defaults
linear issue create \
  --title "Task" \
  --team $TEAM \
  --priority $PRIORITY \
  --assignee @me \
  --json
```

## Key Commands Reference

**Quick reference - see `references/command-reference.md` for complete documentation.**

### Issues

```bash
linear issue create --title "..." --team TEAM --json
linear issue update TEAM-NUM --state "..." --json
linear issue view TEAM-NUM --json
linear issue list --team TEAM --json
linear issue relate TEAM-NUM1 TEAM-NUM2 --blocks
linear issue relations TEAM-NUM --json
```

### Projects

```bash
linear project create --name "..." --team TEAM --json
linear project update SLUG --content "..." --json
linear project milestone create UUID --name "..." --json
linear project update-create SLUG --body "..." --health onTrack --json
```

### Labels

```bash
linear label create --name "..." --team TEAM --json
linear label create --name "..." --parent "..." --team TEAM --json
linear label list --team TEAM --json
```

### Documents

```bash
linear document create --title "..." --content "$(cat file.md)" --project "..." --json
```

## Best Practices

### 1. Always Use JSON Output

```bash
# ✓ Correct: Programmatic output
linear issue create --title "Task" --json

# ✗ Incorrect: Human-readable only
linear issue create --title "Task"
```

### 2. Check Success in Responses

```bash
RESULT=$(linear issue create --title "Task" --team ENG --json)
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
else
  echo "Error: $(echo "$RESULT" | jq -r '.error.message')"
fi
```

### 3. Use Templates for Consistency

```bash
# Ensures consistent structure across team
python3 scripts/create_from_template.py issue assets/templates/issue-bug.json
```

### 4. Leverage VCS Context

```bash
# On branch: feature/ENG-123-oauth
linear issue view      # Automatically shows ENG-123
linear issue update --state "In Progress"  # Updates ENG-123
```

### 5. Keep Content in Files

```bash
# ✓ Correct: Content in files
linear issue create --description "$(cat spec.md)" --json

# ✗ Incorrect: Inline long content
linear issue create --description "Very long text..." --json
```

### 6. Use Hierarchical Labels

```bash
# ✓ Correct: Organized label groups
linear issue create --label Bug Backend --json
# Shows as: "Work-Type/Bug, Scope/Backend"

# ✗ Incorrect: Flat labels only
linear issue create --label bug --json
```

### 7. Document Relationships in Descriptions

```bash
linear issue create \
  --title "Implement feature X" \
  --description "$(cat <<'EOF'
## Dependencies
- [ENG-100](https://linear.app/workspace/issue/ENG-100) - API setup
- [ENG-101](https://linear.app/workspace/issue/ENG-101) - Database schema
EOF
)" \
  --blocks ENG-100 ENG-101 \
  --json
```

## Important Notes

### User References

- Use `@me` for yourself, NOT `self`
- Use username or email for others

### Labels

- Space-separated: `--label A B C`
- NOT repeated: `--label A --label B` ❌

### Label Groups

- Parent must have `--is-group` flag
- Children use `--parent "ParentName"`
- Display as `parent/child`

### Milestones

- Require project UUID (not slug)
- Get UUID: `linear project view SLUG --json | jq -r '.project.id'`

### Cross-References

- Use markdown links with full URLs
- Format: `[Text](https://linear.app/...)`
- Plain text like `ENG-123` won't link ❌

### Content Fields

- Project description: Max 255 chars
- Project content: ~200KB
- Use files for long content: `--content "$(cat file.md)"`

### Relationships

- All types are bidirectional
- View both directions with `issue relations`
- Types: blocks, related, duplicate, similar

### Error Handling

- Always check `success` field in JSON responses
- Use Python wrapper for automatic retry logic
- See `references/json-api.md` for error codes

## Resources

This skill includes comprehensive resources:

### scripts/

Executable utilities for common operations:

- `linear_wrapper.py` - Python API wrapper with error handling and retry logic
- `setup_labels.sh` - Initialize team label hierarchy
- `create_from_template.py` - Create issues/projects from JSON templates

### references/

Detailed documentation to load as needed:

- `command-reference.md` - Complete command syntax reference
- `relationship-patterns.md` - Patterns for managing issue dependencies
- `json-api.md` - JSON response formats and parsing examples

### assets/templates/

Ready-to-use templates:

- `issue-bug.json` - Bug report template
- `issue-feature.json` - Feature request template
- `issue-task.json` - Task template
- `project-template.json` - Project structure with milestones
- `prd.md` - Product Requirements Document
- `tech-spec.md` - Technical Specification
- `status-update.md` - Project Status Update

### assets/config/

Customizable configuration:

- `preferences.json` - Workflow preferences and defaults
- `label-structure.json` - Team label hierarchy template

---

**When to Load Additional Resources**:

- Need complete command syntax? → Load `references/command-reference.md`
- Managing complex dependencies? → Load `references/relationship-patterns.md`
- Parsing JSON responses? → Load `references/json-api.md`
- Need specific template? → Load from `assets/templates/`

**For detailed Linear CLI usage, refer to the main repository documentation at `docs/USAGE.md`.**
