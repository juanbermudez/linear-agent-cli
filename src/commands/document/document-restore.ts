import { Command } from "@cliffy/command"
import { unarchiveDocument } from "../../utils/linear.ts"
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
  .description("Restore a Linear document from trash")
  .arguments("<docId:string>")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: RestoreOptions, docId: string) => {
    const useJson = options.json || options.format === "json"

    // Show spinner only in non-JSON mode
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Restoring document ${docId}...` })
      : null

    spinner?.start()

    try {
      const document = await unarchiveDocument(docId)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "restore",
              document: {
                id: document.id,
                title: document.title,
                url: document.url,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Restored document: ${document.title}`))
        console.log(document.url)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = err.message.includes("not found")
        ? `Document '${docId}' not found`
        : `Failed to restore document: ${err.message}`

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
