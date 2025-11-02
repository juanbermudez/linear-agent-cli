import { snapshotTest } from "@cliffy/testing"
import { listCommand } from "../../../src/commands/issue/issue-comment-list.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Comment List Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await listCommand.parse()
  },
})

// Test listing comments on an issue
await snapshotTest({
  name: "Issue Comment List Command - With Comments",
  meta: import.meta,
  colors: false,
  args: ["ENG-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for listing comments
      {
        queryName: "GetIssueComments",
        variables: { id: "ENG-123", first: 50 },
        response: {
          data: {
            issue: {
              id: "issue-123-uuid",
              identifier: "ENG-123",
              title: "Fix authentication bug",
              comments: {
                nodes: [
                  {
                    id: "comment-1",
                    body: "I can reproduce this issue",
                    createdAt: "2025-01-01T12:00:00Z",
                    editedAt: null,
                    user: {
                      id: "user-1",
                      name: "alice",
                      displayName: "Alice Smith",
                    },
                    externalUser: null,
                    parent: null,
                  },
                  {
                    id: "comment-2",
                    body: "Working on a fix now",
                    createdAt: "2025-01-01T13:00:00Z",
                    editedAt: null,
                    user: {
                      id: "user-2",
                      name: "bob",
                      displayName: "Bob Johnson",
                    },
                    externalUser: null,
                    parent: null,
                  },
                  {
                    id: "comment-3",
                    body: "Thanks for looking into this!",
                    createdAt: "2025-01-01T14:00:00Z",
                    editedAt: null,
                    user: {
                      id: "user-1",
                      name: "alice",
                      displayName: "Alice Smith",
                    },
                    externalUser: null,
                    parent: {
                      id: "comment-2",
                    },
                  },
                ],
              },
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

// Test listing comments on an issue with no comments
await snapshotTest({
  name: "Issue Comment List Command - No Comments",
  meta: import.meta,
  colors: false,
  args: ["ENG-456"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueComments",
        variables: { id: "ENG-456", first: 50 },
        response: {
          data: {
            issue: {
              id: "issue-456-uuid",
              identifier: "ENG-456",
              title: "Implement feature X",
              comments: {
                nodes: [],
              },
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

// Note: Error case tests (issue not found) are omitted from snapshots
// because Deno.exit() in error handlers prevents snapshot capture
