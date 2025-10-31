import { Command } from "@cliffy/command"
import { listCommand } from "./workflow-list.ts"
import { cacheCommand } from "./workflow-cache.ts"

export const workflowCommand = new Command()
  .name("workflow")
  .description("Manage workflow states (issue statuses)")
  .action(() => {
    console.log(
      "Use 'linear workflow list' to see workflow states or 'linear workflow cache' to refresh the cache.",
    )
  })
  .command("list", listCommand)
  .command("cache", cacheCommand)
