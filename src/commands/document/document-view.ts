import { Command } from "@cliffy/command"
import { renderMarkdown } from "@littletof/charmd"
import { viewDocument } from "../../utils/linear.ts"
import { formatRelativeTime } from "../../utils/display.ts"
import { pipeToUserPager, shouldUsePager } from "../../utils/pager.ts"
import { bold, underline } from "@std/fmt/colors"
import { header, muted } from "../../utils/styling.ts"

interface ViewOptions {
  web?: boolean
  app?: boolean
  comments?: boolean
  pager?: boolean
  json?: boolean
  format?: string
}

export const viewCommand = new Command()
  .name("view")
  .description("View document details")
  .arguments("<docId:string>")
  .option("-w, --web", "Open in web browser")
  .option("-a, --app", "Open in Linear.app")
  .option("--no-comments", "Exclude comments from output")
  .option("--no-color", "Disable colored output")
  .option("--no-pager", "Disable automatic paging")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ViewOptions, docId: string) => {
    const useJson = options.json || options.format === "json"
    const showComments = options.comments !== false
    const usePager = options.pager !== false

    // TODO: Add web/app open support once we have the URL pattern
    if (options.web || options.app) {
      console.log("Opening document in browser/app not yet implemented")
      return
    }

    // Fetch document
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Fetching document ${docId}...` })
      : null

    spinner?.start()

    try {
      const document = await viewDocument(docId)

      spinner?.stop()

      // Handle JSON output
      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "view",
              document: {
                id: document.id,
                title: document.title,
                slugId: document.slugId,
                url: document.url,
                icon: document.icon,
                color: document.color,
                content: document.content,
                creator: document.creator
                  ? {
                    id: document.creator.id,
                    name: document.creator.displayName,
                  }
                  : null,
                updatedBy: document.updatedBy
                  ? {
                    id: document.updatedBy.id,
                    name: document.updatedBy.displayName,
                  }
                  : null,
                project: document.project
                  ? {
                    id: document.project.id,
                    name: document.project.name,
                    url: document.project.url,
                  }
                  : null,
                initiative: document.initiative
                  ? {
                    id: document.initiative.id,
                    name: document.initiative.name,
                    url: document.initiative.url,
                  }
                  : null,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt,
                comments: showComments
                  ? document.comments.nodes.map((comment) => ({
                    id: comment.id,
                    body: comment.body,
                    createdAt: comment.createdAt,
                    user: comment.user
                      ? {
                        id: comment.user.id,
                        name: comment.user.displayName,
                      }
                      : null,
                  }))
                  : undefined,
              },
            },
            null,
            2,
          ),
        )
        return
      }

      // Text output - render markdown
      const outputLines: string[] = []

      // Title with icon
      const titleLine = document.icon
        ? `${document.icon} ${document.title}`
        : document.title
      outputLines.push(bold(underline(titleLine)))
      outputLines.push("")

      // Metadata
      outputLines.push(
        muted(
          `Created by ${document.creator?.displayName || "Unknown"} ${
            formatRelativeTime(document.createdAt)
          }`,
        ),
      )
      if (
        document.updatedBy && document.creator &&
        document.updatedBy.id !== document.creator.id
      ) {
        outputLines.push(
          muted(
            `Updated by ${document.updatedBy.displayName} ${
              formatRelativeTime(document.updatedAt)
            }`,
          ),
        )
      } else {
        outputLines.push(
          muted(`Updated ${formatRelativeTime(document.updatedAt)}`),
        )
      }

      if (document.project) {
        outputLines.push(muted(`Project: ${document.project.name}`))
      }
      if (document.initiative) {
        outputLines.push(muted(`Initiative: ${document.initiative.name}`))
      }

      outputLines.push("")
      outputLines.push(document.url)
      outputLines.push("")

      // Content
      if (document.content && document.content.trim()) {
        if (Deno.stdout.isTerminal()) {
          let terminalWidth = 120
          try {
            const size = Deno.consoleSize()
            terminalWidth = size.columns
          } catch {
            // Use default
          }

          const renderedMarkdown = renderMarkdown(document.content, {
            lineWidth: terminalWidth,
          })
          outputLines.push(...renderedMarkdown.split("\n"))
        } else {
          outputLines.push(document.content)
        }
      } else {
        outputLines.push(muted("(No content)"))
      }

      // Comments
      if (showComments && document.comments.nodes.length > 0) {
        outputLines.push("")
        outputLines.push("")
        outputLines.push(header(`Comments (${document.comments.nodes.length})`))
        outputLines.push("")

        for (const comment of document.comments.nodes) {
          outputLines.push(
            bold(
              `${comment.user?.displayName || "Unknown"} ${
                muted(formatRelativeTime(comment.createdAt))
              }`,
            ),
          )

          if (Deno.stdout.isTerminal()) {
            let terminalWidth = 120
            try {
              const size = Deno.consoleSize()
              terminalWidth = size.columns
            } catch {
              // Use default
            }

            const renderedComment = renderMarkdown(comment.body, {
              lineWidth: terminalWidth,
            })
            outputLines.push(...renderedComment.split("\n"))
          } else {
            outputLines.push(comment.body)
          }

          outputLines.push("")
        }
      }

      // Output with paging if needed
      const output = outputLines.join("\n")
      if (usePager && shouldUsePager(outputLines, true)) {
        await pipeToUserPager(output)
      } else {
        console.log(output)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Document '${docId}' not found`
        : `Failed to fetch document: ${(err as Error).message}`

      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: (err as Error).message.includes("not found")
                  ? "NOT_FOUND"
                  : "API_ERROR",
                message: errorMsg,
                ...((err as Error).message.includes("not found") && {
                  resource: "document",
                  id: docId,
                }),
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(`Error: ${errorMsg}`)
      }
      Deno.exit(1)
    }
  })
