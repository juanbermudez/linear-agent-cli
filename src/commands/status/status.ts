import { Command } from "@cliffy/command"
import { listCommand } from "./status-list.ts"
import { cacheCommand } from "./status-cache.ts"

export const statusCommand = new Command()
  .name("status")
  .description("Manage project statuses")
  .action(() => {
    console.log(
      "Use 'linear status list' to see project statuses or 'linear status cache' to refresh the cache.",
    )
  })
  .command("list", listCommand)
  .command("cache", cacheCommand)
