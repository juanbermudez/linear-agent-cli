import { Command } from "@cliffy/command"
import {
  listInitiativeStatuses,
  listUsers,
  updateInitiative,
} from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface UpdateOptions {
  name?: string
  description?: string
  status?: string
  owner?: string
  targetDate?: string
  json?: boolean
  format?: string
}

export const updateCommand = new Command()
  .name("update")
  .description("Update an existing initiative")
  .arguments("<initiativeId:string>")
  .option("-n, --name <name:string>", "Initiative name")
  .option("-d, --description <description:string>", "Initiative description")
  .option("-s, --status <status:string>", "Status ID or name")
  .option("-o, --owner <owner:string>", "Owner user ID or display name")
  .option("-t, --target-date <date:string>", "Target date (YYYY-MM-DD)")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: UpdateOptions, initiativeId: string) => {
    const useJson = options.json || options.format === "json"

    if (
      !options.name && !options.description && !options.status &&
      !options.owner && options.targetDate === undefined
    ) {
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

    let statusId: string | undefined
    let ownerId: string | undefined

    // Validate date format if provided
    if (options.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)) {
      const errorMsg = "Invalid date format. Use YYYY-MM-DD"
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

    // Resolve status if provided
    if (options.status) {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          options.status,
        )
      ) {
        statusId = options.status
      } else {
        const statuses = await listInitiativeStatuses()
        const status = statuses.find((s) =>
          s.name.toLowerCase() === options.status!.toLowerCase()
        )
        if (status) {
          statusId = status.id
        } else {
          const errorMsg = `Status '${options.status}' not found`
          if (useJson) {
            console.error(
              JSON.stringify(
                {
                  success: false,
                  error: { code: "NOT_FOUND", message: errorMsg },
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
    }

    // Resolve owner if provided
    if (options.owner) {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          options.owner,
        )
      ) {
        ownerId = options.owner
      } else {
        const users = await listUsers()
        const user = users.find((u) =>
          u.displayName.toLowerCase() === options.owner!.toLowerCase()
        )
        if (user) {
          ownerId = user.id
        } else {
          const errorMsg = `User '${options.owner}' not found`
          if (useJson) {
            console.error(
              JSON.stringify(
                {
                  success: false,
                  error: { code: "NOT_FOUND", message: errorMsg },
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
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Updating initiative..." })
      : null
    spinner?.start()

    try {
      const initiative = await updateInitiative(initiativeId, {
        name: options.name,
        description: options.description,
        statusId,
        ownerId,
        targetDate: options.targetDate,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "update",
              initiative: {
                id: initiative.id,
                name: initiative.name,
                slugId: initiative.slugId,
                url: initiative.url,
                status: initiative.status
                  ? { id: initiative.status.id, name: initiative.status.name }
                  : null,
                owner: initiative.owner
                  ? {
                    id: initiative.owner.id,
                    name: initiative.owner.displayName,
                  }
                  : null,
                targetDate: initiative.targetDate,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Updated initiative ${initiative.slugId}`))
        console.log(initiative.url)
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = err.message.includes("not found")
        ? `Initiative '${initiativeId}' not found`
        : `Failed to update initiative: ${err.message}`
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
