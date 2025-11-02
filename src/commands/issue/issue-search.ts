import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { bold, dim, yellow } from "@std/fmt/colors"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

const issueSearchQuery = gql(/* GraphQL */ `
  query SearchIssues(
    $term: String!
    $first: Int
    $includeArchived: Boolean
    $includeComments: Boolean
    $teamId: String
  ) {
    searchIssues(
      term: $term
      first: $first
      includeArchived: $includeArchived
      includeComments: $includeComments
      teamId: $teamId
    ) {
      nodes {
        id
        identifier
        title
        description
        priority
        estimate
        state {
          name
          type
        }
        team {
          key
          name
        }
        assignee {
          name
          displayName
        }
        createdAt
        updatedAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`)

export const searchCommand = new Command()
  .name("search")
  .description("Search issues by keyword (searches title and description)")
  .arguments("<term:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option(
    "--limit <limit:number>",
    "Maximum number of results to return (default: 50)",
  )
  .option(
    "--include-archived",
    "Include archived issues in search results (default: false)",
  )
  .option(
    "--include-comments",
    "Search in issue comments as well (default: false)",
  )
  .option(
    "--team <team:string>",
    "Team ID to boost in search results (optional)",
  )
  .action(
    async (
      { human, limit, includeArchived, includeComments, team },
      term: string,
    ) => {
      const json = !human
      try {
        const client = getGraphQLClient()

        const data = await client.request(issueSearchQuery, {
          term,
          first: limit ?? 50,
          includeArchived: includeArchived ?? false,
          includeComments: includeComments ?? false,
          teamId: team,
        })

        const issues = data.searchIssues.nodes
        const totalCount = data.searchIssues.totalCount
        const hasMore = data.searchIssues.pageInfo.hasNextPage

        if (json) {
          console.log(JSON.stringify(
            {
              issues,
              totalCount,
              hasMore,
              query: term,
              filters: {
                includeArchived: includeArchived ?? false,
                includeComments: includeComments ?? false,
                team,
              },
            },
            null,
            2,
          ))
          return
        }

        // Human-readable output
        if (issues.length === 0) {
          console.log(`No issues found for "${term}"`)
          return
        }

        const table = new Table()
          .header([
            bold("ID"),
            bold("Title"),
            bold("State"),
            bold("Priority"),
            bold("Assignee"),
            bold("Team"),
          ])
          .body(issues.map((issue) => [
            issue.identifier,
            issue.title.length > 50
              ? issue.title.substring(0, 47) + "..."
              : issue.title,
            issue.state.name,
            issue.priority === 0
              ? dim("None")
              : issue.priority === 1
              ? "🔴 Urgent"
              : issue.priority === 2
              ? "🟠 High"
              : issue.priority === 3
              ? "🟡 Medium"
              : "🔵 Low",
            issue.assignee?.displayName ?? dim("Unassigned"),
            issue.team.key,
          ]))

        table.border(true)
        table.render()

        console.log(
          `\n${dim(`Found ${totalCount} total result(s) for "${term}"`)}`,
        )
        if (hasMore) {
          console.log(
            yellow(
              `Showing first ${issues.length} results. Increase --limit to see more.`,
            ),
          )
        }
      } catch (error) {
        if (json) {
          console.log(JSON.stringify(
            {
              error: "Failed to search issues",
              message: error instanceof Error ? error.message : String(error),
            },
            null,
            2,
          ))
        } else {
          console.error("Failed to search issues:", error)
        }
        Deno.exit(1)
      }
    },
  )
