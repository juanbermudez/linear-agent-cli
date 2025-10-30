import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/label/label-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Label Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating a label with flags (happy path)
await snapshotTest({
  name: "Label Create Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "bug",
    "--description",
    "Bug reports and fixes",
    "--team",
    "ENG",
    "--color",
    "#FF0000",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock getTeamIdByKey
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "ENG" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-eng-id" }],
            },
          },
        },
      },
      // Mock createLabel mutation
      {
        queryName: "CreateLabel",
        response: {
          data: {
            issueLabelCreate: {
              success: true,
              issueLabel: {
                id: "label-123",
                name: "bug",
                description: "Bug reports and fixes",
                color: "#FF0000",
                team: {
                  id: "team-eng-id",
                  key: "ENG",
                  name: "Engineering",
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

// Test creating a label with minimal flags
await snapshotTest({
  name: "Label Create Command - Minimal Flags",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "feature",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateLabel",
        response: {
          data: {
            issueLabelCreate: {
              success: true,
              issueLabel: {
                id: "label-456",
                name: "feature",
                description: null,
                color: "#00FF00",
                team: null,
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

// Test creating label without # prefix in color
await snapshotTest({
  name: "Label Create Command - Color Without Hash",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "security",
    "--color",
    "FF6B00",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateLabel",
        response: {
          data: {
            issueLabelCreate: {
              success: true,
              issueLabel: {
                id: "label-789",
                name: "security",
                description: null,
                color: "#FF6B00",
                team: null,
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

// Test error when missing required name
await snapshotTest({
  name: "Label Create Command - Missing Required Name",
  meta: import.meta,
  colors: false,
  args: [
    "--color",
    "#FF0000",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([])

    try {
      await createCommand.parse()
    } catch (_error) {
      // Expected to fail - missing name
    } finally {
      await cleanup()
    }
  },
})

// Test error when team not found
await snapshotTest({
  name: "Label Create Command - Team Not Found",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "test-label",
    "--team",
    "NONEXISTENT",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "NONEXISTENT" },
        response: {
          data: {
            teams: {
              nodes: [],
            },
          },
        },
      },
    ])

    try {
      await createCommand.parse()
    } catch (_error) {
      // Expected to fail - team not found
    } finally {
      await cleanup()
    }
  },
})

// Test non-JSON output format
await snapshotTest({
  name: "Label Create Command - Text Output",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "enhancement",
    "--color",
    "#0000FF",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateLabel",
        response: {
          data: {
            issueLabelCreate: {
              success: true,
              issueLabel: {
                id: "label-text",
                name: "enhancement",
                description: null,
                color: "#0000FF",
                team: null,
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
