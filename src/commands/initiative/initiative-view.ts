import { Command } from "@cliffy/command"
import { viewInitiative } from "../../utils/linear.ts"
import { formatDate, formatRelativeTime } from "../../utils/display.ts"
import { bold } from "@std/fmt/colors"
import { header, muted } from "../../utils/styling.ts"
import { error as errorColor } from "../../utils/styling.ts"

interface ViewOptions {
  human?: boolean
  format?: string
}

export const viewCommand = new Command()
  .name("view")
  .description("View initiative details")
  .arguments("<initiativeId:string>")
  .option("--no-color", "Disable colored output")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ViewOptions, initiativeId: string) => {
    const useJson = !options.human && options.format !== "text"

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Fetching initiative..." })
      : null
    spinner?.start()

    try {
      const initiative = await viewInitiative(initiativeId)
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              initiative: {
                id: initiative.id,
                name: initiative.name,
                slugId: initiative.slugId,
                url: initiative.url,
                description: initiative.description,
                status: initiative.status,
                owner: initiative.owner
                  ? {
                    id: initiative.owner.id,
                    name: initiative.owner.displayName,
                  }
                  : null,
                targetDate: initiative.targetDate,
                createdAt: initiative.createdAt,
                updatedAt: initiative.updatedAt,
                projects: initiative.projects.nodes.map((p) => ({
                  id: p.id,
                  name: p.name,
                  slugId: p.slugId,
                  url: p.url,
                })),
              },
            },
            null,
            2,
          ),
        )
        return
      }

      // Text output
      console.log(header(initiative.name))
      console.log()

      console.log(bold("ID: ") + initiative.slugId)
      console.log(bold("URL: ") + initiative.url)

      if (initiative.description) {
        console.log()
        console.log(bold("Description"))
        console.log(initiative.description)
      }

      console.log()
      console.log(
        bold("Status: ") +
          (initiative.status || "None"),
      )
      console.log(
        bold("Owner: ") +
          (initiative.owner ? initiative.owner.displayName : "Unassigned"),
      )
      console.log(
        bold("Target Date: ") +
          (initiative.targetDate ? formatDate(initiative.targetDate) : "None"),
      )

      console.log()
      console.log(
        bold("Created: ") + formatRelativeTime(initiative.createdAt),
      )
      console.log(
        bold("Updated: ") + formatRelativeTime(initiative.updatedAt),
      )

      if (initiative.projects.nodes.length > 0) {
        console.log()
        console.log(bold(`Projects (${initiative.projects.nodes.length})`))
        for (const project of initiative.projects.nodes) {
          console.log(`  • ${project.name} (${project.slugId})`)
          console.log(`    ${muted(project.url)}`)
        }
      }
    } catch (err) {
      spinner?.stop()
      const errorMsg = (err as Error).message.includes("not found")
        ? `Initiative '${initiativeId}' not found`
        : `Failed to fetch initiative: ${(err as Error).message}`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: (err as Error).message.includes("not found")
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
