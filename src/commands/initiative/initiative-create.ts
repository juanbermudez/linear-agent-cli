import { Command } from "@cliffy/command"
import { Input, Select } from "@cliffy/prompt"
import {
  createInitiative,
  listInitiativeStatuses,
  listUsers,
} from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface CreateOptions {
  name?: string
  description?: string
  content?: string
  status?: string
  owner?: string
  targetDate?: string
  json?: boolean
  format?: string
  noInteractive?: boolean
}

export const createCommand = new Command()
  .name("create")
  .description("Create a new initiative")
  .option("-n, --name <name:string>", "Initiative name")
  .option("-d, --description <description:string>", "Initiative description")
  .option(
    "-c, --content <content:string>",
    "Initiative content/body (markdown)",
  )
  .option("-s, --status <status:string>", "Status ID or name")
  .option("-o, --owner <owner:string>", "Owner user ID or display name")
  .option("-t, --target-date <date:string>", "Target date (YYYY-MM-DD)")
  .option("--no-interactive", "Disable interactive mode")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.name && !useJson && !options.noInteractive &&
      Deno.stdout.isTerminal()

    let name: string
    let description: string | undefined
    let content: string | undefined
    let statusId: string | undefined
    let ownerId: string | undefined
    let targetDate: string | undefined

    if (interactive) {
      name = await Input.prompt({
        message: "Initiative name",
        validate: (value) => value.trim() !== "" || "Name is required",
      })

      description = await Input.prompt({
        message: "Description (optional)",
        default: "",
      })
      if (description === "") description = undefined

      // Status selection
      const { Spinner } = await import("@std/cli/unstable-spinner")
      const statusSpinner = new Spinner({ message: "Loading statuses..." })
      statusSpinner.start()
      const statuses = await listInitiativeStatuses()
      statusSpinner.stop()

      if (statuses.length > 0) {
        const statusOptions = statuses.map((s) => ({
          name: `${s.name} (${s.type})`,
          value: s.id,
        }))
        statusOptions.unshift({ name: "None", value: "" })

        const selectedStatus = await Select.prompt({
          message: "Initiative status (optional)",
          options: statusOptions,
          search: true,
        })
        statusId = selectedStatus || undefined
      }

      // Owner selection
      const ownerSpinner = new Spinner({ message: "Loading users..." })
      ownerSpinner.start()
      const users = await listUsers()
      ownerSpinner.stop()

      const ownerOptions = users.map((u) => ({
        name: u.displayName,
        value: u.id,
      }))
      ownerOptions.unshift({ name: "None", value: "" })

      const selectedOwner = await Select.prompt({
        message: "Initiative owner (optional)",
        options: ownerOptions,
        search: true,
      })
      ownerId = selectedOwner || undefined

      // Target date
      targetDate = await Input.prompt({
        message: "Target date (YYYY-MM-DD, optional)",
        default: "",
        validate: (value) => {
          if (!value) return true
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return "Invalid date format. Use YYYY-MM-DD"
          }
          return true
        },
      })
      if (targetDate === "") targetDate = undefined
    } else {
      if (!options.name) {
        const errorMsg = "Name is required. Use --name or run without flags"
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

      name = options.name
      description = options.description
      content = options.content
      targetDate = options.targetDate

      // Validate date format if provided
      if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
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
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            .test(options.status)
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
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            .test(options.owner)
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
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Creating initiative..." })
      : null
    spinner?.start()

    try {
      const initiative = await createInitiative({
        name,
        description,
        content,
        statusId,
        ownerId,
        targetDate,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "create",
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
        console.log(successColor(`✓ Created initiative ${initiative.slugId}`))
        console.log(initiative.url)
      }
    } catch (err) {
      spinner?.stop()
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: { code: "API_ERROR", message: (err as Error).message },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(errorColor(`Error: ${(err as Error).message}`))
      }
      Deno.exit(1)
    }
  })
