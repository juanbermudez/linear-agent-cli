import { snapshotTest } from "@cliffy/testing"
import { listCommand } from "../../../src/commands/label/label-list.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Label List Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await listCommand.parse()
  },
})

// Test listing all labels
await snapshotTest({
  name: "Label List Command - All Labels",
  meta: import.meta,
  colors: false,
  args: ["--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListLabels",
        response: {
          data: {
            issueLabels: {
              nodes: [
                {
                  id: "label-1",
                  name: "bug",
                  description: "Bug reports and fixes",
                  color: "#FF0000",
                  team: {
                    id: "team-eng",
                    key: "ENG",
                    name: "Engineering",
                  },
                  createdAt: "2024-01-10T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
                {
                  id: "label-2",
                  name: "feature",
                  description: "New features",
                  color: "#00FF00",
                  team: {
                    id: "team-product",
                    key: "PROD",
                    name: "Product",
                  },
                  createdAt: "2024-01-12T09:00:00Z",
                  updatedAt: "2024-01-12T09:00:00Z",
                },
                {
                  id: "label-3",
                  name: "documentation",
                  description: null,
                  color: "#0000FF",
                  team: null,
                  createdAt: "2024-01-14T15:00:00Z",
                  updatedAt: "2024-01-14T15:00:00Z",
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
  name: "Label List Command - JSON Output",
  meta: import.meta,
  colors: false,
  args: ["--json", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListLabels",
        response: {
          data: {
            issueLabels: {
              nodes: [
                {
                  id: "label-1",
                  name: "bug",
                  description: "Bug reports",
                  color: "#FF0000",
                  team: {
                    id: "team-eng",
                    key: "ENG",
                    name: "Engineering",
                  },
                  createdAt: "2024-01-10T10:00:00Z",
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

// Test empty label list
await snapshotTest({
  name: "Label List Command - No Labels Found",
  meta: import.meta,
  colors: false,
  args: ["--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListLabels",
        response: {
          data: {
            issueLabels: {
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

