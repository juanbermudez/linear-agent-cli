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
}

async function listIssueAttachments(issueId: string) {
  const client = getGraphQLClient()

  const query = `
    query GetIssueAttachments($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        attachments {
          nodes {
            id
            title
            subtitle
            url
            createdAt
            creator {
              id
              name
              displayName
            }
            externalUserCreator {
              name
              displayName
            }
            sourceType
            metadata
          }
        }
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const data = await client.request<any>(query, { id: issueId })
  return data
}

export const listCommand = new Command()
  .name("list")
  .description("List attachments on an issue")
  .arguments("[issueId:string]")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
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
        ? new Spinner({ message: `Fetching attachments for ${identifier}...` })
        : null
      spinner?.start()

      const data = await listIssueAttachments(identifier)

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

      const attachments = data.issue.attachments.nodes

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
              attachments: attachments.map((a: {
                id: string
                title: string
                subtitle: string | null
                url: string
                createdAt: string
                creator: {
                  id: string
                  name: string
                  displayName: string
                } | null
                externalUserCreator: {
                  name: string
                  displayName: string
                } | null
                sourceType: string | null
                metadata: Record<string, unknown>
              }) => ({
                id: a.id,
                title: a.title,
                subtitle: a.subtitle,
                url: a.url,
                createdAt: a.createdAt,
                creator: a.creator
                  ? {
                    id: a.creator.id,
                    name: a.creator.name,
                    displayName: a.creator.displayName,
                  }
                  : a.externalUserCreator
                  ? {
                    name: a.externalUserCreator.name,
                    displayName: a.externalUserCreator.displayName,
                  }
                  : null,
                sourceType: a.sourceType,
                metadata: a.metadata,
              })),
              count: attachments.length,
            },
            null,
            2,
          ),
        )
        return
      }

      // Human-readable output
      if (attachments.length === 0) {
        console.log(
          muted(`No attachments found on issue ${data.issue.identifier}`),
        )
        return
      }

      console.log(
        successColor(
          `\n${attachments.length} attachments on ${data.issue.identifier}: ${data.issue.title}\n`,
        ),
      )

      const rows = attachments.map((a: {
        title: string
        subtitle: string | null
        url: string
        createdAt: string
        creator: {
          name: string
          displayName: string
        } | null
        externalUserCreator: {
          name: string
          displayName: string
        } | null
        sourceType: string | null
      }) => {
        const creator = a.creator
          ? a.creator.displayName || a.creator.name
          : a.externalUserCreator
          ? a.externalUserCreator.displayName || a.externalUserCreator.name
          : "Unknown"

        const createdAt = formatDistanceToNow(new Date(a.createdAt), {
          addSuffix: true,
        })

        const urlPreview = a.url.length > 50
          ? a.url.substring(0, 47) + "..."
          : a.url

        const sourceType = a.sourceType || "-"

        return [
          a.title,
          sourceType,
          urlPreview,
          creator,
          createdAt,
        ]
      })

      const table = new Table()
        .header(["Title", "Source", "URL", "Creator", "Created"])
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
