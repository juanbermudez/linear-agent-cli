import { Command } from "@cliffy/command"
import { getProjectIdByName, updateDocument } from "../../utils/linear.ts"
import { openEditor } from "../../utils/editor.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

interface EditOptions {
  title?: string
  content?: string | boolean
  project?: string
  icon?: string
  color?: string
  json?: boolean
  format?: string
}

export const editCommand = new Command()
  .name("edit")
  .description("Update a Linear document")
  .arguments("<docId:string>")
  .option("-t, --title <title:string>", "New document title")
  .option(
    "-c, --content [content:string]",
    "New document content (omit value to open editor)",
  )
  .option("-p, --project <project:string>", "New project association")
  .option("-i, --icon <icon:string>", "New icon emoji")
  .option("--color <color:string>", "New icon color (hex format: #RRGGBB)")
  .option("-j, --json", "Output result as JSON (for AI agents)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: EditOptions, docId: string) => {
    const useJson = options.json || options.format === "json"

    // Validate at least one field is provided
    if (
      !options.title && !options.content && !options.project && !options.icon &&
      !options.color
    ) {
      const errorMsg =
        "No fields provided to update. Use --title, --content, --project, --icon, or --color"
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

    // Handle content editing with editor if --content flag has no value
    let content: string | undefined
    if (options.content === true) {
      // Flag provided without value - open editor
      console.log("Opening editor...")
      content = await openEditor()
    } else if (typeof options.content === "string") {
      content = options.content
    }

    // Normalize color to include # prefix
    const color = options.color && !options.color.startsWith("#")
      ? `#${options.color}`
      : options.color

    // Resolve project ID if provided
    let projectId: string | undefined
    if (options.project) {
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

    // Build input object with only provided fields
    const input: {
      title?: string
      content?: string
      icon?: string
      color?: string
      projectId?: string
    } = {}

    if (options.title) input.title = options.title
    if (content != null) input.content = content
    if (options.icon) input.icon = options.icon
    if (color) input.color = color
    if (projectId) input.projectId = projectId

    // Show spinner only in non-JSON mode
    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner
      ? new Spinner({ message: `Updating document ${docId}...` })
      : null

    spinner?.start()

    try {
      const document = await updateDocument(docId, input)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "update",
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
        console.log(successColor(`✓ Updated document: ${document.title}`))
        console.log(document.url)
      }
    } catch (err) {
      spinner?.stop()

      const errorMsg = (err as Error).message.includes("not found")
        ? `Document '${docId}' not found`
        : `Failed to update document: ${(err as Error).message}`

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
                  resource: "document",
                  id: docId,
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
