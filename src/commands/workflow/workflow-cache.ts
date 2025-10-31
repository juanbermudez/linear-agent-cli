import { Command } from "@cliffy/command"
import { getTeamKey, getWorkflowStates } from "../../utils/linear.ts"
import { green } from "@std/fmt/colors"

export const cacheCommand = new Command()
  .name("cache")
  .description("Cache workflow states for a team")
  .option("-t, --team <team:string>", "Team key (e.g., ENG)")
  .action(async ({ team }) => {
    const teamKey = team || getTeamKey()
    if (!teamKey) {
      console.error(
        "No team specified. Use --team flag or configure a default team.",
      )
      Deno.exit(1)
    }

    try {
      console.log(`Fetching workflow states for team ${teamKey}...`)
      const states = await getWorkflowStates(teamKey, { refresh: true })

      console.log(
        green(`✓ Cached ${states.length} workflow states for team ${teamKey}`),
      )
    } catch (error) {
      console.error("Failed to cache workflow states:", error)
      Deno.exit(1)
    }
  })
