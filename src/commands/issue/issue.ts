import { Command } from "@cliffy/command"
import { createCommand } from "./issue-create.ts"
import { deleteCommand } from "./issue-delete.ts"
import { describeCommand } from "./issue-describe.ts"
import { idCommand } from "./issue-id.ts"
import { listCommand } from "./issue-list.ts"
import { pullRequestCommand } from "./issue-pull-request.ts"
import { relateCommand } from "./issue-relate.ts"
import { relationsCommand } from "./issue-relations.ts"
import { startCommand } from "./issue-start.ts"
import { titleCommand } from "./issue-title.ts"
import { unrelateCommand } from "./issue-unrelate.ts"
import { updateCommand } from "./issue-update.ts"
import { urlCommand } from "./issue-url.ts"
import { viewCommand } from "./issue-view.ts"

const baseCommand = new Command()
  .description("Manage Linear issues")
  .action(function () {
    this.showHelp()
  })

// deno-lint-ignore no-explicit-any
const commandWithSubcommands = baseCommand
  .command("id", idCommand)
  .command("list", listCommand)
  .command("title", titleCommand)
  .command("start", startCommand)
  .command("view", viewCommand)
  .command("url", urlCommand)
  .command("describe", describeCommand) as any

// deno-lint-ignore no-explicit-any
export const issueCommand = commandWithSubcommands
  .command("pull-request", pullRequestCommand)
  .command("delete", deleteCommand)
  .command("create", createCommand)
  .command("update", updateCommand)
  .command("relate", relateCommand)
  .command("unrelate", unrelateCommand)
  .command("relations", relationsCommand) as any
