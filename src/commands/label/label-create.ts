import { Command } from "@cliffy/command"
import { Input, Select } from "@cliffy/prompt"
import {
  createLabel,
  getAllTeams,
  getLabelIdByName,
  getTeamIdByKey,
} from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface CreateOptions {
  name?: string
  description?: string
  color?: string
  team?: string
  parent?: string
  isGroup?: boolean
  json?: boolean
  format?: string
  noInteractive?: boolean
}

const PRESET_COLORS = [
  { name: "Red", value: "#e5484d" },
  { name: "Orange", value: "#f76b15" },
  { name: "Yellow", value: "#f5cd47" },
  { name: "Green", value: "#46a758" },
  { name: "Blue", value: "#0091ff" },
  { name: "Purple", value: "#8e4ec6" },
  { name: "Pink", value: "#e54666" },
  { name: "Gray", value: "#9ba1a6" },
]

export const createCommand = new Command()
  .name("create")
  .description("Create a new label")
  .option("-n, --name <name:string>", "Label name")
  .option("-d, --description <description:string>", "Label description")
  .option("-c, --color <color:string>", "Label color (hex code)")
  .option("-t, --team <team:string>", "Team ID or key")
  .option(
    "-p, --parent <parent:string>",
    "Parent label name (for label groups/hierarchy)",
  )
  .option("--is-group", "Mark this label as a group (container for sub-labels)")
  .option("--no-interactive", "Disable interactive mode")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.name && !useJson && !options.noInteractive &&
      Deno.stdout.isTerminal()

    let name: string
    let description: string | undefined
    let color: string | undefined
    let teamId: string | undefined
    let parentId: string | undefined
    const isGroup = options.isGroup || false

    if (interactive) {
      name = await Input.prompt({
        message: "Label name",
        validate: (value) => value.trim() !== "" || "Name is required",
      })

      description = await Input.prompt({
        message: "Description (optional)",
        default: "",
      })
      if (description === "") description = undefined

      // Color selection
      const colorOptions = PRESET_COLORS.map((c) => ({
        name: c.name,
        value: c.value,
      }))
      colorOptions.push({ name: "Custom", value: "custom" })
      colorOptions.unshift({ name: "None", value: "" })

      const selectedColor = await Select.prompt({
        message: "Label color (optional)",
        options: colorOptions,
      })

      if (selectedColor === "custom") {
        color = await Input.prompt({
          message: "Color (hex code, e.g. #ff0000)",
          validate: (value) => {
            if (!value) return true
            if (!/^#[0-9a-f]{6}$/i.test(value)) {
              return "Invalid hex color. Use format: #rrggbb"
            }
            return true
          },
        })
      } else if (selectedColor) {
        color = selectedColor
      }

      // Team selection
      const { Spinner } = await import("@std/cli/unstable-spinner")
      const teamSpinner = new Spinner({ message: "Loading teams..." })
      teamSpinner.start()
      const teams = await getAllTeams()
      teamSpinner.stop()

      const teamOptions = teams.map((t) => ({
        name: `${t.name} (${t.key})`,
        value: t.id,
      }))
      teamOptions.unshift({ name: "Organization-wide", value: "" })

      const selectedTeam = await Select.prompt({
        message: "Team (optional)",
        options: teamOptions,
        search: true,
      })
      teamId = selectedTeam || undefined
    } else {
      if (!options.name) {
        const errorMsg = "Name is required. Use --name or run without flags"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "MISSING_REQUIRED_FIELD",
                  message: errorMsg,
                },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      name = options.name
      description = options.description
      color = options.color

      // Validate color format if provided
      if (color && !/^#[0-9a-f]{6}$/i.test(color)) {
        const errorMsg = "Invalid hex color. Use format: #rrggbb"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: { code: "INVALID_VALUE", message: errorMsg },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // Resolve team if provided
      if (options.team) {
        try {
          const resolvedTeamId = await getTeamIdByKey(options.team)
          if (!resolvedTeamId) {
            throw new Error("Team not found")
          }
          teamId = resolvedTeamId
        } catch (_err) {
          const errorMsg = `Team '${options.team}' not found`
          if (useJson) {
            console.error(
              JSON.stringify(
                {
                  success: false,
                  error: { code: "NOT_FOUND", message: errorMsg },
                },
                null,
                2,
              ),
            )
          } else {
            console.error(errorColor(`Error: ${errorMsg}`))
          }
          Deno.exit(1)
        }
      }
    }

    // Resolve parent label if provided
    if (options.parent) {
      if (!options.team) {
        const errorMsg = "Team is required when specifying a parent label"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: { code: "MISSING_REQUIRED_FIELD", message: errorMsg },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      try {
        parentId = await getLabelIdByName(options.parent, options.team)
        if (!parentId) {
          throw new Error("Parent label not found")
        }
      } catch (_err) {
        const errorMsg =
          `Parent label '${options.parent}' not found in team ${options.team}`
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: { code: "NOT_FOUND", message: errorMsg },
              },
              null,
              2,
            ),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: "Creating label..." })
      : null
    spinner?.start()

    try {
      const label = await createLabel({
        name,
        description,
        color,
        teamId,
        parentId,
        isGroup,
      })
      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "create",
              label: {
                id: label.id,
                name: label.name,
                description: label.description,
                color: label.color,
                team: label.team
                  ? {
                    id: label.team.id,
                    key: label.team.key,
                    name: label.team.name,
                  }
                  : null,
                parent: label.parent
                  ? { id: label.parent.id, name: label.parent.name }
                  : null,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Created label '${label.name}'`))
        if (label.parent) {
          console.log(`Parent: ${label.parent.name}`)
        }
        if (label.team) {
          console.log(`Team: ${label.team.name} (${label.team.key})`)
        }
      }
    } catch (_err) {
      spinner?.stop()
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: { code: "API_ERROR", message: err.message },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(errorColor(`Error: ${err.message}`))
      }
      Deno.exit(1)
    }
  })
