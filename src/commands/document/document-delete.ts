import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { deleteDocument } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface DeleteOptions {
  force?: boolean
  human?: boolean
  format?: string
}

export const deleteCommand = new Command()
  .name("delete")
  .description("Trash a Linear document")
  .arguments("<docId:string>")
  .option("-f, --force", "Skip confirmation prompt")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: DeleteOptions, docId: string) => {
    const useJson = !options.human && options.format !== "text"

    // Prompt for confirmation unless --force
    if (!options.force && !useJson && Deno.stdout.isTerminal()) {
      const confirmed = await Confirm.prompt({
        message: `Delete document '${docId}'?`,
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
      ? new Spinner({ message: `Deleting document ${docId}...` })
      : null

    spinner?.start()

    try {
      const success = await deleteDocument(docId)

      spinner?.stop()

      if (success) {
        if (useJson) {
          console.log(
            JSON.stringify(
              {
                success: true,
                operation: "delete",
                document: {
                  id: docId,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.log(successColor(`✓ Deleted document: ${docId}`))
        }
      } else {
        throw new Error("Delete operation failed")
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Document '${docId}' not found`
        : `Failed to delete document: ${(err as Error).message}`

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
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  })
