import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { archiveInitiative } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface ArchiveOptions {
  force?: boolean
  json?: boolean
  format?: string
}

export const archiveCommand = new Command()
  .name("archive")
  .description("Archive an initiative")
  .arguments("<initiativeId:string>")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ArchiveOptions, initiativeId: string) => {
    const useJson = options.json || options.format === "json"

    if (!options.force && !useJson && Deno.stdout.isTerminal()) {
      const confirmed = await Confirm.prompt({
        message: `Archive initiative ${initiativeId}?`,
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
      ? new Spinner({ message: "Archiving initiative..." })
      : null
    spinner?.start()

    try {
      const initiative = await archiveInitiative(initiativeId)
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "archive",
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
        console.log(successColor(`✓ Archived initiative ${initiative.slugId}`))
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = err.message.includes("not found")
        ? `Initiative '${initiativeId}' not found`
        : `Failed to archive initiative: ${err.message}`
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
