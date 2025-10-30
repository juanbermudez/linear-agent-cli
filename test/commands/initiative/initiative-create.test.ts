import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/initiative/initiative-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Initiative Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating an initiative with flags (happy path)
await snapshotTest({
  name: "Initiative Create Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Q1 2025 Platform Goals",
    "--description",
    "Focus on platform stability and performance",
    "--owner",
    "alice@company.com",
    "--status",
    "planned",
    "--json",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock lookupUserId for owner
      {
        queryName: "LookupUser",
        variables: { input: "alice@company.com" },
        response: {
          data: {
            users: {
              nodes: [{
                id: "user-alice-123",
                email: "alice@company.com",
                displayName: "Alice Smith",
                name: "alice",
              }],
            },
          },
        },
      },
      // Mock listInitiativeStatuses
      {
        queryName: "ListInitiativeStatuses",
        response: {
          data: {
            workflowStates: {
              nodes: [
                { id: "status-planned", name: "Planned", type: "planned" },
                { id: "status-active", name: "Active", type: "started" },
                {
                  id: "status-completed",
                  name: "Completed",
                  type: "completed",
                },
              ],
            },
          },
        },
      },
      // Mock createInitiative mutation
      {
        queryName: "CreateInitiative",
        response: {
          data: {
            initiativeCreate: {
              success: true,
              initiative: {
                id: "init-123",
                name: "Q1 2025 Platform Goals",
                slugId: "q1-2025-platform-goals",
                url:
                  "https://linear.app/test/initiative/q1-2025-platform-goals",
                description: "Focus on platform stability and performance",
                status: {
                  id: "status-planned",
                  name: "Planned",
                  type: "planned",
                },
                owner: {
                  id: "user-alice-123",
                  name: "alice",
                  displayName: "Alice Smith",
                },
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ])

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test creating an initiative with minimal flags
await snapshotTest({
  name: "Initiative Create Command - Minimal Flags",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Q2 Goals",
    "--json",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateInitiative",
        response: {
          data: {
            initiativeCreate: {
              success: true,
              initiative: {
                id: "init-456",
                name: "Q2 Goals",
                slugId: "q2-goals",
                url: "https://linear.app/test/initiative/q2-goals",
                description: null,
                status: null,
                owner: null,
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ])

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test creating initiative with target date
await snapshotTest({
  name: "Initiative Create Command - With Target Date",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Q1 Goals",
    "--target-date",
    "2025-03-31",
    "--json",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateInitiative",
        response: {
          data: {
            initiativeCreate: {
              success: true,
              initiative: {
                id: "init-789",
                name: "Q1 Goals",
                slugId: "q1-goals",
                url: "https://linear.app/test/initiative/q1-goals",
                description: null,
                status: null,
                owner: null,
                targetDate: "2025-03-31",
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ])

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test non-JSON output format
await snapshotTest({
  name: "Initiative Create Command - Text Output",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Platform Initiative",
    "--no-color",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateInitiative",
        response: {
          data: {
            initiativeCreate: {
              success: true,
              initiative: {
                id: "init-text",
                name: "Platform Initiative",
                slugId: "platform-initiative",
                url: "https://linear.app/test/initiative/platform-initiative",
                description: null,
                status: null,
                owner: null,
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ])

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
