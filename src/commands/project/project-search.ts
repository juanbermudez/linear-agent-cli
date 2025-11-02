import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { bold, dim, yellow } from "@std/fmt/colors"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

const projectSearchQuery = gql(`
  query SearchProjectsCommand(
    $term: String!
    $first: Int
    $includeArchived: Boolean
    $includeComments: Boolean
  ) {
    searchProjects(
      term: $term
      first: $first
      includeArchived: $includeArchived
      includeComments: $includeComments
    ) {
      nodes {
        id
        name
        description
        slugId
        state
        priority
        startDate
        targetDate
        lead {
          name
          displayName
        }
        teams {
          nodes {
            key
            name
          }
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
  .description("Search projects by keyword (searches name and description)")
  .arguments("<term:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option(
    "--limit <limit:number>",
    "Maximum number of results to return (default: 50)",
  )
  .option(
    "--include-archived",
    "Include archived projects in search results (default: false)",
  )
  .option(
    "--include-comments",
    "Search in project comments as well (default: false)",
  )
  .action(
    async (
      { human, limit, includeArchived, includeComments },
      term: string,
    ) => {
      const json = !human
      try {
        const client = getGraphQLClient()

        const data = await client.request(projectSearchQuery, {
          term,
          first: limit ?? 50,
          includeArchived: includeArchived ?? false,
          includeComments: includeComments ?? false,
        })

        const projects = data.searchProjects.nodes
        const totalCount = data.searchProjects.totalCount
        const hasMore = data.searchProjects.pageInfo.hasNextPage

        if (json) {
          console.log(JSON.stringify(
            {
              projects,
              totalCount,
              hasMore,
              query: term,
              filters: {
                includeArchived: includeArchived ?? false,
                includeComments: includeComments ?? false,
              },
            },
            null,
            2,
          ))
          return
        }

        // Human-readable output
        if (projects.length === 0) {
          console.log(`No projects found for "${term}"`)
          return
        }

        const table = new Table()
          .header([
            bold("Name"),
            bold("State"),
            bold("Priority"),
            bold("Lead"),
            bold("Teams"),
            bold("Slug"),
          ])
          .body(projects.map((project) => [
            project.name.length > 40
              ? project.name.substring(0, 37) + "..."
              : project.name,
            project.state,
            project.priority === 0
              ? dim("None")
              : project.priority === 1
              ? "🔴 Urgent"
              : project.priority === 2
              ? "🟠 High"
              : project.priority === 3
              ? "🟡 Medium"
              : "🔵 Low",
            project.lead?.displayName ?? dim("No lead"),
            project.teams.nodes.map((t) => t.key).join(", "),
            dim(project.slugId),
          ]))

        table.border(true)
        table.render()

        console.log(
          `\n${dim(`Found ${totalCount} total result(s) for "${term}"`)}`,
        )
        if (hasMore) {
          console.log(
            yellow(
              `Showing first ${projects.length} results. Increase --limit to see more.`,
            ),
          )
        }
      } catch (error) {
        if (json) {
          console.log(JSON.stringify(
            {
              error: "Failed to search projects",
              message: error instanceof Error ? error.message : String(error),
            },
            null,
            2,
          ))
        } else {
          console.error("Failed to search projects:", error)
        }
        Deno.exit(1)
      }
    },
  )
