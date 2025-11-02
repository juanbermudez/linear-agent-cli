import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { getIssueIdentifier } from "../../utils/linear.ts"
import {
  error as errorColor,
  muted,
  success as successColor,
} from "../../utils/styling.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { formatDistanceToNow } from "date-fns"

interface ListOptions {
  human?: boolean
  format?: string
  limit?: number
}

async function listIssueComments(issueId: string, limit = 50) {
  const client = getGraphQLClient()

  const query = `
    query GetIssueComments($id: String!, $first: Int!) {
      issue(id: $id) {
        id
        identifier
        title
        comments(first: $first, orderBy: createdAt) {
          nodes {
            id
            body
            createdAt
            editedAt
            user {
              id
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
  `

  // deno-lint-ignore no-explicit-any
  const data = await client.request<any>(query, { id: issueId, first: limit })
  return data
}

export const listCommand = new Command()
  .name("list")
  .description("List comments on an issue")
  .arguments("[issueId:string]")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .option(
    "-l, --limit <limit:number>",
    "Maximum number of comments to fetch",
    { default: 50 },
  )
  .action(async (options: ListOptions, issueId?: string) => {
    const useJson = !options.human && options.format !== "text"

    try {
      // Get issue identifier from argument or VCS
      const identifier = await getIssueIdentifier(issueId)
      if (!identifier) {
        const errorMsg =
          "No issue identifier provided and none found in branch/commit"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "MISSING_IDENTIFIER",
                  message: errorMsg,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      const { Spinner } = await import("@std/cli/unstable-spinner")
      const showSpinner = !useJson && Deno.stdout.isTerminal()
      const spinner = showSpinner
        ? new Spinner({ message: `Fetching comments for ${identifier}...` })
        : null
      spinner?.start()

      const data = await listIssueComments(identifier, options.limit || 50)

      spinner?.stop()

      if (!data.issue) {
        const errorMsg = `Issue '${identifier}' not found`
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: { code: "NOT_FOUND", message: errorMsg },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      const comments = data.issue.comments.nodes

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              issue: {
                id: data.issue.id,
                identifier: data.issue.identifier,
                title: data.issue.title,
              },
              comments: comments.map((c: {
                id: string
                body: string
                createdAt: string
                editedAt: string | null
                user: {
                  id: string
                  name: string
                  displayName: string
                } | null
                externalUser: { name: string; displayName: string } | null
                parent: { id: string } | null
              }) => ({
                id: c.id,
                body: c.body,
                createdAt: c.createdAt,
                editedAt: c.editedAt,
                author: c.user
                  ? {
                    id: c.user.id,
                    name: c.user.name,
                    displayName: c.user.displayName,
                  }
                  : c.externalUser
                  ? {
                    name: c.externalUser.name,
                    displayName: c.externalUser.displayName,
                  }
                  : null,
                isReply: !!c.parent?.id,
                parentId: c.parent?.id || null,
              })),
              count: comments.length,
            },
            null,
            2,
          ),
        )
        return
      }

      // Human-readable output
      if (comments.length === 0) {
        console.log(
          muted(`No comments found on issue ${data.issue.identifier}`),
        )
        return
      }

      console.log(
        successColor(
          `\n${comments.length} comments on ${data.issue.identifier}: ${data.issue.title}\n`,
        ),
      )

      const rows = comments.map((c: {
        body: string
        createdAt: string
        user: {
          name: string
          displayName: string
        } | null
        externalUser: { name: string; displayName: string } | null
        parent: { id: string } | null
      }) => {
        const author = c.user
          ? c.user.displayName || c.user.name
          : c.externalUser
          ? c.externalUser.displayName || c.externalUser.name
          : "Unknown"

        const createdAt = formatDistanceToNow(new Date(c.createdAt), {
          addSuffix: true,
        })

        const bodyPreview = c.body.length > 60
          ? c.body.substring(0, 57) + "..."
          : c.body

        const isReply = c.parent ? "↳" : ""

        return [
          isReply,
          author,
          bodyPreview.replace(/\n/g, " "),
          createdAt,
        ]
      })

      const table = new Table()
        .header(["", "Author", "Comment", "Posted"])
        .body(rows)
        .border()

      table.render()
    } catch (err) {
      const error = err as Error
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: { code: "API_ERROR", message: error.message },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(errorColor(`Error: ${error.message}`))
      }
      Deno.exit(1)
    }
  })
