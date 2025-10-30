import { Command } from "@cliffy/command"
import { Input, Select } from "@cliffy/prompt"
import {
  createDocument,
  createProject,
  getTeamIdByKey,
  lookupUserId,
  listProjectStatuses,
} from "../../utils/linear.ts"
import { getOption } from "../../config.ts"
import { error as errorColor, success as successColor } from "../../utils/styling.ts"

interface CreateOptions {
  name?: string
  description?: string
  content?: string
  team?: string[]
  status?: string
  lead?: string
  icon?: string
  color?: string
  startDate?: string
  targetDate?: string
  priority?: number
  withDoc?: boolean
  docTitle?: string
  json?: boolean
  format?: string
  noInteractive?: boolean
}

async function interactiveCreate(options: CreateOptions) {
  console.log("Create a new Linear project\n")

  // Prompt for name (required)
  const name = await Input.prompt({
    message: "Project name",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Project name is required"
      }
      return true
    },
  })

  // Prompt for description
  const description = await Input.prompt({
    message: "Description [Enter to skip]",
    default: "",
  })

  // Get default team
  const defaultTeam = getOption("team_id") as string | undefined
  let teamKeys: string[] = []

  if (defaultTeam) {
    const useDefault = await Select.prompt({
      message: `Use default team '${defaultTeam}'?`,
      options: [
        { name: "Yes", value: "yes" },
        { name: "No, specify different team(s)", value: "no" },
      ],
    })

    if (useDefault === "yes") {
      teamKeys = [defaultTeam]
    }
  }

  if (teamKeys.length === 0) {
    const teamInput = await Input.prompt({
      message: "Team key (required)",
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "At least one team is required"
        }
        return true
      },
    })
    teamKeys = [teamInput.trim()]
  }

  // Load project statuses
  const statuses = await listProjectStatuses()
  const statusOptions = statuses.map((s) => ({
    name: `${s.name} (${s.type})`,
    value: s.id,
  }))

  const statusId = await Select.prompt({
    message: "Project status",
    options: statusOptions,
    search: true,
  })

  // Prompt for lead (optional)
  const leadInput = await Input.prompt({
    message: "Project lead (username or email) [Enter to skip]",
    default: "",
  })

  let leadId: string | undefined
  if (leadInput.trim()) {
    try {
      leadId = await lookupUserId(leadInput.trim())
    } catch (err) {
      console.error(errorColor(`Warning: User '${leadInput}' not found, proceeding without lead`))
    }
  }

  // Prompt for additional fields
  const whatNext = await Select.prompt<string>({
    message: "What's next?",
    options: [
      { name: "Create project", value: "create" },
      { name: "Add more fields (dates, icon, priority)", value: "more" },
    ],
  })

  let icon: string | undefined
  let color: string | undefined
  let startDate: string | undefined
  let targetDate: string | undefined
  let priority: number | undefined

  if (whatNext === "more") {
    const iconInput = await Input.prompt({
      message: "Icon emoji [Enter to skip]",
      default: "",
    })
    if (iconInput.trim()) {
      icon = iconInput.trim()
    }

    const colorInput = await Input.prompt({
      message: "Color (hex: #RRGGBB) [Enter to skip]",
      default: "",
      validate: (value) => {
        if (!value.trim()) return true
        if (!/^#?[0-9A-Fa-f]{6}$/.test(value)) {
          return "Invalid color format. Use hex format: #RRGGBB (e.g., #FF0000)"
        }
        return true
      },
    })
    if (colorInput.trim()) {
      color = colorInput.startsWith("#") ? colorInput : `#${colorInput}`
    }

    const startDateInput = await Input.prompt({
      message: "Start date (YYYY-MM-DD) [Enter to skip]",
      default: "",
      validate: (value) => {
        if (!value.trim()) return true
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return "Invalid date format. Use YYYY-MM-DD"
        }
        return true
      },
    })
    if (startDateInput.trim()) {
      startDate = startDateInput.trim()
    }

    const targetDateInput = await Input.prompt({
      message: "Target date (YYYY-MM-DD) [Enter to skip]",
      default: "",
      validate: (value) => {
        if (!value.trim()) return true
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return "Invalid date format. Use YYYY-MM-DD"
        }
        return true
      },
    })
    if (targetDateInput.trim()) {
      targetDate = targetDateInput.trim()
    }

    const priorityOptions = [
      { name: "None", value: 0 },
      { name: "Urgent", value: 1 },
      { name: "High", value: 2 },
      { name: "Normal", value: 3 },
      { name: "Low", value: 4 },
    ]

    priority = await Select.prompt({
      message: "Priority",
      options: priorityOptions,
    })
  }

  // Resolve team IDs
  const teamIds: string[] = []
  for (const teamKey of teamKeys) {
    try {
      const teamId = await getTeamIdByKey(teamKey)
      if (teamId) {
        teamIds.push(teamId)
      }
    } catch (err) {
      console.error(errorColor(`Error: Team '${teamKey}' not found`))
      Deno.exit(1)
    }
  }

  // Create project
  const { Spinner } = await import("@std/cli/unstable-spinner")
  const spinner = new Spinner({ message: "Creating project..." })
  spinner.start()

  try {
    const project = await createProject({
      name,
      description,
      content: options.content,
      teamIds,
      statusId,
      leadId,
      icon,
      color,
      startDate,
      targetDate,
      priority,
    })

    spinner.stop()
    console.log(successColor(`✓ Created project: ${project.name}`))
    console.log(project.url)
  } catch (err) {
    spinner.stop()
    console.error(errorColor(`Error: ${err.message}`))
    Deno.exit(1)
  }
}

async function flagBasedCreate(options: CreateOptions) {
  const useJson = options.json || options.format === "json"

  // Validate required fields
  if (!options.name) {
    const errorMsg = "Project name is required. Use --name or run without flags for interactive mode"
    if (useJson) {
      console.error(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELD",
            message: errorMsg,
            field: "name",
          },
        }, null, 2),
      )
    } else {
      console.error(errorColor(`Error: ${errorMsg}`))
    }
    Deno.exit(1)
  }

  // Resolve team IDs (required)
  let teamKeys = options.team || []
  if (teamKeys.length === 0) {
    const defaultTeam = getOption("team_id") as string | undefined
    if (defaultTeam) {
      teamKeys = [defaultTeam]
    } else {
      const errorMsg = "At least one team is required. Use --team or set a default team"
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: {
              code: "MISSING_REQUIRED_FIELD",
              message: errorMsg,
              field: "team",
            },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  }

  const teamIds: string[] = []
  for (const teamKey of teamKeys) {
    try {
      const teamId = await getTeamIdByKey(teamKey)
      if (teamId) {
        teamIds.push(teamId)
      }
    } catch (err) {
      const errorMsg = `Team '${teamKey}' not found`
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: errorMsg,
              resource: "team",
              id: teamKey,
            },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  }

  // Validate color format if provided
  if (options.color && !/^#?[0-9A-Fa-f]{6}$/.test(options.color)) {
    const errorMsg = `Invalid color '${options.color}'. Use hex format: #RRGGBB`
    if (useJson) {
      console.error(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_VALUE",
            message: errorMsg,
            field: "color",
            value: options.color,
          },
        }, null, 2),
      )
    } else {
      console.error(errorColor(`Error: ${errorMsg}`))
    }
    Deno.exit(1)
  }

  // Normalize color
  const color = options.color && !options.color.startsWith("#")
    ? `#${options.color}`
    : options.color

  // Validate date formats
  if (options.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) {
    const errorMsg = `Invalid start date '${options.startDate}'. Use YYYY-MM-DD format`
    if (useJson) {
      console.error(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_VALUE",
            message: errorMsg,
            field: "startDate",
            value: options.startDate,
          },
        }, null, 2),
      )
    } else {
      console.error(errorColor(`Error: ${errorMsg}`))
    }
    Deno.exit(1)
  }

  if (options.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)) {
    const errorMsg = `Invalid target date '${options.targetDate}'. Use YYYY-MM-DD format`
    if (useJson) {
      console.error(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_VALUE",
            message: errorMsg,
            field: "targetDate",
            value: options.targetDate,
          },
        }, null, 2),
      )
    } else {
      console.error(errorColor(`Error: ${errorMsg}`))
    }
    Deno.exit(1)
  }

  // Resolve status ID if status name provided
  let statusId = options.status
  if (statusId) {
    // If not a UUID, try to resolve as status name
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(statusId)) {
      const statuses = await listProjectStatuses()
      const status = statuses.find(
        (s) => s.name.toLowerCase() === statusId!.toLowerCase() || s.type === statusId!.toLowerCase(),
      )
      if (status) {
        statusId = status.id
      } else {
        const errorMsg = `Status '${statusId}' not found`
        if (useJson) {
          console.error(
            JSON.stringify({
              success: false,
              error: {
                code: "NOT_FOUND",
                message: errorMsg,
                resource: "status",
                id: statusId,
              },
            }, null, 2),
          )
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }
    }
  }

  // Resolve lead ID if provided
  let leadId: string | undefined
  if (options.lead) {
    try {
      leadId = await lookupUserId(options.lead)
    } catch (err) {
      const errorMsg = `User '${options.lead}' not found`
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: errorMsg,
              resource: "user",
              id: options.lead,
            },
          }, null, 2),
        )
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  }

  // Show spinner only in non-JSON mode
  const { Spinner } = await import("@std/cli/unstable-spinner")
  const showSpinner = !useJson && Deno.stdout.isTerminal()
  const spinner = showSpinner ? new Spinner({ message: "Creating project..." }) : null

  spinner?.start()

  try {
    const project = await createProject({
      name: options.name,
      description: options.description,
      content: options.content,
      teamIds,
      statusId,
      leadId,
      icon: options.icon,
      color,
      startDate: options.startDate,
      targetDate: options.targetDate,
      priority: options.priority,
    })

    spinner?.stop()

    // Create document if --with-doc flag is set
    let document
    if (options.withDoc) {
      const docTitle = options.docTitle || `${project.name} Design Doc`

      if (!useJson) {
        console.log(successColor(`✓ Created project: ${project.name}`))
        console.log(project.url)
        console.log()
      }

      const docSpinner = showSpinner
        ? new Spinner({ message: "Creating document..." })
        : null
      docSpinner?.start()

      try {
        document = await createDocument({
          title: docTitle,
          projectId: project.id,
        })
        docSpinner?.stop()

        if (!useJson) {
          console.log(successColor(`✓ Created document: ${document.title} (linked to project)`))
          console.log(document.url)
        }
      } catch (err) {
        docSpinner?.stop()
        if (useJson) {
          console.error(
            JSON.stringify({
              success: false,
              error: {
                code: "API_ERROR",
                message: `Project created but document creation failed: ${err.message}`,
              },
              project: {
                id: project.id,
                name: project.name,
                url: project.url,
              },
            }, null, 2),
          )
        } else {
          console.error(
            errorColor(`Warning: Document creation failed: ${err.message}`),
          )
        }
        Deno.exit(1)
      }
    }

    if (useJson) {
      const response: any = {
        success: true,
        operation: "create",
        project: {
          id: project.id,
          name: project.name,
          slugId: project.slugId,
          url: project.url,
          status: {
            id: project.status.id,
            name: project.status.name,
            type: project.status.type,
          },
          lead: project.lead ? {
            id: project.lead.id,
            name: project.lead.displayName,
          } : null,
          teams: project.teams?.nodes?.map((team) => ({
            id: team.id,
            key: team.key,
            name: team.name,
          })) || [],
        },
      }

      if (document) {
        response.document = {
          id: document.id,
          title: document.title,
          slugId: document.slugId,
          url: document.url,
        }
        response.relationships = {
          documentLinkedToProject: true,
        }
      }

      console.log(JSON.stringify(response, null, 2))
    } else if (!options.withDoc) {
      // Only show success message if we didn't already show it for --with-doc
      console.log(successColor(`✓ Created project: ${project.name}`))
      console.log(project.url)
    }
  } catch (err) {
    spinner?.stop()

    if (useJson) {
      console.error(
        JSON.stringify({
          success: false,
          error: {
            code: "API_ERROR",
            message: err.message,
          },
        }, null, 2),
      )
    } else {
      console.error(errorColor(`Error: Failed to create project: ${err.message}`))
    }
    Deno.exit(1)
  }
}

export const createCommand = new Command()
  .name("create")
  .description("Create a new Linear project")
  .option("-n, --name <name:string>", "Project name")
  .option("-d, --description <description:string>", "Project description (max 255 chars)")
  .option("-c, --content <content:string>", "Project content/body (markdown, for full details)")
  .option("-t, --team <team:string>", "Team key (can be repeated)", { collect: true })
  .option("-s, --status <status:string>", "Project status name or ID")
  .option("-l, --lead <lead:string>", "Project lead (username or email)")
  .option("-i, --icon <icon:string>", "Icon emoji")
  .option("--color <color:string>", "Color (hex format: #RRGGBB)")
  .option("--start-date <date:string>", "Start date (YYYY-MM-DD)")
  .option("--target-date <date:string>", "Target date (YYYY-MM-DD)")
  .option("-p, --priority <priority:number>", "Priority (0-4: none, urgent, high, normal, low)")
  .option("--with-doc", "Create a design document with the project")
  .option("--doc-title <title:string>", "Document title (used with --with-doc)")
  .option("--no-interactive", "Disable interactive mode")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.name && !useJson && !options.noInteractive && Deno.stdout.isTerminal()

    if (interactive) {
      await interactiveCreate(options)
    } else {
      await flagBasedCreate(options)
    }
  })
