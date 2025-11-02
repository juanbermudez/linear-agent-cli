import { Command } from "@cliffy/command"
import { removeProjectFromInitiative } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface RemoveOptions {
  human?: boolean
  format?: string
}

export const projectRemoveCommand = new Command()
  .name("project-remove")
  .description("Remove a project from an initiative")
  .arguments("<initiativeId:string> <projectId:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(
    async (
      options: RemoveOptions,
      initiativeId: string,
      projectId: string,
    ) => {
      const useJson = !options.human && options.format !== "text"

      const { Spinner } = await import("@std/cli/unstable-spinner")
      const showSpinner = !useJson && Deno.stdout.isTerminal()
      const spinner = showSpinner
        ? new Spinner({ message: "Removing project from initiative..." })
        : null
      spinner?.start()

      try {
        await removeProjectFromInitiative(initiativeId, projectId)
        spinner?.stop()

        if (useJson) {
          console.log(
            JSON.stringify(
              {
                success: true,
                operation: "remove-project",
                initiativeId,
                projectId,
              },
              null,
              2,
            ),
          )
        } else {
          console.log(
            successColor(
              `✓ Removed project ${projectId} from initiative ${initiativeId}`,
            ),
          )
        }
      } catch (err) {
        spinner?.stop()
        const errorMsg = (err as Error).message.includes("not found")
          ? `Initiative or project not found`
          : `Failed to remove project: ${(err as Error).message}`
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
    },
  )
