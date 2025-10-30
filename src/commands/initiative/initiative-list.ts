import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { listInitiatives, listUsers } from "../../utils/linear.ts"
import { formatRelativeTime, truncate } from "../../utils/display.ts"
import { muted } from "../../utils/styling.ts"
import { error as errorColor } from "../../utils/styling.ts"

interface ListOptions {
  status?: string
  owner?: string
  limit?: number
  json?: boolean
  format?: string
}

export const listCommand = new Command()
  .name("list")
  .description("List initiatives")
  .option("-s, --status <status:string>", "Filter by status ID or name")
  .option("-o, --owner <owner:string>", "Filter by owner ID or display name")
  .option("-l, --limit <limit:number>", "Max number of initiatives (default: 50)")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ListOptions) => {
    const useJson = options.json || options.format === "json"

    let statusId: string | undefined
    let ownerId: string | undefined

    // Resolve status if provided (not implemented in this version - would need listInitiativeStatuses)
    if (options.status) {
      statusId = options.status
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
              JSON.stringify({
                success: false,
                error: { code: "NOT_FOUND", message: errorMsg },
              }, null, 2),
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
      ? new Spinner({ message: "Fetching initiatives..." })
      : null
    spinner?.start()

    try {
      const initiatives = await listInitiatives({
        statusId,
        ownerId,
        limit: options.limit,
      })

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify({
            initiatives: initiatives.map((i) => ({
              id: i.id,
              name: i.name,
              slugId: i.slugId,
              url: i.url,
              status: i.status
                ? { id: i.status.id, name: i.status.name, type: i.status.type }
                : null,
              owner: i.owner
                ? { id: i.owner.id, name: i.owner.displayName }
                : null,
              targetDate: i.targetDate,
              createdAt: i.createdAt,
              updatedAt: i.updatedAt,
            })),
            count: initiatives.length,
          }, null, 2),
        )
        return
      }

      if (initiatives.length === 0) {
        console.log(muted("No initiatives found"))
        return
      }

      const rows = initiatives.map((i) => {
        const status = i.status ? i.status.name : "-"
        const owner = i.owner ? i.owner.displayName : "-"
        const targetDate = i.targetDate
          ? formatRelativeTime(i.targetDate)
          : "-"

        return [
          i.slugId,
          i.name,
          status,
          owner,
          targetDate,
        ]
      })

      const terminalWidth = Deno.consoleSize().columns
      const fixedWidth = 10 + 20 + 15 + 20 // ID + Status + Owner + Target
      const nameWidth = Math.max(20, terminalWidth - fixedWidth - 10)

      const table = new Table()
        .header(["ID", "Name", "Status", "Owner", "Target"])
        .body(
          rows.map(([id, name, status, owner, target]) => {
            const truncatedName = truncate(name, nameWidth)
            return [id, truncatedName, status, owner, target]
          }),
        )
        .border()

      table.render()
    } catch (err) {
      spinner?.stop()
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: { code: "API_ERROR", message: err.message },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${err.message}`))
      }
      Deno.exit(1)
    }
  })
