import { snapshotTest } from "@cliffy/testing"
import { listCommand } from "../../../src/commands/initiative/initiative-list.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Initiative List Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await listCommand.parse()
  },
})

// Test listing all initiatives
await snapshotTest({
  name: "Initiative List Command - All Initiatives",
  meta: import.meta,
  colors: false,
  args: ["--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetInitiatives",
        response: {
          data: {
            initiatives: {
              nodes: [
                {
                  id: "init-1",
                  name: "Q1 2025 Platform Goals",
                  slugId: "q1-2025-platform-goals",
                  url:
                    "https://linear.app/test/initiative/q1-2025-platform-goals",
                  description: "Focus on platform stability and performance",
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
                  createdAt: "2024-01-01T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
                {
                  id: "init-2",
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
                  createdAt: "2024-01-05T09:00:00Z",
                  updatedAt: "2024-01-10T11:20:00Z",
                },
                {
                  id: "init-3",
                  name: "Customer Experience Improvements",
                  slugId: "customer-experience-improvements",
                  url:
                    "https://linear.app/test/initiative/customer-experience-improvements",
                  description: null,
                  status: null,
                  owner: null,
                  targetDate: null,
                  createdAt: "2024-01-10T15:00:00Z",
                  updatedAt: "2024-01-10T15:00:00Z",
                },
              ],
            },
          },
        },
      },
    ])

    try {
      await listCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test listing with JSON output
await snapshotTest({
  name: "Initiative List Command - JSON Output",
  meta: import.meta,
  colors: false,
  args: ["--json", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetInitiatives",
        response: {
          data: {
            initiatives: {
              nodes: [
                {
                  id: "init-1",
                  name: "Q1 2025 Platform Goals",
                  slugId: "q1-2025-platform-goals",
                  url:
                    "https://linear.app/test/initiative/q1-2025-platform-goals",
                  description: "Focus on platform stability",
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
                  createdAt: "2024-01-01T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
              ],
            },
          },
        },
      },
    ])

    try {
      await listCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test filtering by status
await snapshotTest({
  name: "Initiative List Command - Filter By Status",
  meta: import.meta,
  colors: false,
  args: ["--status", "started", "--json", "--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetInitiatives",
        variables: { filter: { status: { type: { eq: "started" } } } },
        response: {
          data: {
            initiatives: {
              nodes: [
                {
                  id: "init-1",
                  name: "Q1 2025 Platform Goals",
                  slugId: "q1-2025-platform-goals",
                  url:
                    "https://linear.app/test/initiative/q1-2025-platform-goals",
                  description: "Focus on platform stability",
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
                  createdAt: "2024-01-01T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
              ],
            },
          },
        },
      },
    ])

    try {
      await listCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test empty initiative list
await snapshotTest({
  name: "Initiative List Command - No Initiatives Found",
  meta: import.meta,
  colors: false,
  args: ["--no-color"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetInitiatives",
        response: {
          data: {
            initiatives: {
              nodes: [],
            },
          },
        },
      },
    ])

    try {
      await listCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
