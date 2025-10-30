import { Command } from "@cliffy/command"
import { Input } from "@cliffy/prompt"
import { createMilestone } from "../../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../../utils/styling.ts"

interface CreateOptions {
  name?: string
  description?: string
  targetDate?: string
  json?: boolean
  format?: string
  noInteractive?: boolean
}

export const createCommand = new Command()
  .name("create")
  .description("Create a project milestone")
  .arguments("<projectId:string>")
  .option("-n, --name <name:string>", "Milestone name")
  .option("-d, --description <description:string>", "Description")
  .option("--target-date <date:string>", "Target date (YYYY-MM-DD)")
  .option("--no-interactive", "Disable interactive mode")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.name && !useJson && !options.noInteractive &&
      Deno.stdout.isTerminal()

    let name: string
    let description: string | undefined
    let targetDate: string | undefined

    if (interactive) {
      name = await Input.prompt({
        message: "Milestone name",
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return "Milestone name is required"
          }
          return true
        },
      })

      const descInput = await Input.prompt({
        message: "Description [Enter to skip]",
        default: "",
      })
      description = descInput.trim() || undefined

      const dateInput = await Input.prompt({
        message: "Target date (YYYY-MM-DD) [Enter to skip]",
        default: "",
        validate: (value) => {
          if (!value.trim()) return true
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return "Invalid date format. Use YYYY-MM-DD"
          }
          return true
        },
      })
      targetDate = dateInput.trim() || undefined
    } else {
      if (!options.name) {
        const errorMsg =
          "Milestone name is required. Use --name or run without flags for interactive mode"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "MISSING_REQUIRED_FIELD",
                  message: errorMsg,
                  field: "name",
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

      name = options.name
      description = options.description
      targetDate = options.targetDate

      // Validate date format if provided
      if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        const errorMsg =
          `Invalid target date '${targetDate}'. Use YYYY-MM-DD format`
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "INVALID_VALUE",
                  message: errorMsg,
                  field: "targetDate",
                  value: targetDate,
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
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Creating milestone..." })
      : null

    spinner?.start()

    try {
      const milestone = await createMilestone({
        projectId,
        name,
        description,
        targetDate,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "create",
              milestone: {
                id: milestone.id,
                name: milestone.name,
                description: milestone.description,
                targetDate: milestone.targetDate,
                status: milestone.status,
                progress: milestone.progress,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Created milestone: ${milestone.name}`))
        if (milestone.targetDate) {
          console.log(`Target date: ${milestone.targetDate}`)
        }
      }
    } catch (err) {
      spinner?.stop()

      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "API_ERROR",
                message: (err as Error).message,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(
          errorColor(`Error: Failed to create milestone: ${(err as Error).message}`),
        )
      }
      Deno.exit(1)
    }
  })
