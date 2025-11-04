import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

interface DeleteOptions {
  confirm?: boolean
  human?: boolean
}

async function deleteIssueAttachment(attachmentId: string) {
  const client = getGraphQLClient()

  // First get the attachment details
  const attachmentQuery = `
    query GetAttachmentDetails($id: String!) {
      attachment(id: $id) {
        id
        title
        url
        issue {
          id
          identifier
          title
        }
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const attachmentData = await client.request<any>(attachmentQuery, {
    id: attachmentId,
  })

  if (!attachmentData.attachment) {
    throw new Error(`Attachment '${attachmentId}' not found`)
  }

  const attachment = attachmentData.attachment

  // Delete the attachment
  const mutation = `
    mutation DeleteAttachment($id: String!) {
      attachmentDelete(id: $id) {
        success
      }
    }
  `

  // deno-lint-ignore no-explicit-any
  const data = await client.request<any>(mutation, { id: attachmentId })

  if (!data.attachmentDelete.success) {
    throw new Error("Failed to delete attachment")
  }

  return attachment
}

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete an attachment from an issue")
  .arguments("<attachmentId:string>")
  .option("-y, --confirm", "Skip confirmation prompt")
  .option("--human", "Output in human-readable format (default: JSON)")
  .action(async (options: DeleteOptions, attachmentId: string) => {
    const useJson = !options.human

    try {
      const client = getGraphQLClient()

      // Get attachment details for confirmation
      const attachmentQuery = `
        query GetAttachmentDetailsForDelete($id: String!) {
          attachment(id: $id) {
            id
            title
            url
            issue {
              identifier
              title
            }
          }
        }
      `

      let attachmentData
      try {
        // deno-lint-ignore no-explicit-any
        attachmentData = await client.request<any>(attachmentQuery, {
          id: attachmentId,
        })
      } catch (_error) {
        const errorMsg = `Attachment '${attachmentId}' not found`
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

      if (!attachmentData?.attachment) {
        const errorMsg = `Attachment '${attachmentId}' not found`
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

      const { title, issue } = attachmentData.attachment

      // Show confirmation prompt unless --confirm flag is used
      if (!options.confirm && !useJson) {
        const confirmed = await Confirm.prompt({
          message:
            `Are you sure you want to delete attachment "${title}" from ${issue.identifier}?`,
          default: false,
        })

        if (!confirmed) {
          console.log("Delete cancelled.")
          return
        }
      }

      const { Spinner } = await import("@std/cli/unstable-spinner")
      const showSpinner = !useJson && Deno.stdout.isTerminal()
      const spinner = showSpinner
        ? new Spinner({ message: "Deleting attachment..." })
        : null
      spinner?.start()

      const deletedAttachment = await deleteIssueAttachment(attachmentId)

      spinner?.stop()

      if (useJson) {
        console.log(
          JSON.stringify(
            {
              success: true,
              operation: "delete",
              attachment: {
                id: deletedAttachment.id,
                title: deletedAttachment.title,
                url: deletedAttachment.url,
                issue: {
                  id: deletedAttachment.issue.id,
                  identifier: deletedAttachment.issue.identifier,
                  title: deletedAttachment.issue.title,
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
            `✓ Attachment "${title}" deleted from ${issue.identifier}`,
          ),
        )
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
