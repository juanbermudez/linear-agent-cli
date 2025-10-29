import { Command } from "@cliffy/command"
import { renderMarkdown } from "@littletof/charmd"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { formatRelativeTime } from "../../utils/display.ts"
import { openProjectPage } from "../../utils/actions.ts"

const GetProjectDetails = gql(`
  query GetProjectDetails($id: String!) {
    project(id: $id) {
      id
      name
      description
      slugId
      icon
      color
      status {
        id
        name
        color
      }
      creator {
        name
        displayName
      }
      lead {
        name
        displayName
      }
      priority
      health
      startDate
      targetDate
      startedAt
      completedAt
      canceledAt
      updatedAt
      createdAt
      url
      teams {
        nodes {
          id
          key
          name
        }
      }
      issues {
        nodes {
          id
          identifier
          title
          state {
            name
            type
          }
        }
      }
      lastUpdate {
        id
        body
        health
        createdAt
        user {
          name
          displayName
        }
      }
    }
  }
`)

export const viewCommand = new Command()
  .name("view")
  .description("View project details")
  .alias("v")
  .arguments("<projectId:string>")
  .option("-w, --web", "Open in web browser")
  .option("-a, --app", "Open in Linear.app")
  .option("-j, --json", "Output result as JSON")
  .option("--format <format:string>", "Output format: text|json")
  .action(async (options, projectId) => {
    const { web, app, json, format } = options
    const useJson = json || format === "json"

    if (web || app) {
      await openProjectPage(projectId, { app, web: !app })
      return
    }

    const { Spinner } = await import("@std/cli/unstable-spinner")
    const showSpinner = !useJson && Deno.stdout.isTerminal()
    const spinner = showSpinner ? new Spinner() : null
    spinner?.start()

    try {
      const client = getGraphQLClient()
      const result = await client.request(GetProjectDetails, { id: projectId })
      spinner?.stop()

      const project = result.project
      if (!project) {
        const errorMsg = `Project with ID "${projectId}" not found.`
        if (useJson) {
          console.error(
            JSON.stringify({
              success: false,
              error: { code: "NOT_FOUND", message: errorMsg },
            }, null, 2),
          )
        } else {
          console.error(errorMsg)
        }
        Deno.exit(1)
      }

      if (useJson) {
        // Calculate issue summary
        const issuesByState = project.issues.nodes.reduce(
          (acc: Record<string, number>, issue) => {
            const stateType = issue.state.type
            if (!acc[stateType]) acc[stateType] = 0
            acc[stateType]++
            return acc
          },
          {} as Record<string, number>,
        )

        console.log(
          JSON.stringify({
            project: {
              id: project.id,
              name: project.name,
              slugId: project.slugId,
              description: project.description,
              url: project.url,
              icon: project.icon,
              color: project.color,
              status: {
                id: project.status.id,
                name: project.status.name,
                color: project.status.color,
              },
              creator: project.creator
                ? {
                  name: project.creator.name,
                  displayName: project.creator.displayName,
                }
                : null,
              lead: project.lead
                ? {
                  name: project.lead.name,
                  displayName: project.lead.displayName,
                }
                : null,
              priority: project.priority,
              health: project.health,
              startDate: project.startDate,
              targetDate: project.targetDate,
              startedAt: project.startedAt,
              completedAt: project.completedAt,
              canceledAt: project.canceledAt,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              teams: project.teams.nodes.map((t) => ({
                id: t.id,
                key: t.key,
                name: t.name,
              })),
              issuesSummary: {
                total: project.issues.nodes.length,
                byState: issuesByState,
              },
              lastUpdate: project.lastUpdate
                ? {
                  id: project.lastUpdate.id,
                  health: project.lastUpdate.health,
                  bodyPreview: project.lastUpdate.body.substring(0, 200),
                  createdAt: project.lastUpdate.createdAt,
                  author: {
                    name: project.lastUpdate.user.name,
                    displayName: project.lastUpdate.user.displayName,
                  },
                }
                : null,
            },
          }, null, 2),
        )
        return
      }

      // Build the display
      const lines: string[] = []

      // Title with icon and color
      const icon = project.icon ? `${project.icon} ` : ""
      lines.push(`# ${icon}${project.name}`)
      lines.push("")

      // Basic info
      lines.push(`**Slug:** ${project.slugId}`)
      lines.push(`**URL:** ${project.url}`)

      // Status with color styling
      const statusLine = `**Status:** ${project.status.name}`
      if (Deno.stdout.isTerminal()) {
        console.log(`%c${statusLine}%c`, `color: ${project.status.color}`, "")
      } else {
        lines.push(statusLine)
      }

      // Priority
      const priorityMap = {
        0: "None",
        1: "Urgent",
        2: "High",
        3: "Medium",
        4: "Low",
      }
      const priority =
        priorityMap[project.priority as keyof typeof priorityMap] || "None"
      lines.push(`**Priority:** ${priority}`)

      // Health
      if (project.health) {
        lines.push(`**Health:** ${project.health}`)
      }

      // People
      if (project.creator) {
        lines.push(
          `**Creator:** ${project.creator.displayName || project.creator.name}`,
        )
      }
      if (project.lead) {
        lines.push(
          `**Lead:** ${project.lead.displayName || project.lead.name}`,
        )
      }

      // Dates
      if (project.startDate) {
        lines.push(`**Start Date:** ${project.startDate}`)
      }
      if (project.targetDate) {
        lines.push(`**Target Date:** ${project.targetDate}`)
      }
      if (project.startedAt) {
        lines.push(`**Started At:** ${formatRelativeTime(project.startedAt)}`)
      }
      if (project.completedAt) {
        lines.push(
          `**Completed At:** ${formatRelativeTime(project.completedAt)}`,
        )
      }
      if (project.canceledAt) {
        lines.push(
          `**Canceled At:** ${formatRelativeTime(project.canceledAt)}`,
        )
      }

      // Teams
      if (project.teams.nodes.length > 0) {
        const teamList = project.teams.nodes
          .map((team) => `${team.name} (${team.key})`)
          .join(", ")
        lines.push(`**Teams:** ${teamList}`)
      }

      lines.push("")
      lines.push(`**Created:** ${formatRelativeTime(project.createdAt)}`)
      lines.push(`**Updated:** ${formatRelativeTime(project.updatedAt)}`)

      // Description
      if (project.description) {
        lines.push("")
        lines.push("## Description")
        lines.push("")
        lines.push(project.description)
      }

      // Latest update
      if (project.lastUpdate) {
        lines.push("")
        lines.push("## Latest Update")
        lines.push("")
        const update = project.lastUpdate
        lines.push(`**By:** ${update.user.displayName || update.user.name}`)
        lines.push(`**When:** ${formatRelativeTime(update.createdAt)}`)
        if (update.health) {
          lines.push(`**Health:** ${update.health}`)
        }
        lines.push("")
        lines.push(update.body)
      }

      // Issue summary
      if (project.issues.nodes.length > 0) {
        lines.push("")
        lines.push("## Issues Summary")
        lines.push("")

        const issuesByState = project.issues.nodes.reduce(
          (acc: Record<string, number>, issue) => {
            const stateType = issue.state.type
            if (!acc[stateType]) acc[stateType] = 0
            acc[stateType]++
            return acc
          },
          {} as Record<string, number>,
        )

        const total = project.issues.nodes.length
        const completed = issuesByState.completed || 0
        const started = issuesByState.started || 0
        const unstarted = issuesByState.unstarted || 0
        const canceled = issuesByState.canceled || 0
        const backlog = issuesByState.backlog || 0
        const triage = issuesByState.triage || 0

        lines.push(`**Total Issues:** ${total}`)
        if (completed > 0) lines.push(`**Completed:** ${completed}`)
        if (started > 0) lines.push(`**In Progress:** ${started}`)
        if (unstarted > 0) lines.push(`**To Do:** ${unstarted}`)
        if (backlog > 0) lines.push(`**Backlog:** ${backlog}`)
        if (triage > 0) lines.push(`**Triage:** ${triage}`)
        if (canceled > 0) lines.push(`**Canceled:** ${canceled}`)
      }

      const markdown = lines.join("\n")

      if (Deno.stdout.isTerminal()) {
        const terminalWidth = Deno.consoleSize().columns
        console.log(renderMarkdown(markdown, { lineWidth: terminalWidth }))
      } else {
        console.log(markdown)
      }
    } catch (error) {
      spinner?.stop()
      const errorMsg = `Failed to fetch project details: ${error}`
      if (useJson) {
        console.error(
          JSON.stringify({
            success: false,
            error: { code: "API_ERROR", message: errorMsg },
          }, null, 2),
        )
      } else {
        console.error(errorMsg)
      }
      Deno.exit(1)
    }
  })
