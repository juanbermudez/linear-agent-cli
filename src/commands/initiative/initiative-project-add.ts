import { Command } from "@cliffy/command"
import { addProjectToInitiative } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface AddOptions {
  json?: boolean
  format?: string
}

export const projectAddCommand = new Command()
  .name("project-add")
  .description("Add a project to an initiative")
  .arguments("<initiativeId:string> <projectId:string>")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(
    async (options: AddOptions, initiativeId: string, projectId: string) => {
      const useJson = options.json || options.format === "json"

      const { Spinner } = await import("@std/cli/unstable-spinner")
      const showSpinner = !useJson && Deno.stdout.isTerminal()
      const spinner = showSpinner
        ? new Spinner({ message: "Adding project to initiative..." })
        : null
      spinner?.start()

      try {
        const initiative = await addProjectToInitiative(
          initiativeId,
          projectId,
        )
        spinner?.stop()

        if (useJson) {
          console.log(
            JSON.stringify({
              success: true,
              operation: "add-project",
              initiative: {
                id: initiative.id,
                name: initiative.name,
                slugId: initiative.slugId,
              },
              projectId,
            }, null, 2),
          )
        } else {
          console.log(
            successColor(
              `✓ Added project ${projectId} to initiative ${initiative.slugId}`,
            ),
          )
        }
      } catch (err) {
        spinner?.stop()
        const errorMsg = err.message.includes("not found")
          ? `Initiative or project not found`
          : `Failed to add project: ${err.message}`
        if (useJson) {
          console.error(
            JSON.stringify({
              success: false,
              error: {
                code: err.message.includes("not found")
                  ? "NOT_FOUND"
                  : "API_ERROR",
                message: errorMsg,
              },
            }, null, 2),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }
    },
  )
