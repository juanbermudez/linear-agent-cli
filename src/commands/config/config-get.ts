import { Command } from "@cliffy/command"
import { getConfigManager } from "../../utils/config-manager.ts"
import { error as errorColor } from "../../utils/styling.ts"

interface GetOptions {
  json?: boolean
  format?: string
}

export const getCommand = new Command()
  .name("get")
  .description("Get a configuration value")
  .arguments("<key:string>")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: GetOptions, key: string) => {
    const useJson = options.json || options.format === "json"

    try {
      const configManager = await getConfigManager()
      const value = configManager.get(key)

      if (value === undefined) {
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: `Config key '${key}' not found`,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: Config key '${key}' not found`))
        }
        Deno.exit(1)
      }

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              key,
              value,
            },
            null,
            2,
          ),
        )
      } else {
        // Handle different value types
        if (typeof value === "object") {
          console.log(JSON.stringify(value, null, 2))
        } else {
          console.log(String(value))
        }
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
