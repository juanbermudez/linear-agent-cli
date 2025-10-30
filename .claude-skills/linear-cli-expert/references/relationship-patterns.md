# Issue Relationship Patterns

Guide to effectively using issue relationships in Linear for dependency management, task organization, and workflow tracking.

## Relationship Types

### 1. Blocks (`--blocks`)

**Use when**: An issue must be completed before other issues can proceed.

**Pattern**: "This issue blocks other issues"

```bash
# ENG-100 blocks ENG-101 and ENG-102
linear issue create \
  --title "Database migration" \
  --team ENG \
  --blocks ENG-101 ENG-102 \
  --json
```

**Inverse**: When you view ENG-101, it shows "Blocked by: ENG-100"

**Common Scenarios**:

- Infrastructure work blocking feature development
- API changes blocking frontend implementation
- Database schema changes blocking data operations
- Authentication setup blocking feature development

### 2. Related To (`--related-to`)

**Use when**: Issues are connected but don't have hard dependencies.

**Pattern**: "This issue is related to other issues"

```bash
# Link related features
linear issue create \
  --title "Add dark mode to settings" \
  --team ENG \
  --related-to ENG-100 ENG-101 \
  --json
```

**Bidirectional**: Shows as "Related" on all connected issues

**Common Scenarios**:

- Features in the same epic or project
- Issues affecting the same component
- Bugs with similar root causes
- Tasks in the same sprint/milestone

### 3. Duplicate Of (`--duplicate-of`)

**Use when**: An issue is a duplicate of another issue.

**Pattern**: "This issue duplicates another issue"

```bash
# Mark as duplicate
linear issue create \
  --title "Login fails on mobile" \
  --team ENG \
  --duplicate-of ENG-123 \
  --json

# Or update existing
linear issue relate ENG-456 ENG-123 --duplicate-of
```

**Inverse**: ENG-123 shows "Duplicated by: ENG-456"

**Best Practices**:

- Close the duplicate issue
- Add comment explaining why it's a duplicate
- Copy relevant information to the main issue

### 4. Similar To (`--similar-to`)

**Use when**: Issues are similar but not duplicates.

**Pattern**: "This issue is similar to other issues"

```bash
# Link similar issues
linear issue relate ENG-456 ENG-789 --similar-to
```

**Bidirectional**: Shows as "Similar" on both issues

**Common Scenarios**:

- Issues with similar symptoms but different causes
- Related bugs in different components
- Feature requests for similar functionality

## Workflow Patterns

### Pattern 1: Epic with Dependencies

```bash
# 1. Create epic (parent issue)
EPIC=$(linear issue create \
  --title "User Authentication System" \
  --team ENG \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# 2. Create foundational task
DB=$(linear issue create \
  --title "Design user database schema" \
  --team ENG \
  --parent $EPIC \
  --estimate 5 \
  --json | jq -r '.issue.identifier')

# 3. Create dependent tasks (blocked by database)
linear issue create \
  --title "Implement authentication API" \
  --team ENG \
  --parent $EPIC \
  --blocks $DB \
  --estimate 8 \
  --json

linear issue create \
  --title "Add login UI" \
  --team ENG \
  --parent $EPIC \
  --blocks $DB \
  --estimate 5 \
  --json
```

### Pattern 2: Feature with Sequential Steps

```bash
# Step 1: Backend
BE=$(linear issue create \
  --title "Add OAuth backend" \
  --team ENG \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# Step 2: API (depends on backend)
API=$(linear issue create \
  --title "Expose OAuth endpoints" \
  --team ENG \
  --blocks $BE \
  --json | jq -r '.issue.identifier')

# Step 3: Frontend (depends on API)
linear issue create \
  --title "Build OAuth UI" \
  --team ENG \
  --blocks $API \
  --json
```

### Pattern 3: Cross-Team Dependencies

```bash
# Backend team creates infrastructure
BE=$(linear issue create \
  --title "Setup Redis cache" \
  --team BACKEND \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# Frontend team creates dependent feature
linear issue create \
  --title "Implement cache-aware data fetching" \
  --team FRONTEND \
  --blocks $BE \
  --related-to $BE \
  --json
```

### Pattern 4: Bug Investigation

```bash
# Original bug
BUG=$(linear issue create \
  --title "App crashes on startup" \
  --team ENG \
  --label Bug \
  --priority 1 \
  --json | jq -r '.issue.identifier')

# Similar bugs found during investigation
linear issue create \
  --title "App crashes on specific device" \
  --team ENG \
  --similar-to $BUG \
  --json

# Root cause investigation
linear issue create \
  --title "Investigate memory leak in init" \
  --team ENG \
  --related-to $BUG \
  --blocks $BUG \
  --json
```

### Pattern 5: Refactoring Chain

```bash
# Main refactor
REFACTOR=$(linear issue create \
  --title "Refactor authentication module" \
  --team ENG \
  --label Refactor \
  --json | jq -r '.issue.identifier')

# Related updates
linear issue create \
  --title "Update auth tests" \
  --team ENG \
  --parent $REFACTOR \
  --related-to $REFACTOR \
  --json

linear issue create \
  --title "Update documentation" \
  --team ENG \
  --parent $REFACTOR \
  --related-to $REFACTOR \
  --json
```

## Managing Relationships

### Create Relationships

```bash
# During issue creation
linear issue create \
  --title "Task" \
  --blocks ENG-100 \
  --related-to ENG-101 \
  --json

# After issue creation
linear issue relate ENG-123 ENG-456 --blocks
linear issue relate ENG-123 ENG-789 --related-to
```

### Remove Relationships

```bash
linear issue unrelate ENG-123 ENG-456
```

### View Relationships

```bash
# View all relationships for an issue
linear issue relations ENG-123 --json

# Response includes:
# - relations: Outgoing relationships (issues this issue relates to)
# - inverseRelations: Incoming relationships (issues relating to this one)
```

### Update with Relationships

```bash
# Add relationships when updating
linear issue update ENG-123 \
  --blocks ENG-456 ENG-789 \
  --related-to ENG-100 \
  --json
```

## Best Practices

### 1. Use Appropriate Relationship Types

- **Blocks**: For hard dependencies only
- **Related**: For loose connections
- **Duplicate**: Only when truly duplicate
- **Similar**: For issues worth comparing

### 2. Document Dependencies in Descriptions

```bash
linear issue create \
  --title "Implement feature X" \
  --description "$(cat <<'EOF'
## Dependencies
This work depends on:
- [ENG-100](https://linear.app/workspace/issue/ENG-100) - API setup
- [ENG-101](https://linear.app/workspace/issue/ENG-101) - Database schema

## Related Work
See also:
- [ENG-102](https://linear.app/workspace/issue/ENG-102) - Similar feature for Y
EOF
)" \
  --blocks ENG-100 ENG-101 \
  --related-to ENG-102 \
  --json
```

### 3. Keep Relationship Graphs Manageable

- Avoid creating too many relationships (< 10 per issue)
- Use parent/child for hierarchies instead of blocks
- Group related work into projects/milestones

### 4. Review Relationships Regularly

```bash
# Check what's blocking an issue
linear issue relations ENG-123 --json | jq '.inverseRelations.nodes[] | select(.type == "blocks")'

# Check what an issue blocks
linear issue relations ENG-123 --json | jq '.relations.nodes[] | select(.type == "blocks")'
```

### 5. Use with Milestones and Projects

```bash
# Create milestone-based dependencies
linear issue create \
  --title "Phase 1 foundation" \
  --milestone "Q1 Milestone" \
  --blocks ENG-100 ENG-101 \
  --json

# Create project-scoped relationships
linear issue create \
  --title "Feature implementation" \
  --project "Auth System" \
  --related-to ENG-200 ENG-201 \
  --json
```

## Relationship Query Patterns

### Find All Blocking Issues

```bash
# Issues blocking work (need to be resolved first)
linear issue list --json | jq '
  .issues[] |
  select(.relations.nodes[]?.type == "blocks") |
  {identifier, title, blocks: [.relations.nodes[] | select(.type == "blocks") | .issue.identifier]}
'
```

### Find Blocked Issues

```bash
# Issues that are blocked (waiting on others)
linear issue list --json | jq '
  .issues[] |
  select(.inverseRelations.nodes[]?.type == "blocks") |
  {identifier, title, blocked_by: [.inverseRelations.nodes[] | select(.type == "blocks") | .issue.identifier]}
'
```

### Find Related Issues

```bash
# All issues related to a specific issue
linear issue relations ENG-123 --json | jq '
  [.relations.nodes[], .inverseRelations.nodes[]] |
  map({type, identifier: .issue.identifier, title: .issue.title})
'
```

## Anti-Patterns to Avoid

### ❌ Don't Create Circular Dependencies

```bash
# BAD: A blocks B, B blocks A
linear issue relate ENG-100 ENG-101 --blocks
linear issue relate ENG-101 ENG-100 --blocks  # This creates a deadlock
```

### ❌ Don't Overuse Blocks

```bash
# BAD: Everything blocks everything
linear issue create --title "Task" --blocks ENG-1 ENG-2 ENG-3 ENG-4 ENG-5 ENG-6
# GOOD: Use parent/child or related instead
linear issue create --title "Task" --parent ENG-EPIC --related-to ENG-1 ENG-2
```

### ❌ Don't Mix Duplicate with Other Relationships

```bash
# BAD: Marking as duplicate but also blocks
linear issue relate ENG-100 ENG-101 --duplicate-of
linear issue relate ENG-100 ENG-102 --blocks  # Duplicates shouldn't block

# GOOD: Just mark as duplicate and close
linear issue relate ENG-100 ENG-101 --duplicate-of
linear issue update ENG-100 --state "Done"
```

### ❌ Don't Forget to Update Relationships

```bash
# BAD: Relationships become stale
# Issue ENG-100 is complete but still shows as blocking ENG-101

# GOOD: Remove relationships when no longer relevant
linear issue unrelate ENG-101 ENG-100
```

## Integration with Workflows

### Sprint Planning

```bash
# Create sprint epic
SPRINT=$(linear issue create \
  --title "Sprint 5 - Authentication" \
  --cycle "Sprint 5" \
  --json | jq -r '.issue.identifier')

# Add sprint tasks with dependencies
linear issue create --title "Setup auth flow" --parent $SPRINT --cycle "Sprint 5" --json
linear issue create --title "Add tests" --parent $SPRINT --cycle "Sprint 5" --blocks ENG-100 --json
```

### Release Planning

```bash
# Create release milestone
linear project milestone create $PROJECT_ID \
  --name "v2.0 Release" \
  --target-date 2026-06-30 \
  --json

# Create release-blocking issues
linear issue create \
  --title "Critical bug fix" \
  --milestone "v2.0 Release" \
  --blocks ENG-200 ENG-201 \
  --priority 1 \
  --json
```
