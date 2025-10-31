import { Command } from "@cliffy/command"
import { Table } from "@cliffy/table"
import { bold, dim } from "@std/fmt/colors"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { readCache, writeCache } from "../../utils/cache.ts"

const usersQuery = gql(/* GraphQL */ `
  query SearchAllUsers {
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

export const searchCommand = new Command()
  .name("search")
  .description("Search for users by name or email")
  .arguments("<query:string>")
  .option("--json", "Output as JSON")
  .option("--refresh", "Bypass cache and fetch fresh data")
  .option("--active-only", "Show only active users")
  .action(async ({ json, refresh, activeOnly }, query: string) => {
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
        users = users.filter((u) => u.active)
      }

      // Search filter
      const searchLower = query.toLowerCase()
      const matchedUsers = users.filter((user) =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower)
      )

      // Sort by display name
      matchedUsers.sort((a, b) => a.displayName.localeCompare(b.displayName))

      if (json) {
        console.log(JSON.stringify(
          {
            users: matchedUsers,
            count: matchedUsers.length,
            query,
          },
          null,
          2,
        ))
        return
      }

      // Text output
      if (matchedUsers.length === 0) {
        console.log(`No users found matching "${query}"`)
        return
      }

      const table = new Table()
        .header([
          bold("Display Name"),
          bold("Email"),
          bold("Status"),
          bold("Admin"),
          bold("ID"),
        ])
        .body(matchedUsers.map((user) => [
          user.displayName,
          user.email,
          user.active ? "Active" : dim("Inactive"),
          user.admin ? "✓" : "",
          dim(user.id),
        ]))

      table.border(true)
      table.render()

      console.log(
        `\n${dim(`Found ${matchedUsers.length} user(s) matching "${query}"`)}`,
      )
    } catch (error) {
      if (json) {
        console.log(JSON.stringify(
          {
            error: "Failed to search users",
            message: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ))
      } else {
        console.error("Failed to search users:", error)
      }
      Deno.exit(1)
    }
  })
