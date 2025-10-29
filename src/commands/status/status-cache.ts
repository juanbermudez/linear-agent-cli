import { Command } from "@cliffy/command"
import { getProjectStatuses } from "../../utils/linear.ts"
import { green } from "@std/fmt/colors"

export const cacheCommand = new Command()
  .name("cache")
  .description("Cache project statuses")
  .action(async () => {
    try {
      console.log(`Fetching project statuses...`)
      const statuses = await getProjectStatuses({ refresh: true })

      console.log(green(`✓ Cached ${statuses.length} project statuses`))
    } catch (error) {
      console.error("Failed to cache project statuses:", error)
      Deno.exit(1)
    }
  })
