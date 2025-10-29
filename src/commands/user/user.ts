import { Command } from "@cliffy/command"
import { listCommand } from "./user-list.ts"
import { searchCommand } from "./user-search.ts"

export const userCommand = new Command()
  .description("Manage and search users")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("search", searchCommand)
