import { Command } from "@cliffy/command"
import { listCommand } from "./issue-attachment-list.ts"

export const attachmentCommand = new Command()
  .description("Manage issue attachments")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
