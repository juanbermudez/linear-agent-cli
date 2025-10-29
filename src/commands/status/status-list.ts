import { Command } from "@cliffy/command"
import { getProjectStatuses } from "../../utils/linear.ts"
import { Table } from "@cliffy/table"
import { bold, dim } from "@std/fmt/colors"

export const listCommand = new Command()
  .name("list")
  .description("List all project statuses")
  .option("--json", "Output as JSON")
  .option("--refresh", "Bypass cache and fetch fresh data")
  .action(async ({ json, refresh }) => {
    try {
      const statuses = await getProjectStatuses({ refresh })

      if (json) {
        console.log(JSON.stringify({ projectStatuses: statuses }, null, 2))
        return
      }

      // Display as table
      const table = new Table()
        .header([
          bold("Type"),
          bold("Name"),
          bold("Position"),
          bold("ID"),
        ])
        .body(
          statuses.map((status) => [
            status.type,
            status.name,
            status.position.toString(),
            dim(status.id),
          ]),
        )

      table.border(true)
      table.render()

      console.log(`\n${dim(`Showing ${statuses.length} project statuses`)}`)
    } catch (error) {
      console.error("Failed to fetch project statuses:", error)
      Deno.exit(1)
    }
  })
