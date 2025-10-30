import { Command } from "@cliffy/command"
import { Input, Select } from "@cliffy/prompt"
import {
  createDocument,
  getCurrentProjectFromIssue,
  getProjectIdByName,
} from "../../utils/linear.ts"
import { getEditor, openEditor } from "../../utils/editor.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface CreateOptions {
  title?: string
  content?: string
  project?: string
  currentProject?: boolean
  icon?: string
  color?: string | false
  json?: boolean
  format?: string
  noInteractive?: boolean
}

async function interactiveCreate(_options: CreateOptions) {
  console.log("Create a new Linear document\n")

  // Prompt for title (required)
  const title = await Input.prompt({
    message: "Document title",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Title is required"
      }
      return true
    },
  })

  // Prompt for content with editor option
  const editorName = await getEditor()
  const promptMessage = editorName
    ? `Content [(e) to launch ${editorName.split("/").pop()}]`
    : "Content"

  const contentInput = await Input.prompt({
    message: promptMessage,
    default: "",
  })

  let content: string | undefined
  if (contentInput === "e" && editorName) {
    console.log(`Opening ${editorName.split("/").pop()}...`)
    content = await openEditor()
    if (content && content.length > 0) {
      console.log(`Content entered (${content.length} characters)`)
    }
  } else if (contentInput.trim()) {
    content = contentInput.trim()
  }

  // Check for current project from VCS context
  let projectId: string | undefined
  const currentProject = await getCurrentProjectFromIssue()

  if (currentProject) {
    const useCurrentProject = await Select.prompt({
      message: `Link to current project (${currentProject.name})?`,
      options: [
        { name: "Yes", value: true },
        { name: "No, choose different project", value: false },
      ],
    })

    if (useCurrentProject) {
      projectId = currentProject.id
    }
  }

  // If not using current project or no current project, prompt for project
  if (!projectId) {
    const projectInput = await Input.prompt({
      message: "Project name or ID [Enter to skip]",
      default: "",
    })

    if (projectInput.trim()) {
      try {
        projectId = await getProjectIdByName(projectInput.trim())
      } catch (_err) {
        console.error(errorColor(`Error: Project '${projectInput}' not found`))
        Deno.exit(1)
      }
    }
  }

  // Prompt for additional fields
  const whatNext = await Select.prompt<string>({
    message: "What's next?",
    options: [
      { name: "Submit document", value: "submit" },
      { name: "Add more fields (icon, color)", value: "more" },
    ],
  })

  let icon: string | undefined
  let color: string | undefined

  if (whatNext === "more") {
    const iconInput = await Input.prompt({
      message: "Icon emoji [Enter to skip]",
      default: "",
    })
    if (iconInput.trim()) {
      icon = iconInput.trim()
    }

    const colorInput = await Input.prompt({
      message: "Icon color (hex: #RRGGBB) [Enter to skip]",
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
  }

  // Create document
  const { Spinner } = await import("@std/cli/unstable-spinner")
  const spinner = new Spinner({ message: "Creating document..." })
  spinner.start()

  try {
    const document = await createDocument({
      title,
      content,
      icon,
      color,
      projectId,
    })

    spinner.stop()
    console.log(successColor(`✓ Created document: ${document.title}`))
    console.log(document.url)
  } catch (err) {
    spinner.stop()
    console.error(errorColor(`Error: ${(err as Error).message}`))
    Deno.exit(1)
  }
}

async function flagBasedCreate(options: CreateOptions) {
  const useJson = options.json || options.format === "json"

  // Validate required field
  if (!options.title) {
    const errorMsg =
      "Title is required. Use --title or run without flags for interactive mode"
    if (useJson) {
      console.error(
        JSON.stringify(
          {
            success: false,
            error: {
              code: "MISSING_REQUIRED_FIELD",
              message: errorMsg,
              field: "title",
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
  if (
    options.color && typeof options.color === "string" &&
    !/^#?[0-9A-Fa-f]{6}$/.test(options.color)
  ) {
    const errorMsg =
      `Invalid color '${options.color}'. Use hex format: #RRGGBB (e.g., #FF0000)`
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

  // Normalize color to include # prefix
  const color = options.color && typeof options.color === "string" &&
      !options.color.startsWith("#")
    ? `#${options.color}`
    : (typeof options.color === "string" ? options.color : undefined)

  // Resolve project ID if provided
  let projectId: string | undefined

  // Handle --current-project flag
  if (options.currentProject) {
    const currentProject = await getCurrentProjectFromIssue()
    if (!currentProject) {
      const errorMsg = "Could not detect current project from issue context"
      const details = "Make sure you're on a branch with an issue ID"
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "VCS_CONTEXT_NOT_FOUND",
                message: errorMsg,
                details,
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
        console.error(details)
      }
      Deno.exit(1)
    }
    projectId = currentProject.id

    if (!useJson) {
      console.log(`Auto-linking to project: ${currentProject.name}`)
    }
  } else if (options.project) {
    try {
      projectId = await getProjectIdByName(options.project)
    } catch (_err) {
      const errorMsg = `Project '${options.project}' not found`
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: errorMsg,
                resource: "project",
                id: options.project,
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

  // Show spinner only in non-JSON mode
  const { Spinner } = await import("@std/cli/unstable-spinner")
  const showSpinner = !useJson && Deno.stdout.isTerminal()
  const spinner = showSpinner
    ? new Spinner({ message: "Creating document..." })
    : null

  spinner?.start()

  try {
    const document = await createDocument({
      title: options.title,
      content: options.content,
      icon: options.icon,
      color,
      projectId,
    })

    spinner?.stop()

    if (useJson) {
      console.log(
        JSON.stringify(
          {
            success: true,
            operation: "create",
            document: {
              id: document.id,
              title: document.title,
              slugId: document.slugId,
              url: document.url,
            },
          },
          null,
          2,
        ),
      )
    } else {
      console.log(successColor(`✓ Created document: ${document.title}`))
      console.log(document.url)
    }
  } catch (err) {
    spinner?.stop()

    if (useJson) {
      console.error(
        JSON.stringify(
          {
            success: false,
            error: {
              code: "API_ERROR",
              message: (err as Error).message,
            },
          },
          null,
          2,
        ),
      )
    } else {
      console.error(
        errorColor(
          `Error: Failed to create document: ${(err as Error).message}`,
        ),
      )
    }
    Deno.exit(1)
  }
}

export const createCommand = new Command()
  .name("create")
  .description("Create a new Linear document")
  .option("-t, --title <title:string>", "Document title")
  .option("-c, --content <content:string>", "Document content (markdown)")
  .option(
    "-p, --project <project:string>",
    "Project name or ID to associate with",
  )
  .option(
    "--current-project",
    "Link to current issue's project (from VCS context)",
  )
  .option("-i, --icon <icon:string>", "Icon emoji (e.g., 📄, 📋)")
  .option("--color <color:string>", "Icon color (hex format: #RRGGBB)")
  .option("--no-interactive", "Disable interactive mode")
  .option("--no-color", "Disable colored output")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.title && !useJson && !options.noInteractive &&
      Deno.stdout.isTerminal()

    if (interactive) {
      await interactiveCreate(options)
    } else {
      await flagBasedCreate(options)
    }
  })
