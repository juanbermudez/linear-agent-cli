import { Command } from "@cliffy/command"
import { getConfigManager } from "../../utils/config-manager.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface SetOptions {
  global?: boolean
  human?: boolean
  format?: string
}

export const setCommand = new Command()
  .name("set")
  .description("Set a configuration value")
  .arguments("<key:string> <value:string>")
  .option("-g, --global", "Set in global config (not yet implemented)")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: SetOptions, key: string, value: string) => {
    const useJson = !options.human && options.format !== "text"

    try {
      const configManager = await getConfigManager()

      // Parse value - handle booleans and numbers
      let parsedValue: unknown = value
      if (value === "true") {
        parsedValue = true
      } else if (value === "false") {
        parsedValue = false
      } else if (/^\d+$/.test(value)) {
        parsedValue = parseInt(value, 10)
      } else if (/^\d+\.\d+$/.test(value)) {
        parsedValue = parseFloat(value)
      }

      configManager.set(key, parsedValue)
      await configManager.save()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "set",
              key,
              value: parsedValue,
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Set ${key} = ${value}`))
      }
    } catch (err) {
      const error = err as Error
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "API_ERROR",
                message: error.message,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(errorColor(`Error: ${error.message}`))
      }
      Deno.exit(1)
    }
  })
