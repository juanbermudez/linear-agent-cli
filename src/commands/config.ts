import { Command } from "@cliffy/command"
import { Checkbox, Confirm, Input, prompt, Secret, Select } from "@cliffy/prompt"
import { join } from "@std/path"
import { gql } from "../__codegen__/gql.ts"
import { GraphQLClient } from "graphql-request"
import { setCommand } from "./config/config-set.ts"
import { getCommand } from "./config/config-get.ts"
import { listCommand } from "./config/config-list.ts"

const configQuery = gql(`
  query Config {
    viewer {
      organization {
        urlKey
      }
    }
    teams {
      nodes {
        id
        key
        name
      }
    }
  }
`)

const setupCommand = new Command()
  .name("setup")
  .description("Interactively generate .linear.toml configuration")
  .alias("init")
  .action(async () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ██      ██ ███    ██ ███████  █████  ██████          ║
║     ██      ██ ████   ██ ██      ██   ██ ██   ██         ║
║     ██      ██ ██ ██  ██ █████   ███████ ██████          ║
║     ██      ██ ██  ██ ██ ██      ██   ██ ██   ██         ║
║     ███████ ██ ██   ████ ███████ ██   ██ ██   ██         ║
║                                                           ║
║            CLI for AI Agents - Interactive Setup         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`)

    console.log("Let's configure your Linear CLI! 🚀\n")

    // Step 1: Get API Key
    let apiKey = Deno.env.get("LINEAR_API_KEY")

    if (!apiKey) {
      console.log("📝 First, we need your Linear API key.")
      console.log("   Get one at: https://linear.app/settings/api\n")

      apiKey = await Secret.prompt({
        message: "Enter your Linear API key:",
        hint: "Starts with 'lin_api_'",
        validate: (value) => {
          if (!value || value.length === 0) {
            return "API key is required"
          }
          if (!value.startsWith("lin_api_")) {
            return "API key should start with 'lin_api_'"
          }
          return true
        },
      })

      const saveToEnv = await Confirm.prompt({
        message: "Save API key to environment variables?",
        default: true,
        hint: "Will add to your shell profile (~/.zshrc or ~/.bashrc)",
      })

      if (saveToEnv) {
        // Detect shell
        const shell = Deno.env.get("SHELL") || ""
        let shellConfig = ""

        if (shell.includes("zsh")) {
          shellConfig = join(Deno.env.get("HOME") || "~", ".zshrc")
        } else if (shell.includes("bash")) {
          shellConfig = join(Deno.env.get("HOME") || "~", ".bashrc")
        } else if (shell.includes("fish")) {
          shellConfig = join(Deno.env.get("HOME") || "~", ".config/fish/config.fish")
        }

        if (shellConfig) {
          try {
            const exportLine = shell.includes("fish")
              ? `\n# Linear CLI API Key\nset -gx LINEAR_API_KEY "${apiKey}"\n`
              : `\n# Linear CLI API Key\nexport LINEAR_API_KEY="${apiKey}"\n`

            await Deno.writeTextFile(shellConfig, exportLine, { append: true })
            console.log(`✓ Added API key to ${shellConfig}`)
            console.log("  Run 'source ${shellConfig}' or restart your terminal\n")
          } catch (error) {
            console.log(`⚠ Could not write to ${shellConfig}: ${error}`)
            console.log(`  You can manually add: export LINEAR_API_KEY="${apiKey}"\n`)
          }
        }
      }
    } else {
      console.log("✓ Using existing LINEAR_API_KEY from environment\n")
    }

    // Step 2: Fetch workspace and teams
    console.log("🔍 Fetching your Linear workspace and teams...\n")

    const client = new GraphQLClient("https://api.linear.app/graphql", {
      headers: {
        Authorization: apiKey,
      },
    })

    let result
    try {
      result = await client.request(configQuery)
    } catch (error) {
      console.error("❌ Failed to connect to Linear API")
      console.error("   Please check your API key and try again")
      console.error(`   Error: ${error}`)
      Deno.exit(1)
    }

    const workspace = result.viewer.organization.urlKey
    const teams = result.teams.nodes

    // Sort teams alphabetically by name (case insensitive)
    teams.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )

    console.log(`✓ Connected to workspace: ${workspace}`)
    console.log(`✓ Found ${teams.length} team(s)\n`)

    // Step 3: Select teams
    interface Team {
      id: string
      key: string
      name: string
    }

    const teamSelectionMode = await Select.prompt({
      message: "How would you like to select teams?",
      options: [
        { name: "Select one team (default)", value: "single" },
        { name: "Select multiple teams", value: "multiple" },
        { name: "Use all teams", value: "all" },
      ],
    })

    let selectedTeamKeys: string[] = []

    if (teamSelectionMode === "all") {
      selectedTeamKeys = teams.map((t) => t.key)
      console.log(`✓ Selected all ${teams.length} teams\n`)
    } else if (teamSelectionMode === "single") {
      const selectedTeamId = await Select.prompt({
        message: "Select your default team:",
        search: true,
        searchLabel: "Search teams",
        options: teams.map((team) => ({
          name: `${team.name} (${team.key})`,
          value: team.id,
        })),
      })

      const team = teams.find((t) => t.id === selectedTeamId)
      if (team) {
        selectedTeamKeys = [team.key]
        console.log(`✓ Selected team: ${team.name} (${team.key})\n`)
      }
    } else {
      const selectedTeamIds = await Checkbox.prompt({
        message: "Select teams (use space to select, enter to confirm):",
        search: true,
        searchLabel: "Search teams",
        options: teams.map((team) => ({
          name: `${team.name} (${team.key})`,
          value: team.id,
        })),
        minOptions: 1,
        hint: "Select at least one team",
      })

      selectedTeamKeys = teams
        .filter((t) => selectedTeamIds.includes(t.id))
        .map((t) => t.key)

      console.log(`✓ Selected ${selectedTeamKeys.length} team(s)\n`)
    }

    // Step 4: Additional preferences
    console.log("⚙️  Configure preferences:\n")

    const cacheEnabled = await Confirm.prompt({
      message: "Enable 24-hour caching for workflows, statuses, and labels?",
      default: true,
      hint: "Improves performance significantly",
    })

    const autoBranch = await Confirm.prompt({
      message: "Auto-create git branches when starting issues?",
      default: true,
      hint: "Creates branch like 'TEAM-123-issue-title'",
    })

    const issueSort = await Select.prompt({
      message: "Default issue sort order:",
      options: [
        { name: "Manual (Linear's default order)", value: "manual" },
        { name: "Priority (high to low)", value: "priority" },
      ],
      default: "manual",
    })

    // Step 5: Determine file path
    let filePath: string
    let gitRoot: string | null = null

    try {
      const gitRootProcess = await new Deno.Command("git", {
        args: ["rev-parse", "--show-toplevel"],
        stdout: "piped",
        stderr: "piped",
      }).output()

      if (gitRootProcess.success) {
        gitRoot = new TextDecoder().decode(gitRootProcess.stdout).trim()
        const configDir = join(gitRoot, ".config")

        try {
          await Deno.stat(configDir)
          filePath = join(configDir, "linear.toml")
        } catch {
          filePath = join(gitRoot, ".linear.toml")
        }
      } else {
        filePath = "./.linear.toml"
      }
    } catch {
      filePath = "./.linear.toml"
    }

    // Step 6: Generate and save configuration
    const primaryTeam = selectedTeamKeys[0]

    let tomlContent = `# Linear CLI Configuration
# Generated by: linear config setup
# Repository: https://github.com/juanbermudez/linear-agent-cli

[auth]
# Your Linear API key
# Can also be set via LINEAR_API_KEY environment variable
token = "${apiKey}"

[defaults]
# Your Linear workspace identifier
workspace = "${workspace}"

# Default team (${selectedTeamKeys.length > 1 ? `primary of ${selectedTeamKeys.length} teams` : "single team"})
team_id = "${primaryTeam}"
`

    if (selectedTeamKeys.length > 1) {
      tomlContent += `\n# All configured teams\nteams = [${selectedTeamKeys.map(k => `"${k}"`).join(", ")}]\n`
    }

    tomlContent += `
# Default issue sort order
issue_sort = "${issueSort}"

[vcs]
# Automatically create git branches when starting issues
autoBranch = ${autoBranch}

[cache]
# Enable 24-hour caching for better performance
enabled = ${cacheEnabled}

[interactive]
# Enable interactive prompts
enabled = true

[output]
# Default output format: "text" or "json"
format = "text"
`

    await Deno.writeTextFile(filePath, tomlContent)

    // Success message
    console.log("\n")
    console.log("╔═══════════════════════════════════════════════════════════╗")
    console.log("║                    🎉 Setup Complete!                     ║")
    console.log("╚═══════════════════════════════════════════════════════════╝")
    console.log("\n")
    console.log(`✓ Configuration saved to: ${filePath}`)
    console.log(`✓ Workspace: ${workspace}`)
    console.log(`✓ Team(s): ${selectedTeamKeys.join(", ")}`)
    console.log(`✓ Cache: ${cacheEnabled ? "enabled" : "disabled"}`)
    console.log(`✓ Auto-branch: ${autoBranch ? "enabled" : "disabled"}`)
    console.log("\n")
    console.log("Next steps:")
    console.log("  • Try: linear issue list")
    console.log("  • Try: linear workflow list")
    console.log("  • Try: linear project list")
    console.log("\n")
    console.log("For AI agents, all commands support --json output")
    console.log("Example: linear issue list --json | jq '.issues[0]'")
    console.log("\n")
  })

export const configCommand = new Command()
  .name("config")
  .description("Manage Linear CLI configuration")
  .action(function () {
    this.showHelp()
  })
  .command("set", setCommand)
  .command("get", getCommand)
  .command("list", listCommand)
  .command("setup", setupCommand)
  .default("setup")
