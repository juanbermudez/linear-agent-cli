import { Command } from "@cliffy/command"
import { listMilestones } from "../../../utils/linear.ts"
import { padDisplay, truncateText } from "../../../utils/display.ts"
import { header, muted } from "../../../utils/styling.ts"
import { error as errorColor } from "../../../utils/styling.ts"

interface ListOptions {
  json?: boolean
  format?: string
}

export const listCommand = new Command()
  .name("list")
  .description("List project milestones")
  .arguments("<projectId:string>")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ListOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner ? new Spinner({ message: "Fetching milestones..." }) : null

    spinner?.start()

    try {
      const milestones = await listMilestones(projectId)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify({
            milestones: milestones.map((m) => ({
              id: m.id,
              name: m.name,
              description: m.description,
              targetDate: m.targetDate,
              status: m.status,
              progress: m.progress,
              sortOrder: m.sortOrder,
            })),
            count: milestones.length,
          }, null, 2),
        )
        return
      }

      if (milestones.length === 0) {
        console.log(muted("No milestones found"))
        return
      }

      // Display as table
      const NAME_WIDTH = 40
      const STATUS_WIDTH = 15
      const TARGET_WIDTH = 12
      const PROGRESS_WIDTH = 10

      const headerRow = [
        padDisplay("NAME", NAME_WIDTH),
        padDisplay("STATUS", STATUS_WIDTH),
        padDisplay("TARGET", TARGET_WIDTH),
        padDisplay("PROGRESS", PROGRESS_WIDTH),
      ].join("  ")

      console.log(header(headerRow))

      for (const milestone of milestones) {
        const name = truncateText(milestone.name, NAME_WIDTH)
        const status = milestone.status.replace("_", " ")
        const target = milestone.targetDate || "-"
        const progress = `${Math.round(milestone.progress * 100)}%`

        const row = [
          padDisplay(name, NAME_WIDTH),
          padDisplay(status, STATUS_WIDTH),
          padDisplay(target, TARGET_WIDTH),
          padDisplay(progress, PROGRESS_WIDTH),
        ].join("  ")

        console.log(row)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = err.message.includes("not found")
        ? `Project '${projectId}' not found`
        : `Failed to fetch milestones: ${err.message}`

      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: {
              code: err.message.includes("not found") ? "NOT_FOUND" : "API_ERROR",
              message: errorMsg,
              ...(err.message.includes("not found") && {
                resource: "project",
                id: projectId,
              }),
            },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  })
