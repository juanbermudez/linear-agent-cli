import { Command } from "@cliffy/command"
import { getTimeAgo, padDisplay, truncateText } from "../../utils/display.ts"
import {
  getCurrentProjectFromIssue,
  getProjectIdByName,
  listDocuments,
  lookupUserId,
} from "../../utils/linear.ts"
import { pipeToUserPager, shouldUsePager } from "../../utils/pager.ts"
import { header, muted } from "../../utils/styling.ts"

interface ListOptions {
  project?: string
  currentProject?: boolean
  initiative?: string
  creator?: string
  includeArchived?: boolean
  limit?: number
  web?: boolean
  app?: boolean
  json?: boolean
  format?: string
  pager?: boolean
}

export const listCommand = new Command()
  .name("list")
  .description("List documents")
  .option("-p, --project <project:string>", "Filter by project name or ID")
  .option(
    "--current-project",
    "Show documents for current issue's project (from VCS context)",
  )
  .option(
    "-i, --initiative <initiative:string>",
    "Filter by initiative name or ID",
  )
  .option(
    "-c, --creator <creator:string>",
    "Filter by creator (username or 'self')",
  )
  .option("--include-archived", "Include trashed documents")
  .option("-l, --limit <limit:number>", "Max number of documents (default: 50)")
  .option("-w, --web", "Open documents view in browser")
  .option("-a, --app", "Open documents view in Linear.app")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .option("--plain", "Disable colored output")
  .option("--no-pager", "Disable automatic paging")
  .action(async (options: ListOptions) => {
    const useJson = options.json || options.format === "json"
    const usePager = options.pager !== false

    // TODO: Add web/app open support once we have the URL pattern
    if (options.web || options.app) {
      console.log("Opening documents in browser/app not yet implemented")
      return
    }

    // Resolve project ID if provided
    let projectId: string | undefined
    let projectName: string | undefined

    if (options.currentProject) {
      const currentProject = await getCurrentProjectFromIssue()
      if (!currentProject) {
        const errorMsg = "Could not detect current project from issue context"
        const details = "Make sure you're on a branch with an issue ID"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "VCS_CONTEXT_NOT_FOUND",
                  message: errorMsg,
                  details,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(`Error: ${errorMsg}`)
          console.error(details)
        }
        Deno.exit(1)
      }
      projectId = currentProject.id
      projectName = currentProject.name

      if (!useJson) {
        console.log(`\nShowing documents for project: ${currentProject.name}\n`)
      }
    } else if (options.project) {
      try {
        projectId = await getProjectIdByName(options.project)
      } catch (_err) {
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: `Project '${options.project}' not found`,
                  resource: "project",
                  id: options.project,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(`Error: Project '${options.project}' not found`)
        }
        Deno.exit(1)
      }
    }

    // Resolve creator ID if provided
    let creatorId: string | undefined
    if (options.creator) {
      try {
        creatorId = await lookupUserId(options.creator)
      } catch (_err) {
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: `Creator '${options.creator}' not found`,
                  resource: "user",
                  id: options.creator,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(`Error: Creator '${options.creator}' not found`)
        }
        Deno.exit(1)
      }
    }

    // TODO: Add initiative ID resolution when initiative commands are implemented

    // Fetch documents
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Fetching documents..." })
      : null

    spinner?.start()

    try {
      const documents = await listDocuments({
        projectId,
        creatorId,
        limit: options.limit,
        includeArchived: options.includeArchived,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              documents: documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                slugId: doc.slugId,
                url: doc.url,
                icon: doc.icon,
                project: doc.project
                  ? {
                    id: doc.project.id,
                    name: doc.project.name,
                  }
                  : null,
                creator: doc.creator
                  ? {
                    id: doc.creator.id,
                    name: doc.creator.displayName,
                  }
                  : null,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
              })),
              count: documents.length,
              filters: {
                ...(options.project && { project: options.project }),
                ...(options.currentProject && projectName &&
                  { project: projectName, source: "vcs-context" }),
                ...(options.creator && { creator: options.creator }),
                ...(options.includeArchived && { includeArchived: true }),
              },
            },
            null,
            2,
          ),
        )
        return
      }

      // Text output - render table
      if (documents.length === 0) {
        console.log(muted("No documents found"))
        return
      }

      const outputLines: string[] = []

      // Calculate column widths
      const ICON_WIDTH = 2
      const PROJECT_WIDTH = 20
      const CREATOR_WIDTH = 15
      const UPDATED_WIDTH = 12
      const SPACE = 4

      let terminalWidth = 120
      try {
        const size = Deno.consoleSize()
        terminalWidth = size.columns
      } catch {
        // Use default
      }

      const titleWidth = Math.max(
        20,
        terminalWidth - ICON_WIDTH - PROJECT_WIDTH - CREATOR_WIDTH -
          UPDATED_WIDTH - SPACE * 5,
      )

      // Build header
      const headerRow = [
        padDisplay("", ICON_WIDTH),
        padDisplay("TITLE", titleWidth),
        padDisplay("PROJECT", PROJECT_WIDTH),
        padDisplay("CREATOR", CREATOR_WIDTH),
        padDisplay("UPDATED", UPDATED_WIDTH),
      ].join("  ")

      outputLines.push(header(headerRow))

      // Build data rows
      for (const doc of documents) {
        const icon = doc.icon || "📄"
        const title = truncateText(doc.title, titleWidth)
        const project = doc.project
          ? truncateText(doc.project.name, PROJECT_WIDTH)
          : muted("-")
        const creator = doc.creator
          ? truncateText(doc.creator.displayName, CREATOR_WIDTH)
          : muted("-")
        const updated = getTimeAgo(new Date(doc.updatedAt))

        const row = [
          padDisplay(icon, ICON_WIDTH),
          padDisplay(title, titleWidth),
          padDisplay(project, PROJECT_WIDTH),
          padDisplay(creator, CREATOR_WIDTH),
          padDisplay(updated, UPDATED_WIDTH),
        ].join("  ")

        outputLines.push(row)
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

      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "API_ERROR",
                message: (err as Error).message,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(
          `Error: Failed to fetch documents: ${(err as Error).message}`,
        )
      }
      Deno.exit(1)
    }
  })
