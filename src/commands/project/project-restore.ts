import { Command } from "@cliffy/command"
import { unarchiveProject } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface RestoreOptions {
  json?: boolean
  format?: string
}

export const restoreCommand = new Command()
  .name("restore")
  .description("Restore a trashed Linear project")
  .arguments("<projectId:string>")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: RestoreOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"

    // Show spinner only in non-JSON mode
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Restoring project ${projectId}...` })
      : null

    spinner?.start()

    try {
      const project = await unarchiveProject(projectId)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "restore",
              project: {
                id: project.id,
                name: project.name,
                url: project.url,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Restored project: ${project.name}`))
        console.log(project.url)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Project '${projectId}' not found`
        : `Failed to restore project: ${(err as Error).message}`

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
                  resource: "project",
                  id: projectId,
                }),
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
  })
