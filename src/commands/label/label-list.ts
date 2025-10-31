import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { getTeamIdByKey, listLabelsForTeam } from "../../utils/linear.ts"
import { muted } from "../../utils/styling.ts"
import { error as errorColor } from "../../utils/styling.ts"
import { bgRgb24 } from "@std/fmt/colors"

interface ListOptions {
  team?: string
  json?: boolean
  format?: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : { r: 128, g: 128, b: 128 }
}

export const listCommand = new Command()
  .name("list")
  .description("List labels")
  .option("-t, --team <team:string>", "Filter by team ID or key")
  .option("--plain", "Disable colored output")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ListOptions) => {
    const useJson = options.json || options.format === "json"

    let teamId: string | undefined

    // Resolve team if provided
    if (options.team) {
      try {
        teamId = await getTeamIdByKey(options.team)
        if (!teamId) {
          throw new Error(`Team '${options.team}' not found`)
        }
      } catch (err) {
        const error = err as Error
        const errorMsg = error.message || `Team '${options.team}' not found`
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

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Fetching labels..." })
      : null
    spinner?.start()

    try {
      const labels = await listLabelsForTeam(teamId)
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              labels: labels.map((l) => ({
                id: l.id,
                name: l.name,
                description: l.description,
                color: l.color,
                team: l.team
                  ? { id: l.team.id, key: l.team.key, name: l.team.name }
                  : null,
              })),
              count: labels.length,
            },
            null,
            2,
          ),
        )
        return
      }

      if (labels.length === 0) {
        console.log(muted("No labels found"))
        return
      }

      const rows = labels.map((l) => {
        const team = l.team ? `${l.team.name} (${l.team.key})` : "Organization"
        const description = l.description || "-"

        // Color indicator
        const colorIndicator = l.color
          ? (() => {
            const rgb = hexToRgb(l.color)
            return bgRgb24("   ", rgb)
          })()
          : "   "

        return [
          l.name,
          colorIndicator,
          description.substring(0, 40) + (description.length > 40 ? "..." : ""),
          team,
        ]
      })

      const table = new Table()
        .header(["Name", "Color", "Description", "Team"])
        .body(rows)
        .border()

      table.render()
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
