import { Command } from "@cliffy/command"
import { CompletionsCommand } from "@cliffy/command/completions"
import denoConfig from "../deno.json" with { type: "json" }
import { issueCommand } from "./commands/issue/issue.ts"
import { teamCommand } from "./commands/team/team.ts"
import { projectCommand } from "./commands/project/project.ts"
import { documentCommand } from "./commands/document/document.ts"
import { initiativeCommand } from "./commands/initiative/initiative.ts"
import { labelCommand } from "./commands/label/label.ts"
import { workflowCommand } from "./commands/workflow/workflow.ts"
import { statusCommand } from "./commands/status/status.ts"
import { configCommand } from "./commands/config.ts"
import { whoamiCommand } from "./commands/whoami.ts"
import { userCommand } from "./commands/user/user.ts"
import { usageCommand } from "./commands/usage.ts"
import { updateCommand } from "./commands/update.ts"

// Import config setup
import "./config.ts"

const mainCommand = new Command()
  .name("linear")
  .version(denoConfig.version)
  .description("Handy linear commands from the command line")
  .action(() => {
    console.log("Use --help to see available commands")
  })

await mainCommand
  .command("issue", issueCommand)
  .alias("i")
  .command("team", teamCommand)
  .alias("t")
  .command("project", projectCommand)
  .alias("p")
  .command("document", documentCommand)
  .command("initiative", initiativeCommand)
  .command("label", labelCommand)
  .alias("l")
  .command("workflow", workflowCommand)
  .alias("w")
  .command("status", statusCommand)
  .command("user", userCommand)
  .alias("u")
  .command("whoami", whoamiCommand)
  .command("usage", usageCommand)
  .command("update", updateCommand)
  .command("completions", new CompletionsCommand())
  .command("config", configCommand)
  .command(
    "help",
    new Command().description("Show help information").action(() => {
      mainCommand.showHelp()
    }),
  )
  .parse(Deno.args)
