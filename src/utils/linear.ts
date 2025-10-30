import { gql } from "../__codegen__/gql.ts"
import type {
  GetAllTeamsQuery,
  GetAllTeamsQueryVariables as _GetAllTeamsQueryVariables,
  GetTeamMembersQuery,
  IssueFilter,
  IssueSortInput,
} from "../__codegen__/graphql.ts"
import { Select } from "@cliffy/prompt"
import { getOption } from "../config.ts"
import { getGraphQLClient } from "./graphql.ts"
import { getCurrentIssueFromVcs } from "./vcs.ts"
import {
  getTeamCacheKey,
  getWorkspaceCacheKey,
  readCache,
  writeCache,
} from "./cache.ts"

function isValidLinearIdentifier(id: string): boolean {
  return /^[a-zA-Z0-9]+-[1-9][0-9]*$/i.test(id)
}

export function formatIssueIdentifier(providedId: string): string {
  return providedId.toUpperCase()
}

export function getTeamKey(): string | undefined {
  const teamId = getOption("team_id")
  if (teamId) {
    return teamId.toUpperCase()
  }
  return undefined
}

/**
 * based on loose inputs, returns a linear issue identifier like ABC-123
 *
 * formats the provided identifier, adds the team id prefix, or finds one from VCS state
 */
export async function getIssueIdentifier(
  providedId?: string,
): Promise<string | undefined> {
  if (providedId && isValidLinearIdentifier(providedId)) {
    return formatIssueIdentifier(providedId)
  }

  // Handle integer-only IDs by prepending team prefix
  if (providedId && /^[1-9][0-9]*$/.test(providedId)) {
    const teamId = getTeamKey()
    if (teamId) {
      const fullId = `${teamId}-${providedId}`
      if (isValidLinearIdentifier(fullId)) {
        return formatIssueIdentifier(fullId)
      }
    } else {
      throw new Error(
        "an integer id was provided, but no team is set. run `linear configure`",
      )
    }
  }

  if (providedId === undefined) {
    // Look in VCS state (git branch or jj commit trailer)
    const issueId = await getCurrentIssueFromVcs()
    return issueId || undefined
  }
}

export async function getIssueId(
  identifier: string,
): Promise<string | undefined> {
  const query = gql(/* GraphQL */ `
    query GetIssueId($id: String!) {
      issue(id: $id) {
        id
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { id: identifier })
  return data.issue?.id
}

export async function getWorkflowStates(
  teamKey: string,
  options: { refresh?: boolean } = {},
) {
  // Try cache first unless refresh is requested
  if (!options.refresh) {
    const cacheKey = getTeamCacheKey("workflows", teamKey)
    const cached = await readCache<
      Array<{ id: string; name: string; type: string; position: number }>
    >(cacheKey)
    if (cached) {
      return cached
    }
  }

  const query = gql(/* GraphQL */ `
    query GetWorkflowStates($teamKey: String!) {
      team(id: $teamKey) {
        states {
          nodes {
            id
            name
            type
            position
            color
            description
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const result = await client.request(query, { teamKey })
  const sorted = result.team.states.nodes.sort(
    (a: { position: number }, b: { position: number }) =>
      a.position - b.position,
  )

  // Cache the result
  const cacheKey = getTeamCacheKey("workflows", teamKey)
  await writeCache(cacheKey, sorted)

  return sorted
}
export type WorkflowState = Awaited<
  ReturnType<typeof getWorkflowStates>
>[number]

export async function getStartedState(
  teamKey: string,
): Promise<{ id: string; name: string }> {
  const states = await getWorkflowStates(teamKey)
  const startedStates = states.filter((s) => s.type === "started")

  if (!startedStates.length) {
    throw new Error("No 'started' state found in workflow")
  }

  return { id: startedStates[0].id, name: startedStates[0].name }
}

export async function getWorkflowStateByNameOrType(
  teamKey: string,
  nameOrType: string,
): Promise<{ id: string; name: string } | undefined> {
  const states = await getWorkflowStates(teamKey)

  // First try exact name match
  const nameMatch = states.find(
    (s) => s.name.toLowerCase() === nameOrType.toLowerCase(),
  )
  if (nameMatch) {
    return { id: nameMatch.id, name: nameMatch.name }
  }

  // Then try type match
  const typeMatch = states.find((s) => s.type === nameOrType.toLowerCase())
  if (typeMatch) {
    return { id: typeMatch.id, name: typeMatch.name }
  }

  return undefined
}

export async function updateIssueState(
  issueId: string,
  stateId: string,
): Promise<void> {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateIssueState($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
      }
    }
  `)

  const client = getGraphQLClient()
  await client.request(mutation, { issueId, stateId })
}

export async function fetchIssueDetails(
  issueId: string,
  showSpinner = false,
  includeComments = false,
): Promise<any> {
  const { Spinner } = await import("@std/cli/unstable-spinner")
  const spinner = showSpinner ? new Spinner() : null
  spinner?.start()
  try {
    const queryWithComments = gql(/* GraphQL */ `
      query GetIssueDetailsWithComments($id: String!) {
        issue(id: $id) {
          title
          description
          url
          branchName
          identifier
          priority
          estimate
          dueDate
          createdAt
          updatedAt
          assignee {
            id
            name
            displayName
          }
          state {
            id
            name
            type
          }
          team {
            key
            name
          }
          project {
            id
            name
          }
          projectMilestone {
            id
            name
            targetDate
          }
          cycle {
            id
            name
            startsAt
            endsAt
          }
          parent {
            id
            identifier
            title
          }
          children {
            nodes {
              id
              identifier
              title
              state {
                name
              }
            }
          }
          relations {
            nodes {
              id
              type
              relatedIssue {
                id
                identifier
                title
                state {
                  name
                }
              }
            }
          }
          inverseRelations {
            nodes {
              id
              type
              issue {
                id
                identifier
                title
                state {
                  name
                }
              }
            }
          }
          labels {
            nodes {
              id
              name
              color
              parent {
                name
              }
            }
          }
          comments(first: 50, orderBy: createdAt) {
            nodes {
              id
              body
              createdAt
              user {
                name
                displayName
              }
              externalUser {
                name
                displayName
              }
              parent {
                id
              }
            }
          }
        }
      }
    `)

    const queryWithoutComments = gql(/* GraphQL */ `
      query GetIssueDetails($id: String!) {
        issue(id: $id) {
          title
          description
          url
          branchName
          identifier
          priority
          estimate
          dueDate
          createdAt
          updatedAt
          assignee {
            id
            name
            displayName
          }
          state {
            id
            name
            type
          }
          team {
            key
            name
          }
          project {
            id
            name
          }
          projectMilestone {
            id
            name
            targetDate
          }
          cycle {
            id
            name
            startsAt
            endsAt
          }
          parent {
            id
            identifier
            title
          }
          children {
            nodes {
              id
              identifier
              title
              state {
                name
              }
            }
          }
          relations {
            nodes {
              id
              type
              relatedIssue {
                id
                identifier
                title
                state {
                  name
                }
              }
            }
          }
          inverseRelations {
            nodes {
              id
              type
              issue {
                id
                identifier
                title
                state {
                  name
                }
              }
            }
          }
          labels {
            nodes {
              id
              name
              color
              parent {
                name
              }
            }
          }
        }
      }
    `)

    const client = getGraphQLClient()

    if (includeComments) {
      const data = await client.request(queryWithComments, { id: issueId })
      spinner?.stop()
      return {
        ...data.issue,
        comments: data.issue.comments?.nodes || [],
      }
    } else {
      const data = await client.request(queryWithoutComments, { id: issueId })
      spinner?.stop()
      return data.issue
    }
  } catch (error) {
    spinner?.stop()
    console.error("✗ Failed to fetch issue details")
    throw error
  }
}

export async function fetchParentIssueTitle(
  parentId: string,
): Promise<string | null> {
  try {
    const query = gql(/* GraphQL */ `
      query GetParentIssueTitle($id: String!) {
        issue(id: $id) {
          title
          identifier
        }
      }
    `)
    const client = getGraphQLClient()
    const data = await client.request(query, { id: parentId })
    return `${data.issue.identifier}: ${data.issue.title}`
  } catch (_error) {
    console.error("✗ Failed to fetch parent issue details")
    return null
  }
}

export async function fetchParentIssueData(parentId: string): Promise<
  {
    title: string
    identifier: string
    projectId: string | null
  } | null
> {
  try {
    const query = gql(/* GraphQL */ `
      query GetParentIssueData($id: String!) {
        issue(id: $id) {
          title
          identifier
          project {
            id
          }
        }
      }
    `)
    const client = getGraphQLClient()
    const data = await client.request(query, { id: parentId })
    return {
      title: data.issue.title,
      identifier: data.issue.identifier,
      projectId: data.issue.project?.id || null,
    }
  } catch (_error) {
    console.error("✗ Failed to fetch parent issue details")
    return null
  }
}

export async function fetchIssuesForState(
  teamKey: string,
  state: string[] | undefined,
  assignee?: string,
  unassigned = false,
  allAssignees = false,
) {
  const sort = getOption("issue_sort") as "manual" | "priority" | undefined
  if (!sort) {
    console.error(
      "Sort must be provided via configuration file or LINEAR_ISSUE_SORT environment variable",
    )
    Deno.exit(1)
  }

  // Build filter and query based on the assignee parameter
  const filter: IssueFilter = {
    team: { key: { eq: teamKey } },
  }

  // Only add state filter if state is specified
  if (state) {
    filter.state = { type: { in: state } }
  }

  if (unassigned) {
    filter.assignee = { null: true }
  } else if (allAssignees) {
    // No assignee filter means all assignees
  } else if (assignee) {
    // Get user ID for the specified username
    const userId = await lookupUserId(assignee)
    if (!userId) {
      throw new Error(`User not found: ${assignee}`)
    }
    filter.assignee = { id: { eq: userId } }
  } else {
    filter.assignee = { isMe: { eq: true } }
  }

  const query = gql(/* GraphQL */ `
    query GetIssuesForState($sort: [IssueSortInput!], $filter: IssueFilter!) {
      issues(filter: $filter, sort: $sort) {
        nodes {
          id
          identifier
          title
          priority
          estimate
          assignee {
            initials
          }
          state {
            id
            name
            color
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          updatedAt
        }
      }
    }
  `)

  let sortPayload: Array<IssueSortInput>
  switch (sort) {
    case "manual":
      sortPayload = [
        { workflowState: { order: "Descending" } },
        { manual: { nulls: "last" as const, order: "Ascending" as const } },
      ]
      break
    case "priority":
      sortPayload = [
        { workflowState: { order: "Descending" } },
        { priority: { nulls: "last" as const, order: "Descending" as const } },
      ]
      break
    default:
      throw new Error(`Unknown sort type: ${sort}`)
  }

  const client = getGraphQLClient()
  return await client.request(query, {
    sort: sortPayload,
    filter,
  })
}

// Additional helper functions that were in the original main.ts

export async function getProjectIdByName(
  name: string,
): Promise<string | undefined> {
  // If input looks like a UUID, return it directly
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidPattern.test(name)) {
    return name
  }

  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetProjectIdByName($name: String!) {
      projects(filter: { name: { eq: $name } }) {
        nodes {
          id
        }
      }
    }
  `)
  const data = await client.request(query, { name })
  return data.projects?.nodes[0]?.id
}

export async function getProjectOptionsByName(
  name: string,
): Promise<Record<string, string>> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetProjectIdOptionsByName($name: String!) {
      projects(filter: { name: { containsIgnoreCase: $name } }) {
        nodes {
          id
          name
        }
      }
    }
  `)
  const data = await client.request(query, { name })
  const qResults = data.projects?.nodes || []
  return Object.fromEntries(qResults.map((t) => [t.id, t.name]))
}

export async function getTeamIdByKey(
  team: string,
): Promise<string | undefined> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetTeamIdByKey($team: String!) {
      teams(filter: { key: { eq: $team } }) {
        nodes {
          id
        }
      }
    }
  `)
  const data = await client.request(query, { team })
  return data.teams?.nodes[0]?.id
}

export async function searchTeamsByKeySubstring(
  keySubstring: string,
): Promise<Record<string, string>> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetTeamIdOptionsByKey($team: String!) {
      teams(filter: { key: { containsIgnoreCase: $team } }) {
        nodes {
          id
          key
          name
        }
      }
    }
  `)
  const data = await client.request(query, { team: keySubstring })
  const qResults = data.teams?.nodes || []
  // Sort teams alphabetically by key (case insensitive) and format as "Name (KEY)"
  const sortedResults = qResults.sort((a, b) =>
    a.key.toLowerCase().localeCompare(b.key.toLowerCase())
  )
  return Object.fromEntries(
    sortedResults.map((t) => [
      t.id,
      `${(t as { id: string; key: string; name: string }).name} (${t.key})`,
    ]),
  )
}

export async function listUsers(): Promise<Array<{ id: string; displayName: string; email: string }>> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query ListUsers {
      users {
        nodes {
          id
          displayName
          email
        }
      }
    }
  `)
  const data = await client.request(query)
  return data.users.nodes
}

export async function lookupUserId(
  /**
   * email, username, display name, or '@me' for viewer
   */
  input: "@me" | string,
): Promise<string | undefined> {
  if (input === "@me") {
    const client = getGraphQLClient()
    const query = gql(/* GraphQL */ `
      query GetViewerId {
        viewer {
          id
        }
      }
    `)
    const data = await client.request(query, {})
    return data.viewer.id
  } else {
    const client = getGraphQLClient()
    const query = gql(/* GraphQL */ `
      query LookupUser($input: String!) {
        users(
          filter: {
            or: [
              { email: { eqIgnoreCase: $input } }
              { displayName: { eqIgnoreCase: $input } }
              { name: { containsIgnoreCaseAndAccent: $input } }
            ]
          }
        ) {
          nodes {
            id
            email
            displayName
            name
          }
        }
      }
    `)
    const data = await client.request(query, { input })

    if (!data.users?.nodes?.length) {
      return undefined
    }

    // Priority matching: email > displayName > name
    for (const user of data.users.nodes) {
      if (user.email?.toLowerCase() === input.toLowerCase()) {
        return user.id
      }
    }

    for (const user of data.users.nodes) {
      if (user.displayName?.toLowerCase() === input.toLowerCase()) {
        return user.id
      }
    }

    // If no exact email or displayName match, return first name match
    return data.users.nodes[0]?.id
  }
}

export async function getIssueLabelIdByNameForTeam(
  name: string,
  teamKey: string,
): Promise<string | undefined> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetIssueLabelIdByNameForTeam($name: String!, $teamKey: String!) {
      issueLabels(
        filter: {
          name: { eqIgnoreCase: $name }
          or: [{ team: { key: { eq: $teamKey } } }, { team: { null: true } }]
        }
      ) {
        nodes {
          id
          name
        }
      }
    }
  `)
  const data = await client.request(query, { name, teamKey })
  return data.issueLabels?.nodes[0]?.id
}

export async function getIssueLabelOptionsByNameForTeam(
  name: string,
  teamKey: string,
): Promise<Record<string, string>> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetIssueLabelIdOptionsByNameForTeam(
      $name: String!
      $teamKey: String!
    ) {
      issueLabels(
        filter: {
          name: { containsIgnoreCase: $name }
          or: [{ team: { key: { eq: $teamKey } } }, { team: { null: true } }]
        }
      ) {
        nodes {
          id
          name
        }
      }
    }
  `)
  const data = await client.request(query, { name, teamKey })
  const qResults = data.issueLabels?.nodes || []
  // Sort labels alphabetically (case insensitive)
  const sortedResults = qResults.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
  return Object.fromEntries(sortedResults.map((t) => [t.id, t.name]))
}

export async function getAllTeams(): Promise<
  Array<{ id: string; key: string; name: string }>
> {
  const client = getGraphQLClient()

  const query = gql(/* GraphQL */ `
    query GetAllTeams($first: Int, $after: String) {
      teams(first: $first, after: $after) {
        nodes {
          id
          key
          name
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `)

  const allTeams = []
  let hasNextPage = true
  let after: string | null | undefined = undefined

  while (hasNextPage) {
    const result: GetAllTeamsQuery = await client.request(query, {
      first: 100, // Fetch 100 teams per page
      after,
    })

    const teams = result.teams.nodes
    allTeams.push(...teams)

    hasNextPage = result.teams.pageInfo.hasNextPage
    after = result.teams.pageInfo.endCursor
  }

  // Sort teams alphabetically by name (case insensitive)
  return allTeams.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
}

export async function getLabelsForTeam(
  teamKey: string,
): Promise<Array<{ id: string; name: string; color: string }>> {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetLabelsForTeam($teamKey: String!) {
      team(id: $teamKey) {
        labels {
          nodes {
            id
            name
            color
          }
        }
      }
    }
  `)

  const result = await client.request(query, { teamKey })
  const labels = result.team?.labels?.nodes || []

  // Sort labels alphabetically (case insensitive)
  return labels.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
}

export async function getCycles(teamKey: string): Promise<Array<{
  id: string
  name: string
  startsAt: string
  endsAt: string
}>> {
  const teamId = await getTeamIdByKey(teamKey)
  if (!teamId) return []

  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetCycles($teamId: String!) {
      team(id: $teamId) {
        cycles(first: 50, filter: { isActive: { eq: true } }) {
          nodes {
            id
            name
            startsAt
            endsAt
          }
        }
      }
    }
  `)

  const data = await client.request(query, { teamId })
  const cycles = data.team?.cycles?.nodes || []

  // Filter out cycles with missing required fields and convert to expected type
  return cycles
    .filter((c): c is { id: string; name: string; startsAt: string; endsAt: string } =>
      c != null && c.name != null
    )
    .map(c => ({
      id: c.id,
      name: c.name,
      startsAt: String(c.startsAt),
      endsAt: String(c.endsAt),
    }))
}

export async function getCycleId(teamKey: string, cycleName: string): Promise<string | undefined> {
  const cycles = await getCycles(teamKey)
  const cycle = cycles.find(c =>
    c.name.toLowerCase() === cycleName.toLowerCase() || c.id === cycleName
  )
  return cycle?.id
}

export async function getProjectMilestones(projectIdOrName: string): Promise<Array<{
  id: string
  name: string
  targetDate?: string
}>> {
  const projectId = await getProjectIdByName(projectIdOrName)
  if (!projectId) return []

  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetProjectMilestones($projectId: String!) {
      project(id: $projectId) {
        projectMilestones {
          nodes {
            id
            name
            targetDate
          }
        }
      }
    }
  `)

  const data = await client.request(query, { projectId })
  const milestones = data.project?.projectMilestones?.nodes || []

  // Filter out milestones with missing required fields and convert to expected type
  return milestones
    .filter((m): m is { id: string; name: string; targetDate?: string | null } =>
      m != null && m.name != null
    )
    .map(m => ({
      id: m.id,
      name: m.name,
      targetDate: m.targetDate ?? undefined,
    }))
}

export async function getProjectMilestoneId(projectId: string, milestoneName: string): Promise<string | undefined> {
  const milestones = await getProjectMilestones(projectId)
  const milestone = milestones.find(m =>
    m.name.toLowerCase() === milestoneName.toLowerCase() || m.id === milestoneName
  )
  return milestone?.id
}

export async function getTeamMembers(teamKey: string) {
  const client = getGraphQLClient()
  const query = gql(/* GraphQL */ `
    query GetTeamMembers($teamKey: String!, $first: Int, $after: String) {
      team(id: $teamKey) {
        members(first: $first, after: $after) {
          nodes {
            id
            name
            displayName
            email
            active
            initials
            description
            timezone
            lastSeen
            statusEmoji
            statusLabel
            guest
            isAssignable
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `)

  const allMembers = []
  let hasNextPage = true
  let after: string | null | undefined = undefined

  while (hasNextPage) {
    const result: GetTeamMembersQuery = await client.request(query, {
      teamKey,
      first: 100, // Fetch 100 members per page
      after,
    })

    const members = result.team.members.nodes
    allMembers.push(...members)

    hasNextPage = result.team.members.pageInfo.hasNextPage
    after = result.team.members.pageInfo.endCursor
  }

  // Sort members alphabetically by display name (case insensitive)
  return allMembers.sort((a, b) =>
    a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
  )
}

export async function selectOption(
  dataName: string,
  originalValue: string,
  options: Record<string, string>,
): Promise<string | undefined> {
  const NO = Object()
  const keys = Object.keys(options)
  if (keys.length === 0) {
    return undefined
  } else if (keys.length === 1) {
    const key = keys[0]
    const result = await Select.prompt({
      message: `${dataName} named ${originalValue} does not exist, but ${
        options[key]
      } exists. Is this what you meant?`,
      options: [
        { name: "yes", value: key },
        { name: "no", value: NO },
      ],
    })
    return result === NO ? undefined : result
  } else {
    const result = await Select.prompt({
      message:
        `${dataName} with ${originalValue} does not exist, but the following exist. Is any of these what you meant?`,
      options: [
        ...Object.entries(options).map(([value, name]: [string, string]) => ({
          name,
          value,
        })),
        { name: "none of the above", value: NO },
      ],
    })
    return result === NO ? undefined : result
  }
}

// ============================================================================
// Document Commands
// ============================================================================

export async function createDocument(input: {
  title: string
  content?: string
  icon?: string
  color?: string
  projectId?: string
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateDocument($input: DocumentCreateInput!) {
      documentCreate(input: $input) {
        success
        document {
          id
          title
          slugId
          url
          project {
            id
            name
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.documentCreate.success || !data.documentCreate.document) {
    throw new Error("Failed to create document")
  }

  return data.documentCreate.document
}

export async function updateDocument(
  id: string,
  input: {
    title?: string
    content?: string
    icon?: string
    color?: string
    projectId?: string
  },
) {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateDocument($id: String!, $input: DocumentUpdateInput!) {
      documentUpdate(id: $id, input: $input) {
        success
        document {
          id
          title
          slugId
          url
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id, input })

  if (!data.documentUpdate.success || !data.documentUpdate.document) {
    throw new Error("Failed to update document")
  }

  return data.documentUpdate.document
}

export async function deleteDocument(id: string): Promise<boolean> {
  const mutation = gql(/* GraphQL */ `
    mutation DeleteDocument($id: String!) {
      documentDelete(id: $id) {
        success
        entity {
          id
          title
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })
  return data.documentDelete.success
}

export async function unarchiveDocument(id: string) {
  const mutation = gql(/* GraphQL */ `
    mutation UnarchiveDocument($id: String!) {
      documentUnarchive(id: $id) {
        success
        entity {
          id
          title
          url
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })

  if (!data.documentUnarchive.success || !data.documentUnarchive.entity) {
    throw new Error("Failed to restore document")
  }

  return data.documentUnarchive.entity
}

export async function listDocuments(options: {
  projectId?: string
  initiativeId?: string
  creatorId?: string
  limit?: number
  includeArchived?: boolean
} = {}) {
  const query = gql(/* GraphQL */ `
    query ListDocuments(
      $filter: DocumentFilter
      $first: Int
      $orderBy: PaginationOrderBy
      $includeArchived: Boolean
    ) {
      documents(
        filter: $filter
        first: $first
        orderBy: $orderBy
        includeArchived: $includeArchived
      ) {
        nodes {
          id
          title
          slugId
          icon
          color
          createdAt
          updatedAt
          url
          creator {
            id
            name
            displayName
          }
          project {
            id
            name
          }
          initiative {
            id
            name
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `)

  const client = getGraphQLClient()

  const filter: Record<string, unknown> = {}
  if (options.projectId) {
    filter.project = { id: { eq: options.projectId } }
  }
  if (options.initiativeId) {
    filter.initiative = { id: { eq: options.initiativeId } }
  }
  if (options.creatorId) {
    filter.creator = { id: { eq: options.creatorId } }
  }

  const data = await client.request(query, {
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    first: options.limit || 50,
    orderBy: "updatedAt",
    includeArchived: options.includeArchived || false,
  })

  return data.documents.nodes
}

export async function viewDocument(id: string) {
  const query = gql(/* GraphQL */ `
    query ViewDocument($id: String!) {
      document(id: $id) {
        id
        title
        slugId
        icon
        color
        url
        createdAt
        updatedAt
        creator {
          id
          name
          displayName
        }
        updatedBy {
          id
          name
          displayName
        }
        project {
          id
          name
          url
        }
        initiative {
          id
          name
          url
        }
        content
        comments {
          nodes {
            id
            body
            createdAt
            user {
              id
              name
              displayName
            }
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { id })
  return data.document
}

// ============================================================================
// Project Commands
// ============================================================================

export async function listProjectStatuses() {
  const query = gql(/* GraphQL */ `
    query ListProjectStatuses {
      projectStatuses {
        nodes {
          id
          name
          type
          color
          description
          position
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query)
  return data.projectStatuses.nodes.sort((a, b) => a.position - b.position)
}

export async function createProject(input: {
  name: string
  teamIds: string[]
  description?: string
  content?: string
  statusId?: string
  leadId?: string
  icon?: string
  color?: string
  startDate?: string
  targetDate?: string
  priority?: number
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project {
          id
          name
          slugId
          url
          status {
            id
            name
            type
          }
          lead {
            id
            name
            displayName
          }
          teams {
            nodes {
              id
              key
              name
            }
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.projectCreate.success || !data.projectCreate.project) {
    throw new Error("Failed to create project")
  }

  return data.projectCreate.project
}

export async function updateProject(
  id: string,
  input: {
    name?: string
    description?: string
    content?: string
    statusId?: string
    leadId?: string
    icon?: string
    color?: string
    teamIds?: string[]
    startDate?: string
    targetDate?: string
    priority?: number
  },
) {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
      projectUpdate(id: $id, input: $input) {
        success
        project {
          id
          name
          slugId
          url
          status {
            id
            name
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id, input })

  if (!data.projectUpdate.success || !data.projectUpdate.project) {
    throw new Error("Failed to update project")
  }

  return data.projectUpdate.project
}

export async function deleteProject(id: string): Promise<boolean> {
  const mutation = gql(/* GraphQL */ `
    mutation DeleteProject($id: String!) {
      projectDelete(id: $id) {
        success
        entity {
          id
          name
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })
  return data.projectDelete.success
}

export async function unarchiveProject(id: string) {
  const mutation = gql(/* GraphQL */ `
    mutation UnarchiveProject($id: String!) {
      projectUnarchive(id: $id) {
        success
        entity {
          id
          name
          url
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })

  if (!data.projectUnarchive.success || !data.projectUnarchive.entity) {
    throw new Error("Failed to restore project")
  }

  return data.projectUnarchive.entity
}

// ============================================================================
// Project Milestone Commands
// ============================================================================

export async function createMilestone(input: {
  projectId: string
  name: string
  description?: string
  targetDate?: string
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateMilestone($input: ProjectMilestoneCreateInput!) {
      projectMilestoneCreate(input: $input) {
        success
        projectMilestone {
          id
          name
          description
          targetDate
          status
          progress
          project {
            id
            name
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.projectMilestoneCreate.success || !data.projectMilestoneCreate.projectMilestone) {
    throw new Error("Failed to create milestone")
  }

  return data.projectMilestoneCreate.projectMilestone
}

export async function listMilestones(projectId: string) {
  const query = gql(/* GraphQL */ `
    query ListProjectMilestones($projectId: String!) {
      project(id: $projectId) {
        id
        name
        projectMilestones {
          nodes {
            id
            name
            description
            targetDate
            status
            progress
            sortOrder
            createdAt
            updatedAt
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { projectId })
  return data.project.projectMilestones.nodes.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function updateMilestone(
  id: string,
  input: {
    name?: string
    description?: string
    targetDate?: string
    status?: string
  },
) {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateMilestone($id: String!, $input: ProjectMilestoneUpdateInput!) {
      projectMilestoneUpdate(id: $id, input: $input) {
        success
        projectMilestone {
          id
          name
          description
          targetDate
          status
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id, input })

  if (!data.projectMilestoneUpdate.success || !data.projectMilestoneUpdate.projectMilestone) {
    throw new Error("Failed to update milestone")
  }

  return data.projectMilestoneUpdate.projectMilestone
}

export async function deleteMilestone(id: string): Promise<boolean> {
  const mutation = gql(/* GraphQL */ `
    mutation DeleteMilestone($id: String!) {
      projectMilestoneDelete(id: $id) {
        success
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })
  return data.projectMilestoneDelete.success
}

// ============================================================================
// Project Status Update Commands
// ============================================================================

export async function createProjectUpdate(input: {
  projectId: string
  body: string
  health: string
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateProjectUpdate($input: ProjectUpdateCreateInput!) {
      projectUpdateCreate(input: $input) {
        success
        projectUpdate {
          id
          body
          health
          createdAt
          url
          user {
            id
            name
            displayName
          }
          project {
            id
            name
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.projectUpdateCreate.success || !data.projectUpdateCreate.projectUpdate) {
    throw new Error("Failed to create project update")
  }

  return data.projectUpdateCreate.projectUpdate
}

export async function listProjectUpdates(projectId: string, limit = 20) {
  const query = gql(/* GraphQL */ `
    query ListProjectUpdates($projectId: String!, $first: Int) {
      project(id: $projectId) {
        id
        name
        projectUpdates(first: $first) {
          nodes {
            id
            body
            health
            createdAt
            updatedAt
            url
            user {
              id
              name
              displayName
            }
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { projectId, first: limit })
  return data.project.projectUpdates.nodes
}

// ============================================================================
// Initiative Commands
// ============================================================================

export async function listInitiativeStatuses() {
  // Initiative statuses are now simple enums: Planned, Active, Completed
  // Return a static list matching the schema enum
  return [
    { id: "planned", name: "Planned", type: "planned", color: "#95A2B3", description: "Planning phase", position: 0 },
    { id: "active", name: "Active", type: "active", color: "#5E6AD2", description: "Currently active", position: 1 },
    { id: "completed", name: "Completed", type: "completed", color: "#26B5CE", description: "Completed", position: 2 },
  ]
}

export async function createInitiative(input: {
  name: string
  description?: string
  content?: string
  statusId?: string
  ownerId?: string
  targetDate?: string
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateInitiative($input: InitiativeCreateInput!) {
      initiativeCreate(input: $input) {
        success
        initiative {
          id
          name
          slugId
          url
          status
          owner {
            id
            name
            displayName
          }
          targetDate
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.initiativeCreate.success || !data.initiativeCreate.initiative) {
    throw new Error("Failed to create initiative")
  }

  return data.initiativeCreate.initiative
}

export async function updateInitiative(
  id: string,
  input: {
    name?: string
    description?: string
    content?: string
    statusId?: string
    ownerId?: string
    targetDate?: string
  },
) {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateInitiative($id: String!, $input: InitiativeUpdateInput!) {
      initiativeUpdate(id: $id, input: $input) {
        success
        initiative {
          id
          name
          slugId
          url
          status
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id, input })

  if (!data.initiativeUpdate.success || !data.initiativeUpdate.initiative) {
    throw new Error("Failed to update initiative")
  }

  return data.initiativeUpdate.initiative
}

export async function listInitiatives(options: {
  statusId?: string
  ownerId?: string
  limit?: number
} = {}) {
  const query = gql(/* GraphQL */ `
    query ListInitiatives($filter: InitiativeFilter, $first: Int) {
      initiatives(filter: $filter, first: $first) {
        nodes {
          id
          name
          slugId
          url
          description
          status
          owner {
            id
            name
            displayName
          }
          targetDate
          createdAt
          updatedAt
        }
      }
    }
  `)

  const client = getGraphQLClient()

  const filter: Record<string, unknown> = {}
  if (options.statusId) {
    filter.status = { eq: options.statusId }
  }
  if (options.ownerId) {
    filter.owner = { id: { eq: options.ownerId } }
  }

  const data = await client.request(query, {
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    first: options.limit || 50,
  })

  return data.initiatives.nodes
}

export async function viewInitiative(id: string) {
  const query = gql(/* GraphQL */ `
    query ViewInitiative($id: String!) {
      initiative(id: $id) {
        id
        name
        slugId
        url
        description
        content
        status
        owner {
          id
          name
          displayName
        }
        targetDate
        createdAt
        updatedAt
        projects {
          nodes {
            id
            name
            slugId
            status {
              name
              type
            }
            progress
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { id })
  return data.initiative
}

export async function archiveInitiative(id: string): Promise<boolean> {
  const mutation = gql(/* GraphQL */ `
    mutation ArchiveInitiative($id: String!) {
      initiativeArchive(id: $id) {
        success
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })
  return data.initiativeArchive.success
}

export async function unarchiveInitiative(id: string) {
  const mutation = gql(/* GraphQL */ `
    mutation UnarchiveInitiative($id: String!) {
      initiativeUnarchive(id: $id) {
        success
        entity {
          id
          name
          url
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id })

  if (!data.initiativeUnarchive.success || !data.initiativeUnarchive.entity) {
    throw new Error("Failed to restore initiative")
  }

  return data.initiativeUnarchive.entity
}

// Initiative Project Management
export async function addProjectToInitiative(
  initiativeId: string,
  projectId: string,
) {
  const mutation = gql(/* GraphQL */ `
    mutation InitiativeAddProject($initiativeId: String!, $projectId: String!) {
      initiativeToProjectCreate(
        input: {
          initiativeId: $initiativeId
          projectId: $projectId
        }
      ) {
        success
        initiativeToProject {
          id
          initiative {
            id
            name
            slugId
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { initiativeId, projectId })

  if (!data.initiativeToProjectCreate.success) {
    throw new Error("Failed to add project to initiative")
  }

  return data.initiativeToProjectCreate.initiativeToProject.initiative
}

export async function removeProjectFromInitiative(
  initiativeId: string,
  projectId: string,
) {
  const mutation = gql(/* GraphQL */ `
    mutation InitiativeRemoveProject($id: String!) {
      initiativeToProjectDelete(id: $id) {
        success
      }
    }
  `)

  const client = getGraphQLClient()

  // Note: We need to find the initiativeToProject ID first
  // For now, this is a simplified version that needs the relation ID
  const data = await client.request(mutation, { id: `${initiativeId}-${projectId}` })

  if (!data.initiativeToProjectDelete.success) {
    throw new Error("Failed to remove project from initiative")
  }

  return { success: true }
}

// Initiative Status Updates
export async function createInitiativeUpdate(input: {
  initiativeId: string
  body: string
  health: string
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateInitiativeUpdate($input: InitiativeUpdateCreateInput!) {
      initiativeUpdateCreate(input: $input) {
        success
        initiativeUpdate {
          id
          health
          body
          url
          createdAt
          user {
            id
            displayName
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (
    !data.initiativeUpdateCreate.success ||
    !data.initiativeUpdateCreate.initiativeUpdate
  ) {
    throw new Error("Failed to create initiative update")
  }

  return data.initiativeUpdateCreate.initiativeUpdate
}

export async function listInitiativeUpdates(
  initiativeId: string,
  limit?: number,
) {
  const query = gql(/* GraphQL */ `
    query ListInitiativeUpdates($filter: InitiativeUpdateFilter, $first: Int) {
      initiativeUpdates(filter: $filter, first: $first) {
        nodes {
          id
          health
          body
          url
          createdAt
          user {
            id
            displayName
          }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, {
    filter: { initiative: { id: { eq: initiativeId } } },
    first: limit || 20,
  })

  return data.initiativeUpdates.nodes
}

// Label Commands
export async function createLabel(input: {
  name: string
  description?: string
  color?: string
  teamId?: string
  parentId?: string
  isGroup?: boolean
}) {
  const mutation = gql(/* GraphQL */ `
    mutation CreateLabel($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) {
        success
        issueLabel {
          id
          name
          description
          color
          team { id key name }
          parent { id name }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { input })

  if (!data.issueLabelCreate.success || !data.issueLabelCreate.issueLabel) {
    throw new Error("Failed to create label")
  }

  return data.issueLabelCreate.issueLabel
}

export async function updateLabel(
  labelId: string,
  input: {
    name?: string
    description?: string
    color?: string
  },
) {
  const mutation = gql(/* GraphQL */ `
    mutation UpdateLabel($id: String!, $input: IssueLabelUpdateInput!) {
      issueLabelUpdate(id: $id, input: $input) {
        success
        issueLabel {
          id
          name
          description
          color
          team { id key name }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id: labelId, input })

  if (!data.issueLabelUpdate.success || !data.issueLabelUpdate.issueLabel) {
    throw new Error("Failed to update label")
  }

  return data.issueLabelUpdate.issueLabel
}

export async function listLabelsForTeam(teamId?: string) {
  const query = gql(/* GraphQL */ `
    query ListLabels($teamId: ID, $first: Int) {
      issueLabels(
        filter: { team: { id: { eq: $teamId } } }
        first: $first
      ) {
        nodes {
          id
          name
          description
          color
          team { id key name }
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { teamId, first: 100 })

  return data.issueLabels.nodes
}

export async function getLabelIdByName(labelName: string, teamKey: string): Promise<string | undefined> {
  const teamId = await getTeamIdByKey(teamKey)
  if (!teamId) {
    return undefined
  }

  const query = gql(/* GraphQL */ `
    query GetLabelByName($teamId: ID, $first: Int) {
      issueLabels(
        filter: { team: { id: { eq: $teamId } } }
        first: $first
      ) {
        nodes {
          id
          name
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, { teamId, first: 100 })

  const label = data.issueLabels.nodes.find((l: { name: string }) =>
    l.name.toLowerCase() === labelName.toLowerCase()
  )

  return label?.id
}

export async function deleteLabel(labelId: string) {
  const mutation = gql(/* GraphQL */ `
    mutation DeleteLabel($id: String!) {
      issueLabelDelete(id: $id) {
        success
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(mutation, { id: labelId })

  if (!data.issueLabelDelete.success) {
    throw new Error("Failed to delete label")
  }

  return { success: true }
}

// VCS Integration for Documents
export async function getCurrentProjectFromIssue(): Promise<{
  id: string
  name: string
} | null> {
  const issueId = await getCurrentIssueIdFromVcs()
  if (!issueId) {
    return null
  }

  const query = gql(/* GraphQL */ `
    query GetIssueProject($issueId: String!) {
      issue(id: $issueId) {
        id
        project {
          id
          name
        }
      }
    }
  `)

  const client = getGraphQLClient()
  try {
    const data = await client.request(query, { issueId })
    return data.issue.project
  } catch {
    return null
  }
}

export async function getProjectIdFromContext(): Promise<string | null> {
  const projectFromIssue = await getCurrentProjectFromIssue()
  if (projectFromIssue) {
    return projectFromIssue.id
  }

  return null
}

/**
 * Get all project statuses (workspace-wide)
 * Supports caching with 24h TTL
 */
export async function getProjectStatuses(
  options: { refresh?: boolean } = {},
) {
  // Try cache first unless refresh is requested
  if (!options.refresh) {
    const cacheKey = "project-statuses"
    const cached = await readCache<
      Array<{
        id: string
        name: string
        type: string
        position: number
        color: string
        description: string | null
      }>
    >(cacheKey)
    if (cached) {
      return cached
    }
  }

  const query = gql(/* GraphQL */ `
    query GetProjectStatuses {
      projectStatuses {
        nodes {
          id
          name
          type
          position
          color
          description
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const result = await client.request(query)
  const sorted = result.projectStatuses.nodes.sort(
    (a: { position: number }, b: { position: number }) =>
      a.position - b.position,
  )

  // Cache the result
  const cacheKey = "project-statuses"
  await writeCache(cacheKey, sorted)

  return sorted
}

export type ProjectStatus = Awaited<
  ReturnType<typeof getProjectStatuses>
>[number]
