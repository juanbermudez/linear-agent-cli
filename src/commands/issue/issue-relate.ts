import { Command } from "@cliffy/command"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { getIssueId, getIssueIdentifier } from "../../utils/linear.ts"
import {
  error as errorColor,
  success as successColor,
} from "../../utils/styling.ts"

export const relateCommand = new Command()
  .name("relate")
  .description("Create a relationship between two issues")
  .arguments("<issueId:string> <relatedIssueId:string>")
  .option("--blocks", "This issue blocks the related issue")
  .option("--related-to", "Mark as related (default)")
  .option("--duplicate-of", "Mark as duplicate of the related issue")
  .option("--similar-to", "Mark as similar to the related issue")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options, issueIdArg: string, relatedIssueIdArg: string) => {
    const useJson = options.json || options.format === "json"

    try {
      // Determine relationship type
      let type: "blocks" | "related" | "duplicate" | "similar" = "related"
      if (options.blocks) type = "blocks"
      if (options.duplicateOf) type = "duplicate"
      if (options.similarTo) type = "similar"

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

      const mutation = gql(/* GraphQL */ `
        mutation CreateIssueRelation($input: IssueRelationCreateInput!) {
          issueRelationCreate(input: $input) {
            success
            issueRelation {
              id
              type
              issue {
                id
                identifier
                title
              }
              relatedIssue {
                id
                identifier
                title
              }
            }
          }
        }
      `)

      const client = getGraphQLClient()
      const data = await client.request(mutation, {
        input: {
          issueId,
          relatedIssueId,
          type,
        },
      })

      if (
        !data.issueRelationCreate.success ||
        !data.issueRelationCreate.issueRelation
      ) {
        throw new Error("Failed to create issue relation")
      }

      const relation = data.issueRelationCreate.issueRelation

      if (useJson) {
        console.log(JSON.stringify(
          {
            success: true,
            operation: "relate",
            relation: {
              id: relation.id,
              type: relation.type,
              issue: {
                identifier: relation.issue.identifier,
                title: relation.issue.title,
              },
              relatedIssue: {
                identifier: relation.relatedIssue.identifier,
                title: relation.relatedIssue.title,
              },
            },
          },
          null,
          2,
        ))
      } else {
        console.log(successColor(`✓ Created ${type} relationship`))
        console.log(
          `${relation.issue.identifier} ${type} ${relation.relatedIssue.identifier}`,
        )
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err)
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
