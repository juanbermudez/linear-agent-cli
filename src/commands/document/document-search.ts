import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { bold, dim, yellow } from "@std/fmt/colors"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

const documentSearchQuery = gql(/* GraphQL */ `
  query SearchDocuments(
    $term: String!
    $first: Int
    $includeArchived: Boolean
    $includeComments: Boolean
  ) {
    searchDocuments(
      term: $term
      first: $first
      includeArchived: $includeArchived
      includeComments: $includeComments
    ) {
      nodes {
        id
        title
        slugId
        content
        project {
          name
          slugId
        }
        creator {
          name
          displayName
        }
        updatedBy {
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
  .description("Search documents by keyword (searches title and content)")
  .arguments("<term:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option(
    "--limit <limit:number>",
    "Maximum number of results to return (default: 50)",
  )
  .option(
    "--include-archived",
    "Include archived documents in search results (default: false)",
  )
  .option(
    "--include-comments",
    "Search in document comments as well (default: false)",
  )
  .action(
    async (
      { human, limit, includeArchived, includeComments },
      term: string,
    ) => {
      const json = !human
      try {
        const client = getGraphQLClient()

        const data = await client.request(documentSearchQuery, {
          term,
          first: limit ?? 50,
          includeArchived: includeArchived ?? false,
          includeComments: includeComments ?? false,
        })

        const documents = data.searchDocuments.nodes
        const totalCount = data.searchDocuments.totalCount
        const hasMore = data.searchDocuments.pageInfo.hasNextPage

        if (json) {
          console.log(JSON.stringify(
            {
              documents,
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
        if (documents.length === 0) {
          console.log(`No documents found for "${term}"`)
          return
        }

        const table = new Table()
          .header([
            bold("Title"),
            bold("Project"),
            bold("Creator"),
            bold("Last Updated"),
            bold("Slug"),
          ])
          .body(documents.map((doc) => [
            doc.title.length > 40
              ? doc.title.substring(0, 37) + "..."
              : doc.title,
            doc.project?.name ?? dim("No project"),
            doc.creator?.displayName ?? dim("Unknown"),
            doc.updatedBy?.displayName ??
              doc.creator?.displayName ??
              dim("Unknown"),
            dim(doc.slugId),
          ]))

        table.border(true)
        table.render()

        console.log(
          `\n${dim(`Found ${totalCount} total result(s) for "${term}"`)}`,
        )
        if (hasMore) {
          console.log(
            yellow(
              `Showing first ${documents.length} results. Increase --limit to see more.`,
            ),
          )
        }
      } catch (error) {
        if (json) {
          console.log(JSON.stringify(
            {
              error: "Failed to search documents",
              message: error instanceof Error ? error.message : String(error),
            },
            null,
            2,
          ))
        } else {
          console.error("Failed to search documents:", error)
        }
        Deno.exit(1)
      }
    },
  )
