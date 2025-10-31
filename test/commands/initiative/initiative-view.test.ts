import { snapshotTest } from "@cliffy/testing"
import { viewCommand } from "../../../src/commands/initiative/initiative-view.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Initiative View Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await viewCommand.parse()
  },
})

// Test viewing an initiative with details
await snapshotTest({
  name: "Initiative View Command - Full Details",
  meta: import.meta,
  colors: false,
  args: ["init-123", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewInitiative",
        variables: { id: "init-123" },
        response: {
          data: {
            initiative: {
              id: "init-123",
              name: "Q1 2025 Platform Goals",
              slugId: "q1-2025-platform-goals",
              url: "https://linear.app/test/initiative/q1-2025-platform-goals",
              description:
                "Focus on platform stability and performance improvements",
              status: {
                id: "status-active",
                name: "Active",
                type: "started",
              },
              owner: {
                name: "alice",
                displayName: "Alice Smith",
              },
              targetDate: "2025-03-31",
              projects: {
                nodes: [
                  {
                    id: "project-1",
                    name: "API Redesign",
                    slugId: "api-redesign",
                    status: {
                      name: "In Progress",
                      type: "started",
                    },
                  },
                  {
                    id: "project-2",
                    name: "Database Migration",
                    slugId: "database-migration",
                    status: {
                      name: "Planned",
                      type: "planned",
                    },
                  },
                ],
              },
              createdAt: "2024-01-01T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
            },
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test viewing with JSON output
await snapshotTest({
  name: "Initiative View Command - JSON Output",
  meta: import.meta,
  colors: false,
  args: ["init-456", "--json", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewInitiative",
        variables: { id: "init-456" },
        response: {
          data: {
            initiative: {
              id: "init-456",
              name: "API Modernization",
              slugId: "api-modernization",
              url: "https://linear.app/test/initiative/api-modernization",
              description: "Modernize our API infrastructure",
              status: {
                id: "status-planned",
                name: "Planned",
                type: "planned",
              },
              owner: {
                name: "bob",
                displayName: "Bob Jones",
              },
              targetDate: "2025-06-30",
              projects: {
                nodes: [],
              },
              createdAt: "2024-01-05T09:00:00Z",
              updatedAt: "2024-01-10T11:20:00Z",
            },
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test viewing initiative without optional fields
await snapshotTest({
  name: "Initiative View Command - Minimal Fields",
  meta: import.meta,
  colors: false,
  args: ["init-minimal", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewInitiative",
        variables: { id: "init-minimal" },
        response: {
          data: {
            initiative: {
              id: "init-minimal",
              name: "Simple Initiative",
              slugId: "simple-initiative",
              url: "https://linear.app/test/initiative/simple-initiative",
              description: null,
              status: null,
              owner: null,
              targetDate: null,
              projects: {
                nodes: [],
              },
              createdAt: "2024-01-10T15:00:00Z",
              updatedAt: "2024-01-10T15:00:00Z",
            },
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test viewing initiative with many projects
await snapshotTest({
  name: "Initiative View Command - With Multiple Projects",
  meta: import.meta,
  colors: false,
  args: ["init-many-projects", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewInitiative",
        variables: { id: "init-many-projects" },
        response: {
          data: {
            initiative: {
              id: "init-many-projects",
              name: "Platform Modernization",
              slugId: "platform-modernization",
              url: "https://linear.app/test/initiative/platform-modernization",
              description: "Comprehensive platform upgrade",
              status: {
                id: "status-active",
                name: "Active",
                type: "started",
              },
              owner: {
                name: "alice",
                displayName: "Alice Smith",
              },
              targetDate: "2025-12-31",
              projects: {
                nodes: [
                  {
                    id: "project-1",
                    name: "API Redesign",
                    slugId: "api-redesign",
                    status: { name: "In Progress", type: "started" },
                  },
                  {
                    id: "project-2",
                    name: "Database Migration",
                    slugId: "database-migration",
                    status: { name: "Completed", type: "completed" },
                  },
                  {
                    id: "project-3",
                    name: "Frontend Upgrade",
                    slugId: "frontend-upgrade",
                    status: { name: "In Progress", type: "started" },
                  },
                  {
                    id: "project-4",
                    name: "Security Audit",
                    slugId: "security-audit",
                    status: { name: "Planned", type: "planned" },
                  },
                ],
              },
              createdAt: "2024-01-01T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
            },
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test viewing by slug ID
await snapshotTest({
  name: "Initiative View Command - By Slug ID",
  meta: import.meta,
  colors: false,
  args: ["q1-2025-goals", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewInitiative",
        variables: { id: "q1-2025-goals" },
        response: {
          data: {
            initiative: {
              id: "init-789",
              name: "Q1 2025 Goals",
              slugId: "q1-2025-goals",
              url: "https://linear.app/test/initiative/q1-2025-goals",
              description: "Quarterly goals for Q1",
              status: {
                id: "status-active",
                name: "Active",
                type: "started",
              },
              owner: {
                name: "alice",
                displayName: "Alice Smith",
              },
              targetDate: "2025-03-31",
              projects: {
                nodes: [],
              },
              createdAt: "2024-01-01T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
            },
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
