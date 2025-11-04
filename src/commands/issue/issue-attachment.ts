import { Command } from "@cliffy/command"
import { listCommand } from "./issue-attachment-list.ts"
import { createCommand } from "./issue-attachment-create.ts"
import { deleteCommand } from "./issue-attachment-delete.ts"

export const attachmentCommand = new Command()
  .description("Manage issue attachments")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("create", createCommand)
  .command("delete", deleteCommand)
