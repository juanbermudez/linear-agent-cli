import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { deleteProject } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface DeleteOptions {
  force?: boolean
  json?: boolean
  format?: string
}

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete (trash) a Linear project")
  .arguments("<projectId:string>")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: DeleteOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"

    // Prompt for confirmation unless --force
    if (!options.force && !useJson && Deno.stdout.isTerminal()) {
      const confirmed = await Confirm.prompt({
        message: `Delete project '${projectId}'?`,
        default: false,
      })

      if (!confirmed) {
        console.log("Cancelled")
        return
      }
    }

    // Show spinner only in non-JSON mode
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Deleting project ${projectId}...` })
      : null

    spinner?.start()

    try {
      const success = await deleteProject(projectId)

      spinner?.stop()

      if (success) {
        if (useJson) {
          console.log(
            JSON.stringify(
              {
                success: true,
                operation: "delete",
                project: {
                  id: projectId,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.log(successColor(`✓ Deleted project: ${projectId}`))
        }
      } else {
        throw new Error("Delete operation failed")
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = err.message.includes("not found")
        ? `Project '${projectId}' not found`
        : `Failed to delete project: ${err.message}`

      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: err.message.includes("not found")
                  ? "NOT_FOUND"
                  : "API_ERROR",
                message: errorMsg,
                ...(err.message.includes("not found") && {
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
