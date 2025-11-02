import { Command } from "@cliffy/command"
import { bold, cyan, dim, green } from "@std/fmt/colors"
import { gql } from "../__codegen__/gql.ts"
import { getGraphQLClient } from "../utils/graphql.ts"
import { getOption } from "../config.ts"

const viewerQuery = gql(/* GraphQL */ `
  query GetViewerInfo {
    viewer {
      id
      name
      displayName
      email
      admin
      organization {
        id
        name
        urlKey
      }
    }
  }
`)

export const whoamiCommand = new Command()
  .name("whoami")
  .description("Display current user and configuration information")
  .option("--human", "Output in human-readable format (default: JSON)")
  .action(async ({ human }) => {
    const json = !human
    try {
      const client = getGraphQLClient()
      const data = await client.request(viewerQuery)
      const viewer = data.viewer

      // Get configuration
      const workspace = getOption("workspace")
      const teamId = getOption("team_id")
      const cacheEnabled = getOption("cache_enabled")
      const autoBranch = getOption("auto_branch")

      // Determine configuration source
      const hasEnvKey = !!Deno.env.get("LINEAR_API_KEY")
      const hasEnvWorkspace = !!Deno.env.get("LINEAR_WORKSPACE")
      const hasEnvTeam = !!Deno.env.get("LINEAR_TEAM_ID")

      if (json) {
        console.log(JSON.stringify(
          {
            user: {
              id: viewer.id,
              name: viewer.name,
              displayName: viewer.displayName,
              email: viewer.email,
              admin: viewer.admin,
            },
            organization: {
              id: viewer.organization.id,
              name: viewer.organization.name,
              urlKey: viewer.organization.urlKey,
            },
            configuration: {
              workspace: workspace || null,
              teamId: teamId || null,
              cacheEnabled: cacheEnabled !== false,
              autoBranch: autoBranch !== false,
              configSources: {
                apiKey: hasEnvKey ? "environment" : "config_file",
                workspace: hasEnvWorkspace ? "environment" : "config_file",
                teamId: hasEnvTeam ? "environment" : "config_file",
              },
            },
          },
          null,
          2,
        ))
        return
      }

      // Text output
      console.log("")
      console.log(bold(green("Current User")))
      console.log(`  Name:         ${viewer.displayName}`)
      console.log(`  Email:        ${viewer.email}`)
      console.log(`  ID:           ${dim(viewer.id)}`)
      console.log(`  Admin:        ${viewer.admin ? green("Yes") : "No"}`)
      console.log("")

      console.log(bold(cyan("Organization")))
      console.log(`  Name:         ${viewer.organization.name}`)
      console.log(`  Workspace:    ${viewer.organization.urlKey}`)
      console.log(
        `  URL:          ${
          dim(`https://linear.app/${viewer.organization.urlKey}`)
        }`,
      )
      console.log("")

      console.log(bold(cyan("Configuration")))
      console.log(`  Workspace:    ${workspace || dim("(not set)")}`)
      console.log(`  Team ID:      ${teamId || dim("(not set)")}`)
      console.log(
        `  Cache:        ${
          cacheEnabled !== false ? green("enabled") : "disabled"
        }`,
      )
      console.log(
        `  Auto-branch:  ${
          autoBranch !== false ? green("enabled") : "disabled"
        }`,
      )
      console.log("")

      console.log(bold(cyan("Config Sources")))
      console.log(
        `  API Key:      ${hasEnvKey ? "environment" : "config file"}`,
      )
      console.log(
        `  Workspace:    ${
          hasEnvWorkspace
            ? "environment"
            : workspace
            ? "config file"
            : dim("(not set)")
        }`,
      )
      console.log(
        `  Team ID:      ${
          hasEnvTeam ? "environment" : teamId ? "config file" : dim("(not set)")
        }`,
      )
      console.log("")
    } catch (error) {
      if (json) {
        console.log(JSON.stringify(
          {
            error: "Failed to fetch user information",
            message: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ))
      } else {
        console.error("Failed to fetch user information:", error)
      }
      Deno.exit(1)
    }
  })
