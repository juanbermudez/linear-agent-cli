import { Command } from "@cliffy/command"
import {
  getTeamIdByKey,
  listProjectStatuses,
  lookupUserId,
  updateProject,
} from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface UpdateOptions {
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
  json?: boolean
  format?: string
}

export const updateCommand = new Command()
  .name("update")
  .description("Update a Linear project")
  .arguments("<projectId:string>")
  .option("-n, --name <name:string>", "New project name")
  .option("-d, --description <description:string>", "New description")
  .option(
    "-c, --content <content:string>",
    "New project content/body (markdown)",
  )
  .option("-t, --team <team:string>", "New team key(s) (can be repeated)", {
    collect: true,
  })
  .option("-s, --status <status:string>", "New project status name or ID")
  .option("-l, --lead <lead:string>", "New project lead (username or email)")
  .option("-i, --icon <icon:string>", "New icon emoji")
  .option("--color <color:string>", "New color (hex format: #RRGGBB)")
  .option("--start-date <date:string>", "New start date (YYYY-MM-DD)")
  .option("--target-date <date:string>", "New target date (YYYY-MM-DD)")
  .option("-p, --priority <priority:number>", "New priority (0-4)")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: UpdateOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"

    // Validate at least one field is provided
    if (
      !options.name &&
      !options.description &&
      !options.content &&
      !options.team &&
      !options.status &&
      !options.lead &&
      !options.icon &&
      !options.color &&
      !options.startDate &&
      !options.targetDate &&
      options.priority == null
    ) {
      const errorMsg =
        "No fields provided to update. Use --name, --description, --content, --status, --lead, etc."
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

    // Validate color format if provided
    if (options.color && !/^#?[0-9A-Fa-f]{6}$/.test(options.color)) {
      const errorMsg =
        `Invalid color '${options.color}'. Use hex format: #RRGGBB`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_VALUE",
                message: errorMsg,
                field: "color",
                value: options.color,
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

    // Normalize color
    const color = options.color && !options.color.startsWith("#")
      ? `#${options.color}`
      : options.color

    // Validate date formats
    if (options.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) {
      const errorMsg =
        `Invalid start date '${options.startDate}'. Use YYYY-MM-DD format`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_VALUE",
                message: errorMsg,
                field: "startDate",
                value: options.startDate,
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

    if (options.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)) {
      const errorMsg =
        `Invalid target date '${options.targetDate}'. Use YYYY-MM-DD format`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_VALUE",
                message: errorMsg,
                field: "targetDate",
                value: options.targetDate,
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

    // Resolve team IDs if provided
    let teamIds: string[] | undefined
    if (options.team && options.team.length > 0) {
      teamIds = []
      for (const teamKey of options.team) {
        try {
          const teamId = await getTeamIdByKey(teamKey)
          if (teamId) {
            teamIds.push(teamId)
          }
        } catch (err) {
          const errorMsg = `Team '${teamKey}' not found`
          if (useJson) {
            console.error(
              JSON.stringify(
                {
                  success: false,
                  error: {
                    code: "NOT_FOUND",
                    message: errorMsg,
                    resource: "team",
                    id: teamKey,
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
      }
    }

    // Resolve status ID if status name provided
    let statusId = options.status
    if (statusId) {
      // If not a UUID, try to resolve as status name
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          statusId,
        )
      ) {
        const statuses = await listProjectStatuses()
        const status = statuses.find(
          (s) =>
            s.name.toLowerCase() === statusId!.toLowerCase() ||
            s.type === statusId!.toLowerCase(),
        )
        if (status) {
          statusId = status.id
        } else {
          const errorMsg = `Status '${statusId}' not found`
          if (useJson) {
            console.error(
              JSON.stringify(
                {
                  success: false,
                  error: {
                    code: "NOT_FOUND",
                    message: errorMsg,
                    resource: "status",
                    id: statusId,
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
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: errorMsg,
                  resource: "user",
                  id: options.lead,
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
    }

    // Build input object with only provided fields
    const input: {
      name?: string
      description?: string
      content?: string
      statusId?: string
      leadId?: string
      icon?: string
      color?: string
      teamIds?: string[]
      startDate?: string
      targetDate?: string
      priority?: number
    } = {}

    if (options.name) input.name = options.name
    if (options.description) input.description = options.description
    if (options.content) input.content = options.content
    if (statusId) input.statusId = statusId
    if (leadId) input.leadId = leadId
    if (options.icon) input.icon = options.icon
    if (color) input.color = color
    if (teamIds) input.teamIds = teamIds
    if (options.startDate) input.startDate = options.startDate
    if (options.targetDate) input.targetDate = options.targetDate
    if (options.priority != null) input.priority = options.priority

    // Show spinner only in non-JSON mode
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Updating project ${projectId}...` })
      : null

    spinner?.start()

    try {
      const project = await updateProject(projectId, input)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "update",
              project: {
                id: project.id,
                name: project.name,
                slugId: project.slugId,
                url: project.url,
                status: {
                  id: project.status.id,
                  name: project.status.name,
                },
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(successColor(`✓ Updated project: ${project.name}`))
        console.log(project.url)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Project '${projectId}' not found`
        : `Failed to update project: ${(err as Error).message}`

      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: (err as Error).message.includes("not found")
                  ? "NOT_FOUND"
                  : "API_ERROR",
                message: errorMsg,
                ...((err as Error).message.includes("not found") && {
                  resource: "project",
                  id: projectId,
                }),
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
  })
