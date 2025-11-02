import { Command } from "@cliffy/command"
import { createCommand } from "./issue-comment-create.ts"
import { listCommand } from "./issue-comment-list.ts"

export const commentCommand = new Command()
  .description("Manage issue comments")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("create", createCommand)
