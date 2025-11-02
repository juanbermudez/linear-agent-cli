import { Command } from "@cliffy/command"
import { getIssueIdentifier } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

interface CreateOptions {
  body?: string
  bodyFromFile?: string
  human?: boolean
  format?: string
}

async function createIssueComment(issueId: string, body: string) {
  const client = getGraphQLClient()

  // First get the issue UUID (not the identifier)
  const issueQuery = `
    query GetIssueIdForComment($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const issueData = await client.request<any>(issueQuery, { id: issueId })

  if (!issueData.issue) {
    throw new Error(`Issue '${issueId}' not found`)
  }

  // Create the comment
  const mutation = `
    mutation CreateComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
        comment {
          id
          body
          createdAt
          user {
            id
            name
            displayName
          }
          issue {
            id
            identifier
            title
          }
        }
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const data = await client.request<any>(mutation, {
    issueId: issueData.issue.id,
    body: body.trim(),
  })

  if (!data.commentCreate.success || !data.commentCreate.comment) {
    throw new Error("Failed to create comment")
  }

  return data.commentCreate.comment
}

export const createCommand = new Command()
  .name("create")
  .description("Add a comment to an issue")
  .arguments("[issueId:string]")
  .option("-b, --body <body:string>", "Comment body text")
  .option(
    "-f, --body-from-file <file:string>",
    "Read comment body from file (use '-' for stdin)",
  )
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions, issueId?: string) => {
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

      // Get comment body
      let body: string
      if (options.bodyFromFile) {
        if (options.bodyFromFile === "-") {
          // Read from stdin
          const decoder = new TextDecoder()
          const buffer = new Uint8Array(4096)
          const chunks: Uint8Array[] = []
          while (true) {
            const n = await Deno.stdin.read(buffer)
            if (n === null) break
            chunks.push(buffer.slice(0, n))
          }
          const combined = new Uint8Array(
            chunks.reduce((acc, chunk) => acc + chunk.length, 0),
          )
          let offset = 0
          for (const chunk of chunks) {
            combined.set(chunk, offset)
            offset += chunk.length
          }
          body = decoder.decode(combined).trim()
        } else {
          // Read from file
          body = await Deno.readTextFile(options.bodyFromFile)
        }
      } else if (options.body) {
        body = options.body
      } else {
        const errorMsg = "Comment body required: use --body or --body-from-file"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "MISSING_REQUIRED_FIELD",
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

      if (!body.trim()) {
        const errorMsg = "Comment body cannot be empty"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "INVALID_VALUE",
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
        ? new Spinner({ message: `Adding comment to ${identifier}...` })
        : null
      spinner?.start()

      const comment = await createIssueComment(identifier, body)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "create",
              comment: {
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
                author: comment.user
                  ? {
                    id: comment.user.id,
                    name: comment.user.name,
                    displayName: comment.user.displayName,
                  }
                  : null,
                issue: {
                  id: comment.issue.id,
                  identifier: comment.issue.identifier,
                  title: comment.issue.title,
                },
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(
          successColor(
            `✓ Comment added to ${comment.issue.identifier}`,
          ),
        )
        console.log(`  ID: ${comment.id}`)
        console.log(
          `  Author: ${
            comment.user?.displayName || comment.user?.name || "Unknown"
          }`,
        )
      }
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
