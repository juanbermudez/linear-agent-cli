import { Command } from "@cliffy/command"
import { unarchiveInitiative } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface RestoreOptions {
  human?: boolean
  format?: string
}

export const restoreCommand = new Command()
  .name("restore")
  .description("Restore an archived initiative")
  .arguments("<initiativeId:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: RestoreOptions, initiativeId: string) => {
    const useJson = !options.human && options.format !== "text"

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Restoring initiative..." })
      : null
    spinner?.start()

    try {
      const initiative = await unarchiveInitiative(initiativeId)
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "restore",
              initiative: {
                id: initiative.id,
                name: initiative.name,
                slugId: initiative.slugId,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(
          successColor(`✓ Restored initiative ${initiative.slugId}`),
        )
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = (err as Error).message.includes("not found")
        ? `Initiative '${initiativeId}' not found`
        : `Failed to restore initiative: ${(err as Error).message}`
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
