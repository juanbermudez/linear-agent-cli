import { Command } from "@cliffy/command"
import { getTeamKey, getWorkflowStates } from "../../utils/linear.ts"
import { Table } from "@cliffy/table"
import { bold, cyan, dim, green, red, yellow } from "@std/fmt/colors"

export const listCommand = new Command()
  .name("list")
  .description("List all workflow states for a team")
  .option("-t, --team <team:string>", "Team key (e.g., ENG)")
  .option("--json", "Output as JSON")
  .option("--refresh", "Bypass cache and fetch fresh data")
  .action(async ({ team, json, refresh }) => {
    const teamKey = team || getTeamKey()
    if (!teamKey) {
      console.error(
        "No team specified. Use --team flag or configure a default team.",
      )
      Deno.exit(1)
    }

    try {
      const states = await getWorkflowStates(teamKey, { refresh })

      if (json) {
        console.log(JSON.stringify({ workflowStates: states }, null, 2))
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
          states.map((state) => [
            formatType(state.type),
            state.name,
            state.position.toString(),
            dim(state.id),
          ]),
        )

      table.border(true)
      table.render()

      console.log(
        `\n${
          dim(`Showing ${states.length} workflow states for team ${teamKey}`)
        }`,
      )
    } catch (error) {
      console.error("Failed to fetch workflow states:", error)
      Deno.exit(1)
    }
  })

function formatType(type: string): string {
  switch (type) {
    case "triage":
      return cyan("● triage")
    case "backlog":
      return dim("● backlog")
    case "unstarted":
      return yellow("● unstarted")
    case "started":
      return green("● started")
    case "completed":
      return green("✓ completed")
    case "canceled":
      return red("✗ canceled")
    default:
      return `● ${type}`
  }
}
