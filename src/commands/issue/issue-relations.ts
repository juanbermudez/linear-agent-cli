import { Command } from "@cliffy/command"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { getIssueId, getIssueIdentifier } from "../../utils/linear.ts"
import { error as errorColor, muted } from "../../utils/styling.ts"

export const relationsCommand = new Command()
  .name("relations")
  .description("List all relationships for an issue")
  .arguments("<issueId:string>")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options, issueIdArg: string) => {
    const useJson = options.json || options.format === "json"

    try {
      // Resolve issue identifier
      const issueIdentifier = await getIssueIdentifier(issueIdArg)

      if (!issueIdentifier) {
        const errorMsg = "Could not resolve issue identifier"
        if (useJson) {
          console.error(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_ISSUE_ID",
              message: errorMsg,
            },
          }, null, 2))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // Get issue ID
      const issueId = await getIssueId(issueIdentifier)

      if (!issueId) {
        const errorMsg = "Could not resolve issue ID"
        if (useJson) {
          console.error(JSON.stringify({
            success: false,
            error: {
              code: "INVALID_ISSUE_ID",
              message: errorMsg,
            },
          }, null, 2))
        } else {
          console.error(errorColor(`Error: ${errorMsg}`))
        }
        Deno.exit(1)
      }

      // Fetch issue with relations
      const query = gql(/* GraphQL */ `
        query GetIssueRelations($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            relations {
              nodes {
                id
                type
                relatedIssue {
                  id
                  identifier
                  title
                  state {
                    name
                    type
                  }
                }
              }
            }
            inverseRelations {
              nodes {
                id
                type
                issue {
                  id
                  identifier
                  title
                  state {
                    name
                    type
                  }
                }
              }
            }
          }
        }
      `)

      const client = getGraphQLClient()
      const data = await client.request(query, { id: issueId })

      if (!data.issue) {
        throw new Error(`Issue ${issueIdentifier} not found`)
      }

      const issue = data.issue
      const outgoingRelations = issue.relations.nodes
      const incomingRelations = issue.inverseRelations.nodes

      if (useJson) {
        console.log(JSON.stringify({
          success: true,
          issue: {
            identifier: issue.identifier,
            title: issue.title,
          },
          outgoing: outgoingRelations.map(r => ({
            id: r.id,
            type: r.type,
            relatedIssue: {
              identifier: r.relatedIssue.identifier,
              title: r.relatedIssue.title,
              state: r.relatedIssue.state.name,
            },
          })),
          incoming: incomingRelations.map(r => ({
            id: r.id,
            type: r.type,
            fromIssue: {
              identifier: r.issue.identifier,
              title: r.issue.title,
              state: r.issue.state.name,
            },
          })),
        }, null, 2))
      } else {
        console.log(`\nRelationships for ${issue.identifier}: ${issue.title}`)
        console.log()

        if (outgoingRelations.length === 0 && incomingRelations.length === 0) {
          console.log(muted("No relationships found"))
          return
        }

        if (outgoingRelations.length > 0) {
          console.log("Outgoing relationships:")
          for (const relation of outgoingRelations) {
            const typeLabel = relation.type.charAt(0).toUpperCase() + relation.type.slice(1)
            console.log(`  ${typeLabel}: ${relation.relatedIssue.identifier} - ${relation.relatedIssue.title}`)
            console.log(muted(`    State: ${relation.relatedIssue.state.name}`))
          }
          console.log()
        }

        if (incomingRelations.length > 0) {
          console.log("Incoming relationships:")
          for (const relation of incomingRelations) {
            const typeLabel = relation.type.charAt(0).toUpperCase() + relation.type.slice(1)
            console.log(`  ${typeLabel} by: ${relation.issue.identifier} - ${relation.issue.title}`)
            console.log(muted(`    State: ${relation.issue.state.name}`))
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (useJson) {
        console.error(JSON.stringify({
          success: false,
          error: {
            code: "API_ERROR",
            message: errorMsg,
          },
        }, null, 2))
      } else {
        console.error(errorColor(`Error: ${errorMsg}`))
      }
      Deno.exit(1)
    }
  })
