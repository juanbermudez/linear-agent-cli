import { Command } from "@cliffy/command"
import { createCommand } from "./document-create.ts"
import { editCommand } from "./document-edit.ts"
import { deleteCommand } from "./document-delete.ts"
import { restoreCommand } from "./document-restore.ts"
import { listCommand } from "./document-list.ts"
import { searchCommand } from "./document-search.ts"
import { viewCommand } from "./document-view.ts"

export const documentCommand = new Command()
  .name("document")
  .alias("doc")
  .description("Manage Linear documents")
  .action(function () {
    this.showHelp()
  })
  .command("list", listCommand)
  .command("search", searchCommand)
  .command("view", viewCommand)
  .command("create", createCommand)
  .command("edit", editCommand)
  .command("update", editCommand) // Alias
  .command("delete", deleteCommand)
  .command("trash", deleteCommand) // Alias
  .command("restore", restoreCommand)
  .command("unarchive", restoreCommand) // Alias
