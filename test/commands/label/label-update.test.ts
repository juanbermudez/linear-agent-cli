import { snapshotTest } from "@cliffy/testing"
import { updateCommand } from "../../../src/commands/label/label-update.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Label Update Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await updateCommand.parse()
  },
})

// Test updating a label with basic fields (happy path)
await snapshotTest({
  name: "Label Update Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "label-123",
    "--name",
    "Updated Bug",
    "--description",
    "Updated description",
    "--color",
    "#00FF00",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for the update label mutation
      {
        queryName: "UpdateLabel",
        variables: {
          id: "label-123",
          input: {
            name: "Updated Bug",
            description: "Updated description",
            color: "#00FF00",
          },
        },
        response: {
          data: {
            issueLabelUpdate: {
              success: true,
              issueLabel: {
                id: "label-123",
                name: "Updated Bug",
                description: "Updated description",
                color: "#00FF00",
                team: {
                  id: "team-eng-id",
                  key: "ENG",
                  name: "Engineering",
                },
                parent: null,
              },
            },
          },
        },
      },
    ])

    try {
      await updateCommand.parse()
    } finally {
      cleanup()
    }
  },
})

// Test updating label with parent assignment
await snapshotTest({
  name: "Label Update Command - Assign Parent",
  meta: import.meta,
  colors: false,
  args: [
    "label-child-123",
    "--parent",
    "label-parent-456",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for updating label with parent
      {
        queryName: "UpdateLabel",
        variables: {
          id: "label-child-123",
          input: {
            parentId: "label-parent-456",
          },
        },
        response: {
          data: {
            issueLabelUpdate: {
              success: true,
              issueLabel: {
                id: "label-child-123",
                name: "Frontend",
                description: "Frontend work",
                color: "#FF6B6B",
                team: {
                  id: "team-eng-id",
                  key: "ENG",
                  name: "Engineering",
                },
                parent: {
                  id: "label-parent-456",
                  name: "Scope",
                },
              },
            },
          },
        },
      },
    ])

    try {
      await updateCommand.parse()
    } finally {
      cleanup()
    }
  },
})

// Test error when no fields provided
await snapshotTest({
  name: "Label Update Command - No Fields Error",
  meta: import.meta,
  colors: false,
  args: ["label-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    try {
      await updateCommand.parse()
    } catch (error) {
      // Expected error
      console.error((error as Error).message)
    }
  },
})

// Test error with invalid color format
await snapshotTest({
  name: "Label Update Command - Invalid Color",
  meta: import.meta,
  colors: false,
  args: [
    "label-123",
    "--color",
    "red",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    try {
      await updateCommand.parse()
    } catch (error) {
      // Expected error
      console.error((error as Error).message)
    }
  },
})
