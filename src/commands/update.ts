import { Command } from "@cliffy/command"
import {
  error as errorColor,
  success as successColor,
  warning as warningColor,
} from "../utils/styling.ts"

export const updateCommand = new Command()
  .name("update")
  .description("Update Linear CLI to the latest version from GitHub")
  .action(async () => {
    console.log("🔄 Updating Linear CLI...")
    console.log()

    try {
      // Run deno install to update from GitHub
      const command = new Deno.Command("deno", {
        args: [
          "install",
          "--global",
          "--allow-all",
          "--force",
          "--name",
          "linear",
          "https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/src/main.ts",
        ],
        stdout: "piped",
        stderr: "piped",
      })

      const { code, stderr } = await command.output()

      if (code === 0) {
        console.log(successColor("✓ Linear CLI updated successfully!"))
        console.log()
        console.log("Run 'linear --version' to see the new version")
      } else {
        const errorOutput = new TextDecoder().decode(stderr)
        console.error(errorColor("✗ Update failed:"))
        console.error(errorOutput)
        Deno.exit(1)
      }
    } catch (err) {
      console.error(errorColor("✗ Update failed:"))
      console.error((err as Error).message)
      console.log()
      console.log(warningColor("Manual update:"))
      console.log(
        "  deno install --global --allow-all --force --name linear \\",
      )
      console.log(
        "    https://raw.githubusercontent.com/juanbermudez/linear-agent-cli/main/src/main.ts",
      )
      Deno.exit(1)
    }
  })
