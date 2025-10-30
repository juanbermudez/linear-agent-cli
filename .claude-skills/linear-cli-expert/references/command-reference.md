# Linear CLI Command Reference

Quick reference for all Linear CLI commands with common options and patterns.

## Issues

### Create Issue

```bash
linear issue create \
  --title "string" \
  --team TEAM \
  [--description "string or $(cat file.md)"] \
  [--assignee @me|username] \
  [--priority 1-4] \
  [--estimate number] \
  [--label label1 label2...] \
  [--project "Project Name"] \
  [--milestone "Milestone Name"] \
  [--cycle "Cycle Name"] \
  [--parent TEAM-NUM] \
  [--state "State Name"] \
  [--due-date YYYY-MM-DD] \
  [--blocks TEAM-NUM1 TEAM-NUM2...] \
  [--related-to TEAM-NUM...] \
  [--duplicate-of TEAM-NUM] \
  [--similar-to TEAM-NUM] \
  --json
```

### Update Issue

```bash
linear issue update TEAM-NUM \
  [same options as create] \
  --json
```

### View Issue

```bash
linear issue view TEAM-NUM --json
linear issue view --json  # Uses VCS context
```

### List Issues

```bash
linear issue list [--team TEAM] --json
```

### Issue Relationships

```bash
# Create relationships
linear issue relate TEAM-NUM1 TEAM-NUM2 --blocks
linear issue relate TEAM-NUM1 TEAM-NUM2 --related-to
linear issue relate TEAM-NUM1 TEAM-NUM2 --duplicate-of
linear issue relate TEAM-NUM1 TEAM-NUM2 --similar-to

# Remove relationship
linear issue unrelate TEAM-NUM1 TEAM-NUM2

# View relationships
linear issue relations TEAM-NUM --json
```

### Issue State Management

```bash
linear issue start TEAM-NUM     # Move to "In Progress"
linear issue stop TEAM-NUM      # Move to "Todo"
linear issue complete TEAM-NUM  # Move to "Done"
```

## Projects

### Create Project

```bash
linear project create \
  --name "string" \
  --team TEAM \
  [--description "string (max 255 chars)"] \
  [--content "$(cat markdown-file.md)"] \
  [--lead @me|username] \
  [--color "#RRGGBB"] \
  [--start-date YYYY-MM-DD] \
  [--target-date YYYY-MM-DD] \
  [--priority 0-4] \
  [--status "Status Name"] \
  --json
```

### Update Project

```bash
linear project update PROJECT-SLUG \
  [--name "string"] \
  [--content "$(cat updated.md)"] \
  [--lead username] \
  [--priority number] \
  [--status "Status Name"] \
  --json
```

### View Project

```bash
linear project view PROJECT-SLUG --json
```

### List Projects

```bash
linear project list [--team TEAM] --json
```

### Project Milestones

```bash
# Create milestone (requires UUID)
PROJECT_ID=$(linear project view SLUG --json | jq -r '.project.id')
linear project milestone create $PROJECT_ID \
  --name "Phase 1" \
  [--description "string"] \
  [--target-date YYYY-MM-DD] \
  --json

# List milestones
linear project milestone list --project SLUG --json
```

### Project Status Updates

```bash
linear project update-create PROJECT-SLUG \
  --body "$(cat update.md)" \
  --health onTrack|atRisk|offTrack \
  --json

# List updates
linear project update-list --project SLUG --json
```

## Labels

### Create Label

```bash
# Simple label
linear label create \
  --name "label-name" \
  --team TEAM \
  [--color "#RRGGBB"] \
  --json

# Label group (parent)
linear label create \
  --name "Group-Name" \
  --team TEAM \
  --is-group \
  [--color "#RRGGBB"] \
  --json

# Sub-label (child)
linear label create \
  --name "Sub-Label" \
  --team TEAM \
  --parent "Group-Name" \
  [--color "#RRGGBB"] \
  --json
```

### List Labels

```bash
linear label list [--team TEAM] --json
```

### Update Label

```bash
linear label update "Label Name" \
  [--name "New Name"] \
  [--color "#RRGGBB"] \
  --json
```

### Delete Label

```bash
linear label delete "Label Name" --json
```

## Initiatives

### Create Initiative

```bash
linear initiative create \
  --name "Initiative Name" \
  [--description "string"] \
  [--content "$(cat initiative.md)"] \
  [--owner @me|username] \
  --json
```

### Update Initiative

```bash
linear initiative update "Initiative Name" \
  [--name "New Name"] \
  [--content "$(cat updated.md)"] \
  [--owner username] \
  --json
```

### List Initiatives

```bash
linear initiative list [--status active|planned|completed] --json
```

## Documents

### Create Document

```bash
# In specific project
linear document create \
  --title "Document Title" \
  --content "$(cat doc.md)" \
  --project "Project Name" \
  --json

# In current project (VCS-aware)
linear document create \
  --title "Document Title" \
  --content "$(cat doc.md)" \
  --current-project \
  --json
```

### Update Document

```bash
linear document update "Document Title" \
  --content "$(cat updated.md)" \
  --json
```

### List Documents

```bash
linear document list [--project "Project Name"] --json
```

## Teams & Users

### List Teams

```bash
linear team list --json
```

### List Users

```bash
linear user list --json
linear user list --active-only --json
linear user list --admins-only --json
```

### Search Users

```bash
linear user search "name" --json
```

### Current User

```bash
linear whoami --json
```

## Workflow & Configuration

### List Workflow States

```bash
linear workflow list --team TEAM --json
```

### Cache Workflow States

```bash
linear workflow cache --team TEAM
```

### List Project Statuses

```bash
linear status list --json
```

### Configuration

```bash
# Get config
linear config get defaults.team

# Set config
linear config set defaults.team ENG

# Setup wizard
linear config setup
```

## Common Patterns

### Priority Values

- `1` = Urgent
- `2` = High
- `3` = Normal (default)
- `4` = Low

### Health Values (Projects)

- `onTrack` - On schedule
- `atRisk` - At risk
- `offTrack` - Off track

### User References

- `@me` - Yourself
- `username` - By username
- `email@domain.com` - By email

### Labels

- Space-separated: `--label A B C`
- NOT repeated flags: `--label A --label B` ❌

### Content from Files

```bash
# Read from file
linear issue create --title "Task" --description "$(cat spec.md)" --json

# Use heredoc
linear issue create --title "Task" --description "$(cat <<'EOF'
Multi-line
content
EOF
)" --json
```

### VCS Context

When on a git branch like `feature/ENG-123-description`, commands automatically detect the issue:

```bash
linear issue view      # Shows ENG-123
linear issue update --state "In Progress"  # Updates ENG-123
```

### Error Handling

Always check the `success` field in JSON responses:

```bash
RESULT=$(linear issue create --title "Task" --team ENG --json)
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
  echo "Created $ISSUE_ID"
else
  echo "Error: $(echo "$RESULT" | jq -r '.error.message')"
fi
```

## Output Formats

### JSON Output (Programmatic)

Always use `--json` for scripts and automation:

```bash
linear issue list --json | jq '.issues[].title'
```

### Human-Readable (Interactive)

Omit `--json` for terminal display:

```bash
linear issue list
```

## Cross-References in Markdown

All cross-references require markdown links with full URLs:

```markdown
# Issue Reference

[ENG-123](https://linear.app/workspace/issue/ENG-123)

# Project Reference

[Project Name](https://linear.app/workspace/project/slug)

# Document Reference

[Document Title](https://linear.app/workspace/document/id)

# User Mention

@username or @John Doe
```

Plain text like `ENG-123` or `#ENG-123` will NOT create links.
