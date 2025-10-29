import { Command } from "@cliffy/command"
import { Input, Select } from "@cliffy/prompt"
import { createProjectUpdate } from "../../utils/linear.ts"
import { openEditor, getEditor } from "../../utils/editor.ts"
import { error as errorColor, success as successColor } from "../../utils/styling.ts"

interface CreateOptions {
  body?: string
  health?: string
  json?: boolean
  format?: string
  noInteractive?: boolean
}

export const updateCreateCommand = new Command()
  .name("update-create")
  .description("Create a project status update")
  .arguments("<projectId:string>")
  .option("-b, --body <body:string>", "Update body (markdown)")
  .option("-h, --health <health:string>", "Health status (onTrack, atRisk, offTrack)")
  .option("--no-interactive", "Disable interactive mode")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options: CreateOptions, projectId: string) => {
    const useJson = options.json || options.format === "json"
    const interactive = !options.body && !useJson && !options.noInteractive && Deno.stdout.isTerminal()

    let body: string
    let health: string

    if (interactive) {
      const healthOptions = [
        { name: "✅ On Track", value: "onTrack" },
        { name: "⚠️  At Risk", value: "atRisk" },
        { name: "🔴 Off Track", value: "offTrack" },
      ]
      health = await Select.prompt({ message: "Health status", options: healthOptions })

      const editorName = await getEditor()
      const promptMessage = editorName
        ? `Update body [(e) to launch ${editorName.split("/").pop()}]`
        : "Update body"

      const bodyInput = await Input.prompt({ message: promptMessage, default: "" })

      if (bodyInput === "e" && editorName) {
        console.log(`Opening ${editorName.split("/").pop()}...`)
        body = (await openEditor()) || ""
        if (body) console.log(`Content entered (${body.length} characters)`)
      } else {
        body = bodyInput
      }
    } else {
      if (!options.body || !options.health) {
        const errorMsg = "Body and health are required. Use --body and --health or run without flags"
        if (useJson) {
          console.error(JSON.stringify({ success: false, error: { code: "MISSING_REQUIRED_FIELD", message: errorMsg } }, null, 2))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }
      body = options.body
      health = options.health

      if (!["onTrack", "atRisk", "offTrack"].includes(health)) {
        const errorMsg = "Health must be onTrack, atRisk, or offTrack"
        if (useJson) {
          console.error(JSON.stringify({ success: false, error: { code: "INVALID_VALUE", message: errorMsg } }, null, 2))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner ? new Spinner({ message: "Creating update..." }) : null
    spinner?.start()

    try {
      const update = await createProjectUpdate({ projectId, body, health })
      spinner?.stop()

      if (useJson) {
        console.log(JSON.stringify({
          success: true,
          operation: "create",
          projectUpdate: {
            id: update.id,
            health: update.health,
            bodyPreview: update.body.substring(0, 100),
            url: update.url,
            createdAt: update.createdAt,
            author: { id: update.user.id, name: update.user.displayName },
          },
        }, null, 2))
      } else {
        console.log(successColor(`✓ Created project update`))
        console.log(update.url)
      }
    } catch (err) {
      spinner?.stop()
      if (useJson) {
        console.error(JSON.stringify({ success: false, error: { code: "API_ERROR", message: err.message } }, null, 2))
      } else {
        console.error(errorColor(`Error: ${err.message}`))
      }
      Deno.exit(1)
    }
  })
