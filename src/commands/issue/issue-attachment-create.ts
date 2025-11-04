import { Command } from "@cliffy/command"
import { getIssueIdentifier } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

interface CreateOptions {
  title: string
  url: string
  subtitle?: string
  iconUrl?: string
  human?: boolean
}

async function createIssueAttachment(
  issueId: string,
  title: string,
  url: string,
  subtitle?: string,
  iconUrl?: string,
) {
  const client = getGraphQLClient()

  // First get the issue UUID (not the identifier)
  const issueQuery = `
    query GetIssueIdForAttachment($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const issueData = await client.request<any>(issueQuery, { id: issueId })

  if (!issueData.issue) {
    throw new Error(`Issue '${issueId}' not found`)
  }

  // Create the attachment
  const mutation = `
    mutation CreateAttachment($input: AttachmentCreateInput!) {
      attachmentCreate(input: $input) {
        success
        attachment {
          id
          title
          subtitle
          url
          source
          sourceType
          createdAt
          issue {
            id
            identifier
            title
          }
        }
      }
    }
  `

  const input: {
    issueId: string
    title: string
    url: string
    subtitle?: string
    iconUrl?: string
  } = {
    issueId: issueData.issue.id,
    title,
    url,
  }

  if (subtitle) input.subtitle = subtitle
  if (iconUrl) input.iconUrl = iconUrl

  // deno-lint-ignore no-explicit-any
  const data = await client.request<any>(mutation, { input })

  if (!data.attachmentCreate.success || !data.attachmentCreate.attachment) {
    throw new Error("Failed to create attachment")
  }

  return data.attachmentCreate.attachment
}

export const createCommand = new Command()
  .name("create")
  .description("Add an attachment to an issue")
  .arguments("[issueId:string]")
  .option("-t, --title <title:string>", "Attachment title", { required: true })
  .option("-u, --url <url:string>", "Attachment URL", { required: true })
  .option("-s, --subtitle <subtitle:string>", "Attachment subtitle")
  .option(
    "-i, --icon-url <iconUrl:string>",
    "Icon URL (20x20px, jpg/png, max 1MB)",
  )
  .option("--human", "Output in human-readable format (default: JSON)")
  .action(async (options: CreateOptions, issueId?: string) => {
    const useJson = !options.human

    try {
      // Get issue identifier from argument or VCS
      const identifier = await getIssueIdentifier(issueId)
      if (!identifier) {
        const errorMsg =
          "No issue identifier provided and none found in branch/commit"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "MISSING_IDENTIFIER",
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

      // Validate URL format
      try {
        new URL(options.url)
      } catch {
        const errorMsg = "Invalid URL format"
        if (useJson) {
          console.error(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "INVALID_VALUE",
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

      const { Spinner } = await import("@std/cli/unstable-spinner")
      const showSpinner = !useJson && Deno.stdout.isTerminal()
      const spinner = showSpinner
        ? new Spinner({ message: `Adding attachment to ${identifier}...` })
        : null
      spinner?.start()

      const attachment = await createIssueAttachment(
        identifier,
        options.title,
        options.url,
        options.subtitle,
        options.iconUrl,
      )

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "create",
              attachment: {
                id: attachment.id,
                title: attachment.title,
                subtitle: attachment.subtitle,
                url: attachment.url,
                source: attachment.source,
                sourceType: attachment.sourceType,
                createdAt: attachment.createdAt,
                issue: {
                  id: attachment.issue.id,
                  identifier: attachment.issue.identifier,
                  title: attachment.issue.title,
                },
              },
            },
            null,
            2,
          ),
        )
      } else {
        console.log(
          successColor(
            `✓ Attachment added to ${attachment.issue.identifier}`,
          ),
        )
        console.log(`  ID: ${attachment.id}`)
        console.log(`  Title: ${attachment.title}`)
        console.log(`  URL: ${attachment.url}`)
      }
    } catch (err) {
      const error = err as Error
      if (useJson) {
        console.error(
          JSON.stringify(
            {
              success: false,
              error: { code: "API_ERROR", message: error.message },
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
