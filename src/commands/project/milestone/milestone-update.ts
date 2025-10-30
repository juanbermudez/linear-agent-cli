import { Command } from "@cliffy/command"
import { updateMilestone } from "../../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../../utils/styling.ts"

interface UpdateOptions {
  name?: string
  description?: string
  targetDate?: string
  status?: string
  json?: boolean
  format?: string
}

export const updateCommand = new Command()
  .name("update")
  .description("Update a project milestone")
  .arguments("<milestoneId:string>")
  .option("-n, --name <name:string>", "New milestone name")
  .option("-d, --description <description:string>", "New description")
  .option("--target-date <date:string>", "New target date (YYYY-MM-DD)")
  .option(
    "-s, --status <status:string>",
    "New status (todo, in_progress, done, canceled)",
  )
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: UpdateOptions, milestoneId: string) => {
    const useJson = options.json || options.format === "json"

    // Validate at least one field is provided
    if (
      !options.name && !options.description && !options.targetDate &&
      !options.status
    ) {
      const errorMsg =
        "No fields provided to update. Use --name, --description, --target-date, or --status"
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

    // Validate date format if provided
    if (options.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)) {
      const errorMsg =
        `Invalid target date '${options.targetDate}'. Use YYYY-MM-DD format`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_VALUE",
                message: errorMsg,
                field: "targetDate",
                value: options.targetDate,
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

    // Validate status if provided
    const validStatuses = ["todo", "in_progress", "done", "canceled"]
    if (options.status && !validStatuses.includes(options.status)) {
      const errorMsg = `Invalid status '${options.status}'. Must be one of: ${
        validStatuses.join(", ")
      }`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_VALUE",
                message: errorMsg,
                field: "status",
                value: options.status,
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

    // Build input
    const input: {
      name?: string
      description?: string
      targetDate?: string
      status?: string
    } = {}

    if (options.name) input.name = options.name
    if (options.description) input.description = options.description
    if (options.targetDate) input.targetDate = options.targetDate
    if (options.status) input.status = options.status

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Updating milestone ${milestoneId}...` })
      : null

    spinner?.start()

    try {
      const milestone = await updateMilestone(milestoneId, input)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "update",
              milestone: {
                id: milestone.id,
                name: milestone.name,
                description: milestone.description,
                targetDate: milestone.targetDate,
                status: milestone.status,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Updated milestone: ${milestone.name}`))
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = err.message.includes("not found")
        ? `Milestone '${milestoneId}' not found`
        : `Failed to update milestone: ${err.message}`

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
