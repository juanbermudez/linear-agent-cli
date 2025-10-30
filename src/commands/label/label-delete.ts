import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { deleteLabel } from "../../utils/linear.ts"
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
  .description("Delete (archive) a label")
  .arguments("<labelId:string>")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: DeleteOptions, labelId: string) => {
    const useJson = options.json || options.format === "json"

    if (!options.force && !useJson && Deno.stdout.isTerminal()) {
      const confirmed = await Confirm.prompt({
        message: `Delete label ${labelId}?`,
        default: false,
      })

      if (!confirmed) {
        if (useJson) {
          console.log(
            JSON.stringify(
              {
                success: false,
                error: { code: "CANCELLED", message: "Operation cancelled" },
              },
              null,
              2,
            ),
          )
        } else {
          console.log("Cancelled")
        }
        Deno.exit(0)
      }
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Deleting label..." })
      : null
    spinner?.start()

    try {
      await deleteLabel(labelId)
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "delete",
              labelId,
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Deleted label ${labelId}`))
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = (err as Error).message.includes("not found")
        ? `Label '${labelId}' not found`
        : `Failed to delete label: ${(err as Error).message}`
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
  })
