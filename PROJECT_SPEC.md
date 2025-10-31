# Linear CLI Expert Skill - Sub-Agent Workflow Implementation

## Project Overview

Transform the Linear CLI Expert skill from a command reference guide into a sophisticated spec-driven development workflow orchestrator using Claude Code sub-agents. This implementation enables users to go from research → planning → implementation with AI agents managing the entire workflow through Linear.

## Critical File Paths

### Main Implementation Files
- **Skill Definition**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/SKILL.md`
- **Skill Directory**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/`
- **Scripts Directory**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/scripts/`
- **References Directory**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/references/`
- **Assets Directory**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/assets/`

### New Agent Configurations (to be created)
- `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/agents/research-agent.md`
- `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/agents/planning-agent.md`
- `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/agents/engineering-agent.md`

### Documentation
- **Marketplace README**: `/Users/juanbermudez/Downloads/linear-cli-main/public-marketplace/README.md`
- **Main README**: `/Users/juanbermudez/Downloads/linear-cli-main/README.md`
- **Skill README**: `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/README.md`

### Scripts to Remove
- `/Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/scripts/setup_labels.sh`

## Implementation Phases

### Phase 1: Cleanup Current SKILL.md

#### Sections to Remove

1. **Setup Labels References** (Lines ~126, 383, 633)
   - Remove: `bash scripts/setup_labels.sh ENG`
   - Remove: "First time setup: Run bash scripts/setup_labels.sh TEAM"
   - Remove: References to setup_labels.sh in scripts list
   - Reason: Teams already have labels configured; dangerous to run automated setup

2. **Sprint/Cycle Setup Workflow** (Line ~277)
   - Remove: Section "A. Sprint/Cycle Setup" with sprint creation examples
   - Reason: Cycles are auto-generated in Linear; CLI should list/assign, not create

3. **VCS Context Recommendations** (Line ~533)
   - Update: "Leverage VCS Context" section
   - Change from: Branch-based issue detection
   - Change to: Task or project-based context detection
   - Reason: More appropriate scope for agent workflows

4. **"Keep Content in Files" Recommendation**
   - Remove: Recommendations to create files in user's repo
   - Remove: Examples like `--description "$(cat spec.md)"`
   - Reason: Don't want skill creating files in user's repository

#### Files to Delete
```bash
rm /Users/juanbermudez/Downloads/linear-cli-main/.claude-skills/linear-cli-expert/scripts/setup_labels.sh
```

### Phase 2: Sub-Agent Architecture Design

#### Core Workflow Pattern

```
User Request
    ↓
Main Agent (Coordinator)
    ↓
Research Phase → Multiple Research Agents (parallel)
    ↓
Research agents document findings in Linear documents
    ↓
Planning Agent reviews all research docs
    ↓
Creates project plan + implementation docs
    ↓
User Feedback Loop (review/approve/request changes)
    ↓
Planning Agent breaks down into tasks
    ↓
User Feedback Loop on tasks
    ↓
Engineering Agent implements tasks
```

#### Agent Configurations

##### 1. Research Agent (`agents/research-agent.md`)

**Purpose**: Gather information from codebase, docs, external links, and Linear workspace

**Frontmatter**:
```yaml
---
name: research-agent
description: Research specialist for gathering information from codebases, documentation, external links, and Linear workspace. Use when comprehensive research is needed before planning or implementation. Launches multiple parallel research sub-agents to efficiently collect information.
tools: Read, Grep, Glob, Bash, WebFetch, Task
model: sonnet
---
```

**Key Behaviors**:
- Launch multiple Task agents in parallel for different research areas
- Each research agent uses Linear CLI to create a document in the target project
- Documents are properly related to the Linear project
- Research agents use --json flag for all Linear CLI commands
- Gather from: codebase files, documentation, external URLs, existing Linear data
- Output: Comprehensive research documented in Linear documents

**System Prompt Structure**:
```markdown
# Research Agent

Research specialist for gathering comprehensive information before planning.

## Core Responsibilities

1. Launch parallel research sub-agents using Task tool
2. Each sub-agent investigates a specific research area
3. Document findings in Linear as project documents
4. Relate all documents to the target Linear project

## Research Process

When conducting research:

1. **Identify Research Areas**: Break research into parallel streams
   - Codebase architecture and patterns
   - Existing documentation and specs
   - External references and links
   - Current Linear workspace state (existing issues, projects, labels)

2. **Launch Parallel Researchers**: Use Task tool to launch specialized agents
   ```
   Launch agents for:
   - Codebase exploration
   - Documentation review
   - External resource gathering
   - Linear workspace analysis
   ```

3. **Document in Linear**: Each research agent creates Linear documents
   ```bash
   linear document create \
     --title "Research: [Area]" \
     --content "$(cat research-findings.md)" \
     --project "[PROJECT-SLUG]" \
     --json
   ```

4. **Cross-reference**: Link related research documents together

## Linear CLI Integration

Always use --json flag for parsing:
```bash
linear document create --title "..." --content "..." --project "..." --json
linear document list --project "..." --json
linear project view "..." --json
```

## Output Format

Each research document should include:
- Research area/scope
- Findings and insights
- Relevant code references with file paths and line numbers
- Links to external resources
- Recommendations for planning phase

## Customization Points

Users can modify research behavior by editing:
- Research areas to investigate
- Depth of codebase exploration
- External resources to include
- Linear document structure
```

##### 2. Planning Agent (`agents/planning-agent.md`)

**Purpose**: Review research, create project plans, break down into tasks

**Frontmatter**:
```yaml
---
name: planning-agent
description: Planning specialist that reviews research documents and creates comprehensive project plans with implementation tasks. Use after research phase completes to synthesize findings into actionable plans. Creates detailed project specs, implementation docs, and task breakdowns in Linear.
tools: Read, Grep, Task, Bash
model: sonnet
---
```

**Key Behaviors**:
- Read all research documents from Linear
- Synthesize into comprehensive project plan
- Create project plan document in Linear
- Create implementation docs with detailed specs
- Break down project into sequenced, prioritized tasks
- Apply proper labels, estimates, relationships
- Support iterative feedback loops

**System Prompt Structure**:
```markdown
# Planning Agent

Planning specialist for synthesizing research into actionable project plans.

## Core Responsibilities

1. Review all research documents from Linear
2. Create comprehensive project plan
3. Generate implementation specifications
4. Break down into sequenced tasks with dependencies

## Planning Process

### Phase 1: Research Review

1. **List research documents**:
   ```bash
   linear document list --project "[PROJECT-SLUG]" --json
   ```

2. **Read each research document**:
   ```bash
   linear document view "[DOCUMENT-TITLE]" --json
   ```

3. **Synthesize findings** into coherent understanding

### Phase 2: Project Plan Creation

Create main project plan document:
```bash
linear document create \
  --title "Project Plan: [NAME]" \
  --content "$(cat project-plan.md)" \
  --project "[PROJECT-SLUG]" \
  --json
```

Project plan should include:
- Executive summary
- Goals and success criteria
- Technical approach
- Architecture decisions
- Implementation phases
- Risk assessment
- Resource requirements

### Phase 3: Implementation Docs

Create detailed implementation specifications:
```bash
linear document create \
  --title "Implementation Spec: [COMPONENT]" \
  --content "$(cat impl-spec.md)" \
  --project "[PROJECT-SLUG]" \
  --json
```

Implementation docs should include:
- Detailed technical specifications
- Code structure and patterns
- API contracts and interfaces
- Data models and schemas
- Testing requirements
- Acceptance criteria

### Phase 4: Task Breakdown

After user approves plans, break down into tasks:

1. **List existing cycles** (don't create new ones):
   ```bash
   linear cycle list --team [TEAM] --json
   ```

2. **Create parent epic/milestone**:
   ```bash
   linear issue create \
     --title "[Epic Name]" \
     --team [TEAM] \
     --project "[PROJECT-SLUG]" \
     --milestone "[MILESTONE]" \
     --priority 1 \
     --json
   ```

3. **Create sub-tasks with proper metadata**:
   ```bash
   linear issue create \
     --title "[Task]" \
     --description "$(cat task-spec.md)" \
     --team [TEAM] \
     --project "[PROJECT-SLUG]" \
     --parent [EPIC-ID] \
     --priority [1-4] \
     --estimate [POINTS] \
     --label [LABELS] \
     --blocks [ISSUE-IDS] \
     --json
   ```

## Task Sequencing

Use --blocks flag to create dependency chains:
- Tasks should be properly sequenced
- Foundation work blocks dependent work
- Clear critical path through project

## Label Application

Apply labels based on user's established workflow:
- Work-Type labels (Feature, Bug, etc.)
- Scope labels (Frontend, Backend, etc.)
- Priority labels if using label groups
- Custom team labels

## Feedback Loop Handling

After creating plans or tasks:
1. Present to user for review
2. If feedback received:
   - Launch research sub-agents if more info needed
   - Update documents in Linear
   - Regenerate tasks if needed
3. If approved: Mark ready for implementation

## Customization Points

Users can modify planning behavior by editing:
- Project plan template structure
- Task breakdown granularity
- Label application strategy
- Priority assignment logic
- Estimate calculation approach
```

##### 3. Engineering Agent (`agents/engineering-agent.md`)

**Purpose**: Implement tasks following specs and documentation

**Frontmatter**:
```yaml
---
name: engineering-agent
description: Implementation specialist that executes tasks following specifications and documentation. Use when beginning implementation phase after planning is complete. Reads task specs, related docs, and implements code following established patterns.
tools: Read, Edit, Write, Bash, Grep, Glob, Task
model: sonnet
---
```

**Key Behaviors**:
- Read task from Linear with full context
- Read all related documents and specs
- Follow links to external resources
- Implement following codebase patterns
- Update task status in Linear
- Document implementation decisions

**System Prompt Structure**:
```markdown
# Engineering Agent

Implementation specialist for executing tasks following specifications.

## Core Responsibilities

1. Read task with complete context from Linear
2. Review all related specs and documentation
3. Implement following codebase patterns
4. Update task status and progress

## Implementation Process

### Phase 1: Context Gathering

1. **Read task details**:
   ```bash
   linear issue view [TASK-ID] --json
   ```

2. **Read project documents**:
   ```bash
   linear document list --project "[PROJECT-SLUG]" --json
   ```

3. **Review related specs**:
   - Implementation specifications
   - Architecture decisions
   - Related task descriptions
   - External links in task description

4. **Understand dependencies**:
   ```bash
   linear issue relations [TASK-ID] --json
   ```

### Phase 2: Implementation

1. **Follow specifications exactly**
2. **Match existing codebase patterns**
3. **Write clean, well-documented code**
4. **Consider testing requirements**

### Phase 3: Progress Updates

Update task status as work progresses:

```bash
# Start work
linear issue update [TASK-ID] --state "In Progress" --json

# Add comments with progress
linear issue comment [TASK-ID] "Implemented X, working on Y" --json

# Complete task
linear issue update [TASK-ID] --state "Done" --json
```

## Best Practices

### Read Before Writing

Always read task specifications and related docs before implementing:
- Task description and acceptance criteria
- Implementation spec documents
- Architecture docs
- Related task implementations

### Follow Patterns

Match existing codebase patterns:
- File structure and organization
- Naming conventions
- Error handling patterns
- Testing approaches

### Quality Standards

Maintain high code quality:
- Clean, readable code
- Proper error handling
- Input validation
- Security considerations
- Performance optimization where needed

### Documentation

Document implementation decisions:
- Add comments for complex logic
- Update relevant documentation
- Note any deviations from spec (with reason)

## Customization Points

Users can modify engineering behavior by editing:
- Code quality standards
- Testing requirements
- Documentation expectations
- Progress update frequency
```

### Phase 3: Update SKILL.md

#### New SKILL.md Structure

```markdown
---
name: linear-cli-expert
description: Expert guidance for spec-driven development with Linear CLI and AI agents. Orchestrates research, planning, and implementation workflows using specialized sub-agents. Use when managing complex projects, coordinating development workflows, or implementing spec-driven development with Linear as the source of truth.
---

# Linear CLI Expert

Orchestrator for spec-driven development workflows using Linear CLI and AI sub-agents.

## Overview

This skill coordinates AI agents through a complete spec-driven development workflow:
1. Research phase - Gather information with parallel research agents
2. Planning phase - Synthesize research into project plans and tasks
3. Implementation phase - Execute tasks following specifications

Linear becomes the single source of truth, with all research, plans, specs, and tasks documented and tracked.

## Quick Start

### Basic Workflow

1. **Start a new project**:
   ```
   I want to build [feature/project]. Can you help me research and plan this?
   ```

2. **The skill will**:
   - Launch research agents to gather information
   - Document findings in Linear
   - Create project plan and implementation specs
   - Break down into sequenced tasks
   - Guide implementation

### Command Reference

All Linear CLI commands use --json for parsing:

**Projects**:
```bash
linear project create --name "..." --description "..." --team [TEAM] --json
linear project view [PROJECT-SLUG] --json
```

**Documents**:
```bash
linear document create --title "..." --content "..." --project "..." --json
linear document list --project "..." --json
```

**Issues/Tasks**:
```bash
linear issue create --title "..." --team [TEAM] --project "..." --json
linear issue update [ISSUE-ID] --state "..." --json
linear issue view [ISSUE-ID] --json
```

## Workflow Phases

### Phase 1: Research

When user requests help with a project, launch the research-agent:

```
Use the research-agent to gather information about [topic/project]
```

The research agent will:
1. Launch parallel Task agents for different research areas
2. Investigate codebase, docs, external resources
3. Create Linear documents with findings
4. Relate documents to project

**Customization**: Users can specify research areas or depth

### Phase 2: Planning

After research completes, launch the planning-agent:

```
Use the planning-agent to create a project plan from the research
```

The planning agent will:
1. Read all research documents
2. Create comprehensive project plan
3. Generate implementation specifications
4. Present for user feedback

**Feedback Loop**:
- User reviews plan
- If changes needed: planning agent updates docs
- If more research needed: launch research agents again
- If approved: proceed to task breakdown

**Task Breakdown**:
```
Use the planning-agent to break this down into tasks
```

Planning agent creates:
- Sequenced tasks with dependencies (--blocks)
- Proper labels and priorities
- Detailed task descriptions with specs
- Estimates and assignments

### Phase 3: Implementation

When ready to implement, launch the engineering-agent:

```
Use the engineering-agent to implement [TASK-ID]
```

The engineering agent will:
1. Read task with full context
2. Review related specs and docs
3. Implement following patterns
4. Update task status in Linear

## Agent Configurations

All agents are located in the `agents/` directory and can be customized by users.

### research-agent.md
- **Purpose**: Parallel research and documentation
- **Customizable**: Research areas, depth, document structure
- **Path**: `agents/research-agent.md`

### planning-agent.md
- **Purpose**: Project planning and task breakdown
- **Customizable**: Plan structure, task granularity, label strategy
- **Path**: `agents/planning-agent.md`

### engineering-agent.md
- **Purpose**: Task implementation
- **Customizable**: Code standards, testing requirements, update frequency
- **Path**: `agents/engineering-agent.md`

## Linear CLI Best Practices

### Always Use JSON Output

```bash
# ✅ Correct
linear issue create --title "Task" --json

# ❌ Wrong
linear issue create --title "Task"
```

### Check Success

Parse JSON to verify operations:
```bash
RESULT=$(linear issue create --title "Task" --json)
if echo "$RESULT" | jq -e '.success' > /dev/null; then
  ISSUE_ID=$(echo "$RESULT" | jq -r '.issue.identifier')
fi
```

### Use @me for Self-Assignment

```bash
linear issue create --assignee @me --json
```

### Space-Separate Labels

```bash
linear issue create --label "Backend Feature" --json
```

### Get Project UUID for Milestones

```bash
PROJECT_UUID=$(linear project view PROJECT-SLUG --json | jq -r '.project.id')
linear project milestone create $PROJECT_UUID --name "..." --json
```

## Customization Guide

Users can customize the workflow by editing agent configurations:

### Customize Research Depth

Edit `agents/research-agent.md`:
- Modify research areas list
- Adjust codebase exploration depth
- Change document structure

### Customize Planning Approach

Edit `agents/planning-agent.md`:
- Modify project plan template
- Adjust task breakdown granularity
- Change label application strategy
- Update priority/estimate logic

### Customize Implementation Standards

Edit `agents/engineering-agent.md`:
- Update code quality standards
- Modify testing requirements
- Change documentation expectations
- Adjust progress update frequency

## Common Patterns

### Start New Project

1. Create project in Linear (or use existing)
2. Request research on the topic
3. Review research documents
4. Request project plan
5. Review and provide feedback
6. Request task breakdown
7. Begin implementation

### Add Feature to Existing Project

1. Request focused research on feature
2. Review findings
3. Request implementation plan
4. Create tasks for feature
5. Implement tasks

### Iterative Development

1. Complete initial research and planning
2. Implement first phase tasks
3. Gather learnings
4. Launch research agents for next phase
5. Update plans based on new information
6. Continue iterative cycle

## References

For detailed command syntax and patterns, see:
- `references/command-reference.md` - Complete CLI syntax
- `references/relationship-patterns.md` - Issue dependency patterns
- `references/json-api.md` - JSON response formats

## Troubleshooting

**Agents not launching**:
- Explicitly request: "Use the research-agent to..."
- Check agent files exist in `agents/` directory

**Research incomplete**:
- Specify research areas more explicitly
- Request additional research sub-agents

**Tasks not well-structured**:
- Provide more detailed feedback to planning agent
- Customize planning-agent.md for your workflow

**Implementation issues**:
- Ensure task specs are detailed enough
- Check engineering agent has access to all docs
- Verify related tasks and dependencies are clear
```

### Phase 4: Update Marketplace README

Add customization documentation to `/Users/juanbermudez/Downloads/linear-cli-main/public-marketplace/README.md`:

```markdown
### Customizing the Workflow

The Linear CLI Expert skill uses three specialized agents that can be customized to match your workflow:

**Research Agent** (`agents/research-agent.md`):
- Modify research areas and depth
- Customize document structure
- Adjust parallel research strategy

**Planning Agent** (`agents/planning-agent.md`):
- Change project plan templates
- Adjust task breakdown granularity
- Customize label and priority strategies

**Engineering Agent** (`agents/engineering-agent.md`):
- Update code quality standards
- Modify testing requirements
- Adjust progress update frequency

Edit the agent files directly to customize behavior for your team.
```

## Key Anthropic Documentation References

### Agent Skills Documentation

**Skills Overview** (CRITICAL):
- Skills are model-invoked (Claude decides when to use based on description)
- Use third-person in descriptions
- SKILL.md has YAML frontmatter + Markdown body
- Progressive disclosure: metadata → SKILL.md → bundled resources

**SKILL.md Format**:
```yaml
---
name: skill-name (lowercase, hyphens only, max 64 chars)
description: What skill does and when to use it (max 1024 chars, third-person)
---
```

**File Structure**:
```
skill-name/
├── SKILL.md (required)
├── references/ (loaded as needed by Claude)
├── scripts/ (executable, may not be read into context)
└── assets/ (used in output, not loaded into context)
```

**Key Principles**:
- Write imperative/infinitive form (not second person)
- Include procedural knowledge that helps Claude
- References for detailed docs (keeps SKILL.md lean)
- Scripts for deterministic/repeated code
- Assets for output files (templates, etc.)

### Sub-Agents Documentation

**Agent Configuration Format**:
```markdown
---
name: agent-name
description: Natural language description of agent's purpose (when Claude should use it)
tools: tool1, tool2, tool3  # Optional, inherits all if omitted
model: sonnet|opus|haiku|inherit  # Optional, defaults to sonnet
---

System prompt goes here with detailed instructions.
```

**Key Concepts**:
- Each agent has separate context window
- Agents invoked automatically based on description
- Can be invoked explicitly: "Use the research-agent to..."
- Agent files in `agents/` directory
- Tools: Read, Edit, Write, Bash, Grep, Glob, Task, WebFetch, etc.

**Task Tool for Sub-Agents**:
- Launches specialized agents as subprocesses
- Use for parallel research or focused tasks
- Sub-agents work independently and return results

### Plugins Documentation

**Plugin Structure** (if distributing via marketplace):
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── skill-name/
│       └── SKILL.md
└── agents/ (optional)
    └── agent-name.md
```

**Agent Locations**:
- Plugin agents: `plugin-root/agents/`
- Project agents: `.claude/agents/`
- User agents: `~/.claude/agents/`

## Implementation Checklist

### Phase 1: Cleanup
- [ ] Remove setup_labels.sh script
- [ ] Remove Sprint/Cycle setup section from SKILL.md
- [ ] Remove setup_labels references
- [ ] Update VCS context section (task/project based)
- [ ] Remove "keep content in files" recommendations
- [ ] Test skill still loads after cleanup

### Phase 2: Create Agents
- [ ] Create agents/ directory in skill
- [ ] Write research-agent.md with proper frontmatter
- [ ] Write planning-agent.md with proper frontmatter
- [ ] Write engineering-agent.md with proper frontmatter
- [ ] Test agents appear in /agents interface
- [ ] Test agents can be invoked explicitly

### Phase 3: Update SKILL.md
- [ ] Rewrite with sub-agent workflow focus
- [ ] Add workflow phase descriptions
- [ ] Document agent invocation patterns
- [ ] Add customization guide
- [ ] Keep Linear CLI command reference
- [ ] Test skill activates appropriately

### Phase 4: Documentation
- [ ] Add customization section to marketplace README
- [ ] Update skill README with agent info
- [ ] Document workflow in main README
- [ ] Add troubleshooting guide
- [ ] Create examples of workflow usage

### Phase 5: Testing
- [ ] Test complete research → planning → implementation flow
- [ ] Verify agents launch correctly
- [ ] Test Linear CLI integration
- [ ] Verify document creation works
- [ ] Test task breakdown and sequencing
- [ ] Validate customization points work

## Prompt Engineering Best Practices (Applied Throughout)

### For Agent System Prompts

1. **Clear Role Definition**:
   ```
   You are a [specific role]. Your primary responsibility is [clear goal].
   ```

2. **Structured Instructions**:
   ```
   ## Process
   1. First step with specific action
   2. Second step with expected outcome
   3. Third step with validation
   ```

3. **Concrete Examples**:
   ```
   Example command:
   linear issue create --title "..." --json

   Expected output:
   {"success": true, "issue": {...}}
   ```

4. **Constraints and Boundaries**:
   ```
   Always use --json flag
   Never create cycles (they're auto-generated)
   Don't create files in user's repo
   ```

5. **Output Format Specification**:
   ```
   Each research document should include:
   - Research area/scope
   - Findings and insights
   - Code references with line numbers
   ```

### For SKILL.md Main Instructions

1. **When to Use (Clear Triggers)**:
   ```
   Use when:
   - Starting a new project
   - Planning complex features
   - Breaking down specifications
   ```

2. **Step-by-Step Workflows**:
   ```
   ### Phase 1: Research
   1. Launch research-agent
   2. Review documented findings
   3. Provide feedback or approve
   ```

3. **Concrete Command Examples**:
   ```bash
   # Always show actual commands with flags
   linear project create --name "Project" --team ENG --json
   ```

4. **Customization Points**:
   ```
   Users can modify by editing:
   - agents/research-agent.md - Research depth
   - agents/planning-agent.md - Task granularity
   ```

## Testing Scenarios

### Scenario 1: New Project from Scratch
```
User: "I want to build an OAuth 2.0 authentication system"

Expected flow:
1. Skill launches research agents
2. Research agents investigate: codebase, OAuth specs, existing auth code
3. Agents create docs in Linear project
4. Planning agent synthesizes into project plan
5. User reviews and approves
6. Planning agent creates task breakdown
7. Engineering agent implements tasks
```

### Scenario 2: Add Feature to Existing Project
```
User: "Add password reset functionality to our auth system"

Expected flow:
1. Focused research on password reset patterns
2. Review existing auth architecture
3. Create implementation spec
4. Generate tasks with proper dependencies
5. Implement following established patterns
```

### Scenario 3: Iterative Development
```
User: "Let's start building this in phases"

Expected flow:
1. Initial research and planning for Phase 1
2. Create Phase 1 tasks
3. Implement and gather learnings
4. Research Phase 2 based on Phase 1 learnings
5. Update plans and continue
```

## Success Criteria

The implementation is successful when:

1. **Workflow is Clear**: Users understand research → planning → implementation flow
2. **Agents Work Correctly**: Each agent fulfills its role autonomously
3. **Linear Integration**: All documentation lives in Linear
4. **Customizable**: Users can adapt workflow to their needs
5. **Production Quality**: Follows all best practices for agent prompts
6. **Well Documented**: README and SKILL.md provide clear guidance

## Notes for Implementation

- Use imperative form throughout all agent prompts
- Every command example must include --json flag
- Always provide concrete examples, not abstract descriptions
- Make customization points explicit and easy to find
- Test each phase independently before integrating
- Ensure agents can be invoked both automatically and explicitly
- Keep SKILL.md focused on workflow, detailed commands in references/
- Use Task tool documentation correctly for launching sub-agents
