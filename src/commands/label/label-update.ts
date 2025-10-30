import { Command } from "@cliffy/command"
import { updateLabel } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface UpdateOptions {
  name?: string
  description?: string
  color?: string
  json?: boolean
  format?: string
}

export const updateCommand = new Command()
  .name("update")
  .description("Update an existing label")
  .arguments("<labelId:string>")
  .option("-n, --name <name:string>", "Label name")
  .option("-d, --description <description:string>", "Label description")
  .option("-c, --color <color:string>", "Label color (hex code)")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: UpdateOptions, labelId: string) => {
    const useJson = options.json || options.format === "json"

    if (!options.name && !options.description && !options.color) {
      const errorMsg = "At least one field must be specified to update"
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "MISSING_REQUIRED_FIELD",
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

    // Validate color format if provided
    if (options.color && !/^#[0-9a-f]{6}$/i.test(options.color)) {
      const errorMsg = "Invalid hex color. Use format: #rrggbb"
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: { code: "INVALID_VALUE", message: errorMsg },
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

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Updating label..." })
      : null
    spinner?.start()

    try {
      const label = await updateLabel(labelId, {
        name: options.name,
        description: options.description,
        color: options.color,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "update",
              label: {
                id: label.id,
                name: label.name,
                description: label.description,
                color: label.color,
                team: label.team
                  ? {
                    id: label.team.id,
                    key: label.team.key,
                    name: label.team.name,
                  }
                  : null,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Updated label '${label.name}'`))
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = err.message.includes("not found")
        ? `Label '${labelId}' not found`
        : `Failed to update label: ${err.message}`
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
