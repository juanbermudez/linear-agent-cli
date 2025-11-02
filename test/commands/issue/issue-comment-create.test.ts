import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/issue/issue-comment-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Comment Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating a comment
await snapshotTest({
  name: "Issue Comment Create Command - Success",
  meta: import.meta,
  colors: false,
  args: ["ENG-123", "--body", "This looks good to me"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for getting issue ID
      {
        queryName: "GetIssueIdForComment",
        variables: { id: "ENG-123" },
        response: {
          data: {
            issue: {
              id: "issue-123-uuid",
              identifier: "ENG-123",
              title: "Fix authentication bug",
            },
          },
        },
      },
      // Mock response for creating comment
      {
        queryName: "CreateComment",
        variables: {
          issueId: "issue-123-uuid",
          body: "This looks good to me",
        },
        response: {
          data: {
            commentCreate: {
              success: true,
              comment: {
                id: "comment-new-789",
                body: "This looks good to me",
                createdAt: "2025-01-01T15:00:00Z",
                user: {
                  id: "user-self",
                  name: "currentuser",
                  displayName: "Current User",
                },
                issue: {
                  id: "issue-123-uuid",
                  identifier: "ENG-123",
                  title: "Fix authentication bug",
                },
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

// Note: Error case tests (missing body, issue not found) are omitted from snapshots
// because Deno.exit() in error handlers prevents snapshot capture
