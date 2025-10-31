import { Command } from "@cliffy/command"
import { createCommand } from "./milestone-create.ts"
import { listCommand } from "./milestone-list.ts"
import { updateCommand } from "./milestone-update.ts"
import { deleteCommand } from "./milestone-delete.ts"

export const milestoneCommand = new Command()
  .name("milestone")
  .description("Manage project milestones")
  .action(function () {
    this.showHelp()
  })
  .command("create", createCommand)
  .command("list", listCommand)
  .command("update", updateCommand)
  .command("delete", deleteCommand)
