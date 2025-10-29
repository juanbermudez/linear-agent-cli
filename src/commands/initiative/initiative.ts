import { Command } from "@cliffy/command"
import { listCommand } from "./initiative-list.ts"
import { viewCommand } from "./initiative-view.ts"
import { createCommand } from "./initiative-create.ts"
import { updateCommand } from "./initiative-update.ts"
import { archiveCommand } from "./initiative-archive.ts"
import { restoreCommand } from "./initiative-restore.ts"
import { projectAddCommand } from "./initiative-project-add.ts"
import { projectRemoveCommand } from "./initiative-project-remove.ts"
import { updateCreateCommand } from "./initiative-update-create.ts"
import { updatesListCommand } from "./initiative-updates-list.ts"

export const initiativeCommand = new Command()
  .description("Manage Linear initiatives")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("view", viewCommand)
  .command("create", createCommand)
  .command("update", updateCommand)
  .command("archive", archiveCommand)
  .command("restore", restoreCommand)
  .command("unarchive", restoreCommand) // Alias
  .command("project-add", projectAddCommand)
  .command("project-remove", projectRemoveCommand)
  .command("update-create", updateCreateCommand)
  .command("updates-list", updatesListCommand)
