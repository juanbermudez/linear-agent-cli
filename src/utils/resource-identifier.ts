import { gql } from "../__codegen__/gql.ts"
import { getGraphQLClient } from "./graphql.ts"
import { Select } from "@cliffy/prompt"

/**
 * Resource type enum
 */
export type ResourceType = "issue" | "project" | "document"

/**
 * Parse a Linear URL to extract the resource type and identifier
 * Examples:
 * - https://linear.app/workspace/issue/ABC-123/title -> { type: "issue", id: "ABC-123" }
 * - https://linear.app/workspace/project/uuid/title -> { type: "project", id: "uuid" }
 */
export function parseLinearUrl(
  url: string,
): { type: ResourceType; id: string } | null {
  try {
    const parsedUrl = new URL(url)

    if (!parsedUrl.hostname.includes("linear.app")) {
      return null
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean)

    // Expected: [workspace, type, id, ...slug]
    if (pathParts.length < 3) {
      return null
    }

    const [_workspace, type, id] = pathParts

    if (type === "issue" && id) {
      // Issue identifiers like ABC-123
      if (/^[a-zA-Z0-9]+-[1-9][0-9]*$/i.test(id)) {
        return { type: "issue", id: id.toUpperCase() }
      }
    } else if ((type === "project" || type === "document") && id) {
      // UUIDs
      return { type: type as ResourceType, id }
    }

    return null
  } catch {
    // Not a valid URL
    return null
  }
}

/**
 * Check if a string is a valid UUID
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  )
}

/**
 * Check if a string is a valid issue identifier (e.g., ABC-123)
 */
function isIssueIdentifier(str: string): boolean {
  return /^[a-zA-Z0-9]+-[1-9][0-9]*$/i.test(str)
}

/**
 * Search for issues by title and return matches
 */
async function searchIssues(
  term: string,
  options: { teamId?: string; limit?: number } = {},
): Promise<Array<{ id: string; identifier: string; title: string }>> {
  const query = gql(/* GraphQL */ `
    query SearchIssues($term: String!, $teamId: String, $first: Int) {
      searchIssues(term: $term, teamId: $teamId, first: $first) {
        nodes {
          id
          identifier
          title
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, {
    term,
    teamId: options.teamId,
    first: options.limit || 10,
  })

  return data.searchIssues.nodes
}

/**
 * Search for projects by title and return matches
 */
async function searchProjects(
  term: string,
  options: { teamId?: string; limit?: number } = {},
): Promise<Array<{ id: string; name: string }>> {
  const query = gql(/* GraphQL */ `
    query SearchProjects($term: String!, $teamId: String, $first: Int) {
      searchProjects(term: $term, teamId: $teamId, first: $first) {
        nodes {
          id
          name
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, {
    term,
    teamId: options.teamId,
    first: options.limit || 10,
  })

  return data.searchProjects.nodes
}

/**
 * Search for documents by title and return matches
 */
async function searchDocuments(
  term: string,
  options: { teamId?: string; limit?: number } = {},
): Promise<Array<{ id: string; title: string }>> {
  const query = gql(/* GraphQL */ `
    query SearchDocuments($term: String!, $teamId: String, $first: Int) {
      searchDocuments(term: $term, teamId: $teamId, first: $first) {
        nodes {
          id
          title
        }
      }
    }
  `)

  const client = getGraphQLClient()
  const data = await client.request(query, {
    term,
    teamId: options.teamId,
    first: options.limit || 10,
  })

  return data.searchDocuments.nodes
}

/**
 * Resolve an issue identifier from various input formats
 * Supports: URLs, issue identifiers, UUIDs, or title search
 */
export async function resolveIssueIdentifier(
  input: string,
  options: { teamId?: string; interactive?: boolean } = {},
): Promise<string | null> {
  // Try URL parsing first
  const urlResult = parseLinearUrl(input)
  if (urlResult && urlResult.type === "issue") {
    return urlResult.id
  }

  // Check if it's a valid issue identifier
  if (isIssueIdentifier(input)) {
    return input.toUpperCase()
  }

  // Otherwise, search by title
  const results = await searchIssues(input, {
    teamId: options.teamId,
    limit: 10,
  })

  if (results.length === 0) {
    return null
  }

  if (results.length === 1) {
    return results[0].identifier
  }

  // Multiple results - prompt user if interactive
  if (options.interactive) {
    const answer = await Select.prompt({
      message: "Multiple issues found. Select one:",
      search: true,
      options: results.map((issue) => ({
        name: `${issue.identifier}: ${issue.title}`,
        value: issue.identifier,
      })),
    })
    return answer as string
  }

  // Non-interactive - return first match
  return results[0].identifier
}

/**
 * Resolve a project ID from various input formats
 * Supports: URLs, UUIDs, or title search
 */
export async function resolveProjectId(
  input: string,
  options: { teamId?: string; interactive?: boolean } = {},
): Promise<string | null> {
  // Try URL parsing first
  const urlResult = parseLinearUrl(input)
  if (urlResult && urlResult.type === "project") {
    return urlResult.id
  }

  // Check if it's a UUID
  if (isUUID(input)) {
    return input
  }

  // Otherwise, search by name
  const results = await searchProjects(input, {
    teamId: options.teamId,
    limit: 10,
  })

  if (results.length === 0) {
    return null
  }

  if (results.length === 1) {
    return results[0].id
  }

  // Multiple results - prompt user if interactive
  if (options.interactive) {
    const answer = await Select.prompt({
      message: "Multiple projects found. Select one:",
      search: true,
      options: results.map((project) => ({
        name: project.name,
        value: project.id,
      })),
    })
    return answer as string
  }

  // Non-interactive - return first match
  return results[0].id
}

/**
 * Resolve a document ID from various input formats
 * Supports: URLs, UUIDs, or title search
 */
export async function resolveDocumentId(
  input: string,
  options: { teamId?: string; interactive?: boolean } = {},
): Promise<string | null> {
  // Try URL parsing first
  const urlResult = parseLinearUrl(input)
  if (urlResult && urlResult.type === "document") {
    return urlResult.id
  }

  // Check if it's a UUID
  if (isUUID(input)) {
    return input
  }

  // Otherwise, search by title
  const results = await searchDocuments(input, {
    teamId: options.teamId,
    limit: 10,
  })

  if (results.length === 0) {
    return null
  }

  if (results.length === 1) {
    return results[0].id
  }

  // Multiple results - prompt user if interactive
  if (options.interactive) {
    const answer = await Select.prompt({
      message: "Multiple documents found. Select one:",
      search: true,
      options: results.map((doc) => ({
        name: doc.title,
        value: doc.id,
      })),
    })
    return answer as string
  }

  // Non-interactive - return first match
  return results[0].id
}
