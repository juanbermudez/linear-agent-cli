import { Command } from "@cliffy/command"
import { getConfigManager } from "../../utils/config-manager.ts"
import { error as errorColor } from "../../utils/styling.ts"
import { bold } from "@std/fmt/colors"

interface ListOptions {
  section?: string
  json?: boolean
  format?: string
}

function maskToken(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("lin_api_")) {
    return value.substring(0, 12) + "***************************"
  }
  return value
}

function formatConfig(obj: unknown, prefix = "", masked = true): string[] {
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      lines.push(bold(`\n[${fullKey}]`))
      lines.push(...formatConfig(value, fullKey, masked))
    } else {
      const displayValue = masked ? maskToken(value) : value
      lines.push(`${key} = ${JSON.stringify(displayValue)}`)
    }
  }

  return lines
}

export const listCommand = new Command()
  .name("list")
  .description("List all configuration values")
  .option("--section <section:string>", "Show only specific section")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: ListOptions) => {
    const useJson = options.json || options.format === "json"

    try {
      const configManager = await getConfigManager()

      if (options.section) {
        const sectionValue = configManager.getSection(options.section)

        if (sectionValue === undefined) {
          if (useJson) {
            console.error(
              JSON.stringify({
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: `Config section '${options.section}' not found`,
                },
              }, null, 2),
            )
          } else {
            console.error(
              errorColor(`Error: Config section '${options.section}' not found`),
            )
          }
          Deno.exit(1)
        }

        if (useJson) {
          console.log(
            JSON.stringify({
              success: true,
              section: options.section,
              values: sectionValue,
            }, null, 2),
          )
        } else {
          console.log(bold(`[${options.section}]`))
          if (typeof sectionValue === "object" && sectionValue != null) {
            const lines = formatConfig(sectionValue, "", true)
            console.log(lines.join("\n"))
          } else {
            console.log(JSON.stringify(maskToken(sectionValue)))
          }
        }
      } else {
        const allConfig = configManager.getAll()

        if (useJson) {
          // Mask token in JSON output
          const maskedConfig = JSON.parse(JSON.stringify(allConfig))
          if (maskedConfig.auth?.token) {
            maskedConfig.auth.token = maskToken(maskedConfig.auth.token)
          }
          if (maskedConfig.api_key) {
            maskedConfig.api_key = maskToken(maskedConfig.api_key)
          }

          console.log(
            JSON.stringify({
              success: true,
              config: maskedConfig,
            }, null, 2),
          )
        } else {
          console.log(bold("Configuration:\n"))
          const lines = formatConfig(allConfig, "", true)
          console.log(lines.join("\n"))
        }
      }
    } catch (err) {
      const error = err as Error
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: {
              code: "API_ERROR",
              message: error.message,
            },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${error.message}`))
      }
      Deno.exit(1)
    }
  })
