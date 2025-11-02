import { Command } from "@cliffy/command"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { getIssueId, getIssueIdentifier } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

export const unrelateCommand = new Command()
  .name("unrelate")
  .description("Remove a relationship between two issues")
  .arguments("<issueId:string> <relatedIssueId:string>")
  .option("--human", "Output in human-readable format (default: JSON)")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options, issueIdArg: string, relatedIssueIdArg: string) => {
    const useJson = !options.human && options.format !== "text"

    try {
      // Resolve issue identifiers
      const issueIdentifier = await getIssueIdentifier(issueIdArg)
      const relatedIssueIdentifier = await getIssueIdentifier(relatedIssueIdArg)

      if (!issueIdentifier || !relatedIssueIdentifier) {
        const errorMsg = "Could not resolve issue identifiers"
        if (useJson) {
          console.error(JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_ISSUE_ID",
                message: errorMsg,
              },
            },
            null,
            2,
          ))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // Get issue IDs
      const issueId = await getIssueId(issueIdentifier)
      const relatedIssueId = await getIssueId(relatedIssueIdentifier)

      if (!issueId || !relatedIssueId) {
        const errorMsg = "Could not resolve issue IDs"
        if (useJson) {
          console.error(JSON.stringify(
            {
              success: false,
              error: {
                code: "INVALID_ISSUE_ID",
                message: errorMsg,
              },
            },
            null,
            2,
          ))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // First, fetch the issue to find the relation ID
      const issueQuery = gql(/* GraphQL */ `
        query GetIssueRelationsForDelete($id: String!) {
          issue(id: $id) {
            id
            identifier
            relations {
              nodes {
                id
                type
                relatedIssue {
                  id
                  identifier
                }
              }
            }
          }
        }
      `)

      const client = getGraphQLClient()
      const issueData = await client.request(issueQuery, { id: issueId })

      if (!issueData.issue) {
        throw new Error(`Issue ${issueIdentifier} not found`)
      }

      // Find the relation ID
      const relation = issueData.issue.relations.nodes.find(
        (r) => r.relatedIssue.id === relatedIssueId,
      )

      if (!relation) {
        const errorMsg =
          `No relationship found between ${issueIdentifier} and ${relatedIssueIdentifier}`
        if (useJson) {
          console.error(JSON.stringify(
            {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: errorMsg,
              },
            },
            null,
            2,
          ))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // Delete the relation
      const mutation = gql(/* GraphQL */ `
        mutation DeleteIssueRelation($id: String!) {
          issueRelationDelete(id: $id) {
            success
          }
        }
      `)

      const data = await client.request(mutation, { id: relation.id })

      if (!data.issueRelationDelete.success) {
        throw new Error("Failed to delete issue relation")
      }

      if (useJson) {
        console.log(JSON.stringify(
          {
            success: true,
            operation: "unrelate",
            message:
              `Removed relationship between ${issueIdentifier} and ${relatedIssueIdentifier}`,
          },
          null,
          2,
        ))
      } else {
        console.log(successColor(`✓ Removed relationship`))
        console.log(
          `${issueIdentifier} and ${relatedIssueIdentifier} are no longer related`,
        )
      }
    } catch (err) {
      const errorMsg = err instanceof Error
        ? (err as Error).message
        : String(err)
      if (useJson) {
        console.error(JSON.stringify(
          {
            success: false,
            error: {
              code: "API_ERROR",
              message: errorMsg,
            },
          },
          null,
          2,
        ))
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  })
