import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { bold, dim } from "@std/fmt/colors"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { readCache, writeCache } from "../../utils/cache.ts"

const usersQuery = gql(/* GraphQL */ `
  query ListAllUsers {
    users {
      nodes {
        id
        name
        displayName
        email
        admin
        active
      }
    }
  }
`)

interface User {
  id: string
  name: string
  displayName: string
  email: string
  admin: boolean
  active: boolean
}

export const listCommand = new Command()
  .name("list")
  .description("List all users in the workspace")
  .option("--json", "Output as JSON")
  .option("--refresh", "Bypass cache and fetch fresh data")
  .option("--active-only", "Show only active users")
  .option("--admins-only", "Show only admin users")
  .action(async ({ json, refresh, activeOnly, adminsOnly }) => {
    try {
      let users: User[]

      // Try cache first
      if (!refresh) {
        const cached = await readCache<User[]>("users-workspace")
        if (cached) {
          users = cached
        } else {
          // Fetch from API
          const client = getGraphQLClient()
          const data = await client.request(usersQuery)
          users = data.users.nodes as User[]

          // Cache the results
          await writeCache("users-workspace", users)
        }
      } else {
        // Force refresh
        const client = getGraphQLClient()
        const data = await client.request(usersQuery)
        users = data.users.nodes as User[]

        // Update cache
        await writeCache("users-workspace", users)
      }

      // Apply filters
      if (activeOnly) {
        users = users.filter(u => u.active)
      }

      if (adminsOnly) {
        users = users.filter(u => u.admin)
      }

      // Sort by display name
      users.sort((a, b) => a.displayName.localeCompare(b.displayName))

      if (json) {
        console.log(JSON.stringify({
          users,
          count: users.length,
        }, null, 2))
        return
      }

      // Text output
      const table = new Table()
        .header([
          bold("Display Name"),
          bold("Email"),
          bold("Status"),
          bold("Admin"),
          bold("ID"),
        ])
        .body(users.map((user) => [
          user.displayName,
          user.email,
          user.active ? "Active" : dim("Inactive"),
          user.admin ? "✓" : "",
          dim(user.id),
        ]))

      table.border(true)
      table.render()

      console.log(`\n${dim(`Showing ${users.length} user(s)`)}`)

    } catch (error) {
      if (json) {
        console.log(JSON.stringify({
          error: "Failed to fetch users",
          message: error instanceof Error ? error.message : String(error),
        }, null, 2))
      } else {
        console.error("Failed to fetch users:", error)
      }
      Deno.exit(1)
    }
  })
