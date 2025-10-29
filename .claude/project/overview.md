# Linear CLI Enhancement: Extended Entity Management

**Status:** Planning
**Start Date:** 2025-10-28
**Owner:** Development Team

## Overview

Expand the Linear CLI to provide comprehensive command-line management for Documents, Projects, Initiatives, and Labels. This enhancement will enable users to perform all CRUD operations and specialized actions for these entities directly from the terminal, matching the functionality available for Issues and Teams.

**Problem Statement:** Currently, the Linear CLI primarily supports Issue and Team management, requiring users to switch to the web interface for managing Documents, Projects, Initiatives, and Labels. This context switching reduces productivity for CLI-first workflows.

**Goals:**
- Achieve feature parity with existing Issue commands for Documents, Projects, Initiatives, and Labels
- Maintain consistency with established CLI patterns and UX conventions
- Enable complete workflows without leaving the terminal
- Provide rich interactive experiences using Cliffy prompts and formatted output

**Success Metrics:**
- All CRUD operations available for Documents, Projects, Initiatives, and Labels
- Command help text and UX matches quality of existing commands
- 100% test coverage for new commands
- Zero breaking changes to existing functionality

## Motivation

### Why are we building this?

**User Needs:**
- Engineering teams using Linear want to manage entire project workflows from the CLI
- Power users prefer keyboard-driven interfaces over web UIs for bulk operations
- CI/CD pipelines and automation scripts need programmatic access to all Linear entities
- Documentation workflows (creating project docs, tracking initiatives) currently require web access

**Pain Points:**
1. **Context Switching:** Users must leave terminal to create/manage projects, docs, initiatives
2. **Incomplete Automation:** Scripts can't fully manage project lifecycle without API direct access
3. **Workflow Gaps:** Starting work on an issue can't simultaneously create project docs or updates
4. **Inconsistent Experience:** Some entities richly supported, others not available at all

**Business/Product Value:**
- Increases CLI adoption by providing complete functionality
- Differentiates Linear CLI from competitors
- Enables advanced automation use cases
- Reduces friction for developer-focused teams

## Scope

### In Scope

**Documents:**
- ✅ Create documents with title, content (markdown), icon, color
- ✅ Edit document content, title, metadata
- ✅ List documents with filtering (by project, initiative, team)
- ✅ View document details and content
- ✅ Associate documents with projects/initiatives
- ✅ Delete (trash) and restore documents
- ✅ Open documents in browser or Linear app

**Projects:**
- ✅ Create projects with full metadata (name, description, status, lead, dates, etc.)
- ✅ Edit project properties (status, lead, dates, description, etc.)
- ✅ Delete (archive) and restore projects
- ✅ Create project milestones with targets and descriptions
- ✅ Edit and delete project milestones
- ✅ Create project status updates with health indicators
- ✅ Edit project status updates
- ✅ List project updates and milestones
- ✅ Enhance existing list/view commands with new capabilities

**Initiatives:**
- ✅ Create initiatives with name, description, owner, dates
- ✅ Edit initiative properties
- ✅ List initiatives with filtering and sorting
- ✅ View initiative details including associated projects
- ✅ Archive and restore initiatives
- ✅ Create initiative status updates with health tracking
- ✅ Edit initiative status updates
- ✅ Assign/unassign projects to initiatives
- ✅ Manage initiative-to-project relationships
- ✅ Open initiatives in browser or Linear app

**Labels:**
- ✅ Create labels with name, description, color
- ✅ Edit label properties
- ✅ List labels with team/workspace scoping
- ✅ Delete labels
- ✅ Support label groups (parent/child relationships)
- ✅ Display label usage statistics (last used date)

### Out of Scope (This Iteration)

- Document collaboration features (commenting handled separately)
- Project templates and recurring project creation
- Initiative roadmap visualization (ASCII/terminal graphics)
- Label analytics and insights
- Bulk operations (merge labels, batch update, etc.) - defer to future
- Custom views and saved filters
- Export functionality (CSV, JSON) for bulk data
- Integration with external project management tools

### Future Considerations

- **Roadmap visualization:** Terminal-based timeline view for initiatives/projects
- **Bulk operations:** Multi-entity updates, label merging, batch archiving
- **Templates:** Project and document templates for common workflows
- **Analytics:** Usage stats, health trending, progress charts
- **AI integration:** Auto-generate project updates, document summaries
- **Custom views:** Save and reuse complex filters
- **Workspace-level commands:** Cross-team operations

## User Experience

### User Stories

**As a team lead, I want to:**
- Create a project from CLI when planning new work
- Add milestones to track project phases
- Post weekly project updates with health status
- View all initiatives to understand strategic alignment

**As a developer, I want to:**
- Create a design doc linked to my current issue's project
- List all documents for a project to find specifications
- Check initiative status before planning work
- Manage labels for consistent issue categorization

**As a project manager, I want to:**
- Bulk-create projects for quarterly planning
- Track milestone progress across initiatives
- Update project health without opening browser
- Generate project status updates from CLI

### Command Usage Examples

#### Documents

```bash
# Create a new document
linear document create \
  --title "API Design: User Service" \
  --project PRJ-123 \
  --content "# API Design\n\n## Overview\n..."

# Create interactively with editor
linear doc create --interactive
# Opens editor for content, prompts for metadata

# List documents in current project
linear doc list --project PRJ-123

# List all workspace documents
linear doc list --include-archived

# View document content in terminal
linear doc view DOC-abc123
# Renders markdown with syntax highlighting

# Edit document
linear doc edit DOC-abc123 --title "Updated Title"
linear doc edit DOC-abc123  # Opens in $EDITOR

# Open in browser
linear doc view DOC-abc123 --web

# Delete document
linear doc delete DOC-abc123
```

**Expected Output (list):**
```
Documents for Project: API Redesign (5 documents)

TITLE                          PROJECT    UPDATED      CREATOR
API Design: User Service       PRJ-123    2 days ago   Juan Bermudez
Database Schema                PRJ-123    1 week ago   Sarah Chen
Testing Strategy               PRJ-123    2 weeks ago  Mike Johnson
Deployment Guide               PRJ-123    1 month ago  Juan Bermudez
Architecture Decision Record   PRJ-123    2 months ago Sarah Chen
```

#### Projects

```bash
# Create project
linear project create \
  --name "Q1 API Redesign" \
  --description "Modernize REST API to GraphQL" \
  --lead @juanbermudez \
  --status planned \
  --start-date 2025-01-01 \
  --target-date 2025-03-31

# Create with interactive prompts
linear project create

# Edit project
linear project update PRJ-123 \
  --status started \
  --lead @sarahchen

# Create milestone
linear project milestone create PRJ-123 \
  --name "Alpha Release" \
  --target-date 2025-02-15 \
  --description "First internal testing release"

# List milestones
linear project milestones PRJ-123

# Create status update
linear project update-create PRJ-123 \
  --health onTrack \
  --body "Made great progress this week on authentication..."

# Create status update interactively
linear project update-create PRJ-123
# Opens editor for body, prompts for health

# List status updates
linear project updates PRJ-123

# Archive project
linear project delete PRJ-123

# Restore project
linear project restore PRJ-123
```

**Expected Output (milestone list):**
```
Milestones for Project: Q1 API Redesign

NAME              STATUS       TARGET DATE    PROGRESS  ISSUES
Alpha Release     In Progress  Feb 15, 2025   60%       8/12
Beta Release      Planned      Mar 1, 2025    0%        0/15
GA Release        Planned      Mar 31, 2025   0%        0/20

Legend: ● Completed  ◐ In Progress  ○ Planned
```

#### Initiatives

```bash
# Create initiative
linear initiative create \
  --name "Platform Modernization 2025" \
  --description "Modernize core platform infrastructure" \
  --owner @juanbermudez \
  --target-date 2025-12-31

# Create interactively
linear initiative create

# List initiatives
linear init list --status active
linear init list --owner @me
linear init list  # All initiatives

# View initiative details
linear init view INIT-123
# Shows description, projects, updates, health

# Edit initiative
linear init update INIT-123 \
  --status active \
  --owner @sarahchen

# Assign project to initiative
linear init add-project INIT-123 PRJ-456

# Remove project from initiative
linear init remove-project INIT-123 PRJ-456

# Create initiative update
linear init update-create INIT-123 \
  --health onTrack \
  --body "Q1 progress has been excellent..."

# List initiative updates
linear init updates INIT-123

# Archive initiative
linear init archive INIT-123
```

**Expected Output (list):**
```
Active Initiatives (3)

NAME                           OWNER           TARGET      HEALTH    PROJECTS
Platform Modernization 2025    Juan Bermudez   Dec 2025    ● On Track     5
Mobile App Redesign            Sarah Chen      Jun 2025    ⚠ At Risk      3
Customer Portal v2             Mike Johnson    Sep 2025    ● On Track     2

Legend: ● On Track  ⚠ At Risk  ✕ Off Track
```

#### Labels

```bash
# Create label
linear label create \
  --name "security" \
  --description "Security-related issues" \
  --color "#FF0000"

# Create with interactive color picker
linear label create

# List labels
linear label list
linear label list --team ENG  # Team-specific labels

# Edit label
linear label update security \
  --color "#CC0000" \
  --description "Updated security label"

# Create label group
linear label create \
  --name "Priority" \
  --is-group

# Create child label
linear label create \
  --name "P0" \
  --parent Priority \
  --color "#FF0000"

# Delete label
linear label delete security
```

**Expected Output (list):**
```
Workspace Labels (12)

NAME           COLOR    DESCRIPTION              LAST USED    ISSUES
■ bug          #FF0000  Bug reports             2 hours ago  45
■ feature      #00FF00  New features            1 day ago    23
■ security     #CC0000  Security-related        3 days ago   8
■ docs         #0000FF  Documentation           1 week ago   5

Priority (Group)
  ■ P0         #FF0000  Critical priority       Today        12
  ■ P1         #FFA500  High priority          Yesterday     34
  ■ P2         #FFFF00  Medium priority        2 days ago    56
```

### Error Cases and Edge Cases

**Document Errors:**
- Document not found: "Error: Document DOC-abc123 not found"
- Permission denied: "Error: You don't have permission to edit this document"
- Invalid project: "Error: Project PRJ-123 not found"
- Empty content: Allow but warn "Warning: Creating document with empty content"

**Project Errors:**
- Duplicate name: "Error: Project 'Q1 API Redesign' already exists. Use --force to create anyway"
- Invalid lead: "Error: User @invalid not found in workspace"
- Invalid status: "Error: Invalid project status 'invalid'. Valid: planned, started, paused, completed, canceled"
- Milestone date before project start: "Warning: Milestone target date is before project start date"

**Initiative Errors:**
- No permission: "Error: Only workspace admins can create initiatives"
- Invalid project assignment: "Error: Project PRJ-123 is already assigned to initiative INIT-456"
- Circular dependencies: Not applicable (flat structure)
- Archive with active projects: "Warning: Initiative has 3 active projects. Archive anyway? (y/N)"

**Label Errors:**
- Duplicate name: "Error: Label 'bug' already exists. Use --update to modify"
- Invalid color: "Error: Invalid color '#GGGGGG'. Use hex format: #RRGGBB"
- Parent not found: "Error: Parent label 'Priority' not found"
- Non-group parent: "Error: Label 'bug' is not a label group"
- Delete with usage: "Warning: Label 'bug' is used by 45 issues. Delete anyway? (y/N)"

## Technical Approach

### High-Level Architecture

The implementation follows existing Linear CLI patterns:

```
src/commands/
├── document/
│   ├── document.ts              # Main command & subcommand registry
│   ├── document-create.ts       # Create document
│   ├── document-edit.ts         # Edit document
│   ├── document-list.ts         # List documents
│   ├── document-view.ts         # View document
│   └── document-delete.ts       # Delete document
├── project/
│   ├── project.ts               # Enhanced main command
│   ├── project-create.ts        # NEW: Create project
│   ├── project-update.ts        # NEW: Update project
│   ├── project-delete.ts        # NEW: Delete/archive project
│   ├── project-milestone.ts     # NEW: Milestone management (subcommands)
│   ├── project-milestone-create.ts
│   ├── project-milestone-list.ts
│   ├── project-update-create.ts # NEW: Status update commands
│   ├── project-updates-list.ts
│   ├── project-list.ts          # Existing (enhance)
│   └── project-view.ts          # Existing (enhance)
├── initiative/
│   ├── initiative.ts            # Main command
│   ├── initiative-create.ts
│   ├── initiative-update.ts
│   ├── initiative-list.ts
│   ├── initiative-view.ts
│   ├── initiative-archive.ts
│   ├── initiative-add-project.ts
│   ├── initiative-remove-project.ts
│   ├── initiative-update-create.ts
│   └── initiative-updates-list.ts
└── label/
    ├── label.ts                 # Main command
    ├── label-create.ts
    ├── label-update.ts
    ├── label-list.ts
    └── label-delete.ts
```

### GraphQL Schema Analysis

#### Documents

**Type:** `Document`
**Key Fields:**
- `id: ID!`
- `title: String!`
- `content: String` (markdown)
- `icon: String`
- `color: String`
- `project: Project`
- `initiative: Initiative`
- `team: Team`
- `creator: User`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

**Queries:**
- `documents(filter: DocumentFilter): DocumentConnection!`
- `document(id: String!): Document!`

**Mutations:**
- `documentCreate(input: DocumentCreateInput!): DocumentPayload!`
- `documentUpdate(input: DocumentUpdateInput!, id: String!): DocumentPayload!`
- `documentDelete(id: String!): DocumentArchivePayload!`
- `documentUnarchive(id: String!): DocumentArchivePayload!`

**Pagination:** Yes (Connection type with edges, nodes, pageInfo)

#### Projects (Extended)

**Type:** `Project`
**Key Fields:**
- `id: ID!`
- `name: String!`
- `description: String!`
- `slugId: String!`
- `icon: String`
- `color: String!`
- `status: ProjectStatus!` (planned, started, paused, completed, canceled)
- `health: ProjectUpdateHealthType` (onTrack, atRisk, offTrack)
- `lead: User`
- `creator: User`
- `startDate: TimelessDate`
- `targetDate: TimelessDate`
- `completedAt: DateTime`
- `projectMilestones: ProjectMilestoneConnection!`
- `projectUpdates: ProjectUpdateConnection!`
- `issues: IssueConnection!`
- `documents: DocumentConnection!`

**Type:** `ProjectMilestone`
**Key Fields:**
- `id: ID!`
- `name: String!`
- `description: String`
- `targetDate: TimelessDate`
- `sortOrder: Float!`
- `project: Project!`

**Type:** `ProjectUpdate`
**Key Fields:**
- `id: ID!`
- `body: String!` (markdown)
- `health: ProjectUpdateHealthType!`
- `project: Project!`
- `user: User!`
- `createdAt: DateTime!`

**Mutations (New):**
- `projectCreate(input: ProjectCreateInput!): ProjectPayload!`
- `projectUpdate(input: ProjectUpdateInput!, id: String!): ProjectPayload!`
- `projectArchive(id: String!): ArchivePayload!`
- `projectMilestoneCreate(input: ProjectMilestoneCreateInput!): ProjectMilestonePayload!`
- `projectMilestoneUpdate(input: ProjectMilestoneUpdateInput!, id: String!): ProjectMilestonePayload!`
- `projectMilestoneDelete(id: String!): DeletePayload!`
- `projectUpdateCreate(input: ProjectUpdateCreateInput!): ProjectUpdatePayload!`
- `projectUpdateUpdate(input: ProjectUpdateUpdateInput!, id: String!): ProjectUpdatePayload!`

#### Initiatives

**Type:** `Initiative`
**Key Fields:**
- `id: ID!`
- `name: String!`
- `description: String`
- `status: InitiativeStatus` (planned, active, completed, canceled)
- `owner: User`
- `targetDate: TimelessDate`
- `health: InitiativeUpdateHealthType`
- `projects: ProjectConnection!`
- `documents: DocumentConnection!`
- `initiativeUpdates: InitiativeUpdateConnection!`

**Type:** `InitiativeUpdate`
**Key Fields:**
- `id: ID!`
- `body: String` (markdown)
- `health: InitiativeUpdateHealthType!`
- `initiative: Initiative!`
- `user: User!`

**Type:** `InitiativeToProject` (join table)
**Key Fields:**
- `id: ID!`
- `initiativeId: String!`
- `projectId: String!`
- `sortOrder: Float`

**Queries:**
- `initiatives(filter: InitiativeFilter): InitiativeConnection!`
- `initiative(id: String!): Initiative!`
- `initiativeUpdates(filter: InitiativeUpdateFilter): InitiativeUpdateConnection!`

**Mutations:**
- `initiativeCreate(input: InitiativeCreateInput!): InitiativePayload!`
- `initiativeUpdate(input: InitiativeUpdateInput!, id: String!): InitiativePayload!`
- `initiativeArchive(id: String!): InitiativeArchivePayload!`
- `initiativeUpdateCreate(input: InitiativeUpdateCreateInput!): InitiativeUpdatePayload!`
- `initiativeUpdateUpdate(input: InitiativeUpdateUpdateInput!, id: String!): InitiativeUpdatePayload!`
- `initiativeToProjectCreate(input: InitiativeToProjectCreateInput!): InitiativeToProjectPayload!`
- `initiativeToProjectDelete(id: String!): DeletePayload!`

#### Labels

**Type:** `IssueLabel`
**Key Fields:**
- `id: ID!`
- `name: String!`
- `description: String`
- `color: String!` (hex)
- `isGroup: Boolean!`
- `parent: IssueLabel` (for label groups)
- `team: Team` (team-scoped) or null (workspace-scoped)
- `lastUsedAt: DateTime` (last applied to issue/project)

**Queries:**
- `issueLabels(filter: IssueLabelFilter): IssueLabelConnection!`
- `issueLabel(id: String!): IssueLabel!`

**Mutations:**
- `issueLabelCreate(input: IssueLabelCreateInput!): IssueLabelPayload!`
- `issueLabelUpdate(input: IssueLabelUpdateInput!, id: String!): IssueLabelPayload!`
- `issueLabelDelete(id: String!): DeletePayload!`

### Integration Points

**VCS Integration:**
- Document/project creation could auto-link to current issue from branch
- Project updates could reference current issue/branch context
- Potentially add VCS trailers for documents/projects (future)

**GitHub Integration:**
- Extend PR creation to include project/initiative context
- Auto-create project docs when creating projects (optional)

**Configuration:**
- Extend `.linear.toml` with default project settings (status, lead, etc.)
- Add preference for default document editor
- Configure initiative update reminders

### Dependencies and Constraints

**Dependencies:**
- Existing GraphQL client and codegen setup
- Cliffy for commands and prompts
- Markdown rendering (@littletof/charmd)
- Editor integration ($EDITOR environment variable)

**Constraints:**
- Linear API rate limits (handled by client)
- Workspace/team permissions (enforced by API)
- Initiative creation limited to workspace admins
- Document/project slugId uniqueness enforced by API
- Label color must be valid hex format

**API Constraints:**
- Projects require a project status (must exist first)
- Documents can be associated with project OR initiative, not both
- Milestones belong to exactly one project
- Labels can be workspace or team-scoped, not both
- Initiative-to-project is many-to-many via join table

## Implementation Plan

### Task Breakdown

**Phase 1: Documents (Tasks 001-005)**
- [001-document-commands.md](tasks/001-document-commands.md) - Create, edit, delete document commands (Large)
- [002-document-list-view.md](tasks/002-document-list-view.md) - List and view document commands (Medium)
- [003-document-integration.md](tasks/003-document-integration.md) - VCS and project integration (Small)

**Phase 2: Projects Extended (Tasks 006-012)**
- [006-project-create-update.md](tasks/006-project-create-update.md) - Create and update project commands (Large)
- [007-project-delete.md](tasks/007-project-delete.md) - Archive/restore project commands (Small)
- [008-project-milestones.md](tasks/008-project-milestones.md) - Milestone CRUD commands (Medium)
- [009-project-updates.md](tasks/009-project-updates.md) - Status update create/edit/list (Medium)
- [010-project-list-enhance.md](tasks/010-project-list-enhance.md) - Enhance existing list command (Small)
- [011-project-view-enhance.md](tasks/011-project-view-enhance.md) - Enhance existing view command (Small)

**Phase 3: Initiatives (Tasks 012-018)**
- [012-initiative-create-update.md](tasks/012-initiative-create-update.md) - Create and update initiative commands (Large)
- [013-initiative-list-view.md](tasks/013-initiative-list-view.md) - List and view initiative commands (Medium)
- [014-initiative-archive.md](tasks/014-initiative-archive.md) - Archive/restore commands (Small)
- [015-initiative-projects.md](tasks/015-initiative-projects.md) - Add/remove project associations (Medium)
- [016-initiative-updates.md](tasks/016-initiative-updates.md) - Status update create/edit/list (Medium)

**Phase 4: Labels (Tasks 019-021)**
- [019-label-create-update.md](tasks/019-label-create-update.md) - Create and update label commands (Medium)
- [020-label-list.md](tasks/020-label-list.md) - List labels with grouping (Small)
- [021-label-delete.md](tasks/021-label-delete.md) - Delete label command (Small)

**Phase 5: Integration & Polish (Tasks 022-024)**
- [022-cross-entity-integration.md](tasks/022-cross-entity-integration.md) - Cross-command integrations (Medium)
- [023-configuration.md](tasks/023-configuration.md) - Configuration enhancements (Small)
- [024-documentation.md](tasks/024-documentation.md) - README and help updates (Small)

### Dependencies Between Tasks

```
Phase 1 (Documents): 001 → 002 → 003
Phase 2 (Projects): 006 → [007, 008, 009] → [010, 011]
Phase 3 (Initiatives): 012 → 013 → [014, 015, 016]
Phase 4 (Labels): 019 → 020 → 021
Phase 5 (Integration): [All previous] → 022 → 023 → 024
```

**Critical Path:**
- Documents can be developed independently
- Projects extended commands depend on document commands for association
- Initiatives depend on projects for project association
- Labels are independent
- Integration phase depends on all entity commands

### Estimated Effort

**By Phase:**
- Phase 1 (Documents): ~5-7 days
- Phase 2 (Projects): ~7-10 days
- Phase 3 (Initiatives): ~6-8 days
- Phase 4 (Labels): ~3-4 days
- Phase 5 (Integration): ~3-5 days

**Total: ~24-34 days** (4-7 weeks depending on parallel work and complexity)

**By Task Size:**
- Large tasks (5): ~10-15 days total
- Medium tasks (9): ~9-12 days total
- Small tasks (10): ~5-7 days total

## Success Criteria

### How do we know we're done?

**Feature Completeness:**
- [ ] All 24 tasks completed and verified
- [ ] All CRUD operations available for Documents, Projects, Initiatives, Labels
- [ ] Specialized operations implemented (milestones, updates, associations)
- [ ] Interactive prompts for all create/edit commands
- [ ] Help text comprehensive and accurate

**Quality Standards:**
- [ ] All new commands have snapshot tests for help text
- [ ] Integration tests with mock Linear server passing
- [ ] Code coverage >90% for new utilities
- [ ] Zero TypeScript `any` types
- [ ] All linting/formatting checks pass
- [ ] Deno check passes without errors

**User Experience:**
- [ ] Command patterns match existing Issue commands
- [ ] Output formatting consistent (colors, tables, paging)
- [ ] Error messages descriptive and actionable
- [ ] Interactive prompts have search/filtering where appropriate
- [ ] Long output automatically paged

**Documentation:**
- [ ] README updated with new commands
- [ ] Command help text includes examples
- [ ] CHANGELOG entries added for all features
- [ ] Migration guide if any breaking changes

### Testing Strategy

**Unit Tests:**
- GraphQL query/mutation functions in `src/utils/linear.ts`
- Display/formatting utilities
- Validation functions

**Integration Tests:**
- Command execution with mock Linear server
- End-to-end workflows (create project → milestone → update)
- Error handling and edge cases

**Snapshot Tests:**
- Help text for all commands
- Table output formatting
- Interactive prompt displays

**Manual Testing Checklist:**
- [ ] Create entities via interactive and flag-based modes
- [ ] List/filter operations with various combinations
- [ ] Edit operations with partial updates
- [ ] Delete operations with confirmations
- [ ] Cross-entity associations (doc→project, project→initiative)
- [ ] VCS integration (current issue detection)
- [ ] Browser/app opening
- [ ] Paging for long outputs
- [ ] Color output in terminal

## Open Questions

### Decisions Needed

1. **Document Editor Integration:**
   - **Question:** Should we integrate with $EDITOR for document content, or require content via flag/stdin?
   - **Options:**
     - A) Full editor integration (like git commit messages)
     - B) Flag/stdin only for scriptability
     - C) Both with `--interactive` flag
   - **Recommendation:** C - Both modes for flexibility

2. **Project Status Creation:**
   - **Question:** Projects require a project status. Should we auto-create default statuses or require existing ones?
   - **Options:**
     - A) Auto-create "Planned", "In Progress", "Completed" if missing
     - B) Require workspace to have statuses configured
     - C) Prompt user to create status if missing
   - **Recommendation:** B - Cleaner, avoids polluting workspace

3. **Label Color Picker:**
   - **Question:** How to handle label color selection interactively?
   - **Options:**
     - A) Predefined palette of common colors
     - B) Free-form hex input
     - C) Both with palette + custom option
   - **Recommendation:** C - Best UX

4. **Milestone Progress Calculation:**
   - **Question:** Should milestone progress be calculated from issues or displayed as-is from API?
   - **Options:**
     - A) Calculate from linked issues (completed/total)
     - B) Use API-provided progress field
     - C) Show both
   - **Recommendation:** B - Trust API, avoid discrepancies

5. **Initiative Archive Behavior:**
   - **Question:** What should happen to initiative's projects when archiving initiative?
   - **Options:**
     - A) Warn if active projects exist, require confirmation
     - B) Auto-unlink projects from initiative
     - C) Block archive if active projects
   - **Recommendation:** A - User decides, with clear warning

6. **Cross-Command Shortcuts:**
   - **Question:** Should we add shortcuts like `linear issue create --project-doc-create` to create doc with issue?
   - **Options:**
     - A) Yes, add convenient shortcuts
     - B) No, keep commands focused and composable
     - C) Defer to future based on user feedback
   - **Recommendation:** C - Keep scope manageable, gather feedback

### Alternative Approaches Considered

**Approach 1: Single Unified Command**
- **Description:** `linear create <entity>` for all entities instead of `linear document create`, etc.
- **Pros:** More unified, easier discovery
- **Cons:** Breaks existing patterns, requires major refactor
- **Decision:** Rejected - maintain existing command structure

**Approach 2: GraphQL-Direct Mode**
- **Description:** Add `--graphql` flag to output raw GraphQL for piping to other tools
- **Pros:** Power user flexibility
- **Cons:** Complex, adds maintenance burden
- **Decision:** Deferred - useful but not critical for v1

**Approach 3: Wizard Mode**
- **Description:** `linear wizard project` for fully guided multi-step creation
- **Pros:** Great for new users, comprehensive
- **Cons:** More code, harder to maintain, slower for power users
- **Decision:** Partial adoption - use interactive prompts instead of full wizard

**Approach 4: JSON Configuration Files**
- **Description:** Accept JSON files for bulk entity creation
- **Pros:** Great for migration, bulk operations
- **Cons:** Complexity, error handling challenges
- **Decision:** Deferred - can add later for specific use cases

## Risk Assessment

**Technical Risks:**
- **GraphQL API Changes:** Linear may update schema
  - *Mitigation:* Regular schema sync, versioning checks
- **Rate Limiting:** Bulk operations may hit limits
  - *Mitigation:* Implement retry logic, warn users
- **Complex Filtering:** Filter translation to GraphQL may be challenging
  - *Mitigation:* Start with basic filters, iterate

**UX Risks:**
- **Command Complexity:** Too many flags/options may confuse users
  - *Mitigation:* Smart defaults, interactive mode as fallback
- **Inconsistency:** New commands may not match existing patterns
  - *Mitigation:* Thorough code review, follow established patterns strictly
- **Performance:** Large datasets may cause slow list operations
  - *Mitigation:* Pagination, filtering, caching where appropriate

**Project Risks:**
- **Scope Creep:** Feature requests may expand scope
  - *Mitigation:* Strict adherence to PRD, defer non-critical features
- **Timeline:** 24+ tasks may take longer than estimated
  - *Mitigation:* Prioritize critical features, ship incrementally
- **Testing Burden:** Comprehensive testing may be time-consuming
  - *Mitigation:* Test as you build, leverage snapshot tests

## Appendix

### GraphQL Schema References

**Documents:**
- Type: `Document` (graphql/schema.graphql:3876)
- Create: `DocumentCreateInput` (graphql/schema.graphql:4072)
- Update: `DocumentUpdateInput` (graphql/schema.graphql:4404)
- Mutations: Lines 13047-13068

**Projects:**
- Type: `Project` (graphql/schema.graphql:16673)
- Milestones: `ProjectMilestone` (graphql/schema.graphql:17998)
- Updates: `ProjectUpdate` (graphql/schema.graphql:19547)
- Create: `ProjectCreateInput` (graphql/schema.graphql:17477)
- Mutations: Lines 11343-11680

**Initiatives:**
- Type: `Initiative` (graphql/schema.graphql:6108)
- Updates: `InitiativeUpdate` (graphql/schema.graphql:7065)
- Join: `InitiativeToProject` (graphql/schema.graphql:7023)
- Create: `InitiativeCreateInput` (graphql/schema.graphql:6461)
- Mutations: Lines 12762-12843

**Labels:**
- Type: `IssueLabel` (graphql/schema.graphql:9443)
- Create: `IssueLabelCreateInput` (graphql/schema.graphql:9603)
- Update: `IssueLabelUpdateInput` (graphql/schema.graphql:9694)
- Mutations: Lines 12068-12094

### Existing Command Patterns to Follow

**List Commands:** `src/commands/issue/issue-list.ts`
- Filtering with multiple options
- Table display with paging
- Sorting options
- Interactive filtering

**Create Commands:** `src/commands/issue/issue-create.ts`
- Interactive mode with prompts
- Flag-based mode for scripting
- Editor integration for long content
- Async data fetching (teams, users, etc.)

**View Commands:** `src/commands/issue/issue-view.ts`
- Detailed display with sections
- Open in web/app support
- Related entities shown

**Update Commands:** `src/commands/issue/issue-update.ts`
- Partial updates supported
- Interactive field selection
- Validation before submission

### Related Resources

- [Linear GraphQL API Documentation](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [Cliffy Documentation](https://cliffy.io/)
- [Existing Linear CLI Issue Commands](src/commands/issue/)
- [GraphQL Codegen Setup](codegen.ts)
