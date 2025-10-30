import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { deleteMilestone } from "../../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../../utils/styling.ts"

interface DeleteOptions {
  force?: boolean
  json?: boolean
  format?: string
}

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete a project milestone")
  .arguments("<milestoneId:string>")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: DeleteOptions, milestoneId: string) => {
    const useJson = options.json || options.format === "json"

    // Prompt for confirmation unless --force
    if (!options.force && !useJson && Deno.stdout.isTerminal()) {
      const confirmed = await Confirm.prompt({
        message: `Delete milestone '${milestoneId}'?`,
        default: false,
      })

      if (!confirmed) {
        console.log("Cancelled")
        return
      }
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Deleting milestone ${milestoneId}...` })
      : null

    spinner?.start()

    try {
      const success = await deleteMilestone(milestoneId)

      spinner?.stop()

      if (success) {
        if (useJson) {
          console.log(
            JSON.stringify(
              {
                success: true,
                operation: "delete",
                milestone: {
                  id: milestoneId,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.log(successColor(`✓ Deleted milestone: ${milestoneId}`))
        }
      } else {
        throw new Error("Delete operation failed")
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Milestone '${milestoneId}' not found`
        : `Failed to delete milestone: ${(err as Error).message}`

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
                  resource: "milestone",
                  id: milestoneId,
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
