import { Command } from "@cliffy/command"
import { listProjectUpdates } from "../../utils/linear.ts"
import { formatRelativeTime } from "../../utils/display.ts"
import { bold } from "@std/fmt/colors"
import { header, muted } from "../../utils/styling.ts"
import { error as errorColor } from "../../utils/styling.ts"

interface ListOptions {
  limit?: number
  json?: boolean
  format?: string
}

export const updatesListCommand = new Command()
  .name("updates-list")
  .description("List project status updates")
  .arguments("<projectId:string>")
  .option("-l, --limit <limit:number>", "Max number of updates (default: 20)")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ListOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner ? new Spinner({ message: "Fetching updates..." }) : null
    spinner?.start()

    try {
      const updates = await listProjectUpdates(projectId, options.limit)
      spinner?.stop()

      if (useJson) {
        console.log(JSON.stringify({
          projectUpdates: updates.map((u) => ({
            id: u.id,
            health: u.health,
            bodyPreview: u.body.substring(0, 200),
            createdAt: u.createdAt,
            author: { id: u.user.id, name: u.user.displayName },
            url: u.url,
          })),
          count: updates.length,
        }, null, 2))
        return
      }

      if (updates.length === 0) {
        console.log(muted("No updates found"))
        return
      }

      console.log(header(`Project Updates (${updates.length})`))
      console.log()

      for (const update of updates) {
        const healthEmoji = { onTrack: "✅", atRisk: "⚠️ ", offTrack: "🔴" }[update.health] || ""
        const healthText = update.health.replace(/([A-Z])/g, " $1").trim()

        console.log(bold(`${healthEmoji} ${healthText} - ${formatRelativeTime(update.createdAt)} by ${update.user.displayName}`))

        const preview = update.body.split("\n")[0].substring(0, 150)
        console.log(preview + (update.body.length > 150 ? "..." : ""))
        console.log(muted(update.url))
        console.log()
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = err.message.includes("not found") ? `Project '${projectId}' not found` : `Failed to fetch updates: ${err.message}`
      if (useJson) {
        console.error(JSON.stringify({ success: false, error: { code: err.message.includes("not found") ? "NOT_FOUND" : "API_ERROR", message: errorMsg } }, null, 2))
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  })
