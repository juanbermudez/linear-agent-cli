import { Command } from "@cliffy/command"
import { listCommand } from "./project-list.ts"
import { viewCommand } from "./project-view.ts"
import { createCommand } from "./project-create.ts"
import { updateCommand } from "./project-update.ts"
import { deleteCommand } from "./project-delete.ts"
import { restoreCommand } from "./project-restore.ts"
import { searchCommand } from "./project-search.ts"
import { milestoneCommand } from "./milestone/milestone.ts"
import { updateCreateCommand } from "./project-update-create.ts"
import { updatesListCommand } from "./project-updates-list.ts"

export const projectCommand = new Command()
  .description("Manage Linear projects")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("search", searchCommand)
  .command("view", viewCommand)
  .command("create", createCommand)
  .command("update", updateCommand)
  .command("delete", deleteCommand)
  .command("trash", deleteCommand) // Alias
  .command("restore", restoreCommand)
  .command("unarchive", restoreCommand) // Alias
  .command("milestone", milestoneCommand)
  .command("update-create", updateCreateCommand)
  .command("updates-list", updatesListCommand)
