import { snapshotTest } from "@cliffy/testing"
import { viewCommand } from "../../../src/commands/issue/issue-view.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue View Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await viewCommand.parse()
  },
})

// Test viewing an issue with proper mock server
await snapshotTest({
  name: "Issue View Command - With Issue ID",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetailsWithComments",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug",
              branchName: "fix/test-123-auth-bug",
              identifier: "TEST-123",
              priority: 1,
              estimate: 3,
              dueDate: null,
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
              assignee: {
                id: "user-1",
                name: "alice",
                displayName: "Alice Smith",
              },
              state: {
                id: "state-1",
                name: "In Progress",
                type: "started",
              },
              team: {
                key: "TEST",
                name: "Test Team",
              },
              project: null,
              projectMilestone: null,
              cycle: null,
              parent: null,
              children: {
                nodes: [],
              },
              relations: {
                nodes: [],
              },
              inverseRelations: {
                nodes: [],
              },
              labels: {
                nodes: [],
              },
              comments: {
                nodes: [],
              },
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

// Test with working mock server - Terminal output (no comments available)
await snapshotTest({
  name: "Issue View Command - With Mock Server Terminal No Comments",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetailsWithComments",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires. This affects the main authentication flow and needs to be resolved quickly.\n\n## Steps to reproduce\n1. Log in to the application\n2. Wait for session to expire\n3. Try to perform an authenticated action\n4. Observe the error\n\n## Expected behavior\nUser should be redirected to login page with clear messaging.\n\n## Actual behavior\nUser sees cryptic error message and gets stuck.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug-in-login-flow",
              branchName: "fix/test-123-auth-bug",
              comments: {
                nodes: [],
              },
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

// Test with no-comments flag to disable comments
await snapshotTest({
  name: "Issue View Command - With No Comments Flag",
  meta: import.meta,
  colors: false,
  args: ["TEST-123", "--no-comments"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetails",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug-in-login-flow",
              branchName: "fix/test-123-auth-bug",
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

// Test with comments (default behavior)
await snapshotTest({
  name: "Issue View Command - With Comments Default",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetailsWithComments",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug-in-login-flow",
              branchName: "fix/test-123-auth-bug",
              comments: {
                nodes: [
                  {
                    id: "comment-1",
                    body:
                      "I've reproduced this issue on staging. The session timeout seems to be too aggressive.",
                    createdAt: "2024-01-15T10:30:00Z",
                    user: {
                      name: "john.doe",
                      displayName: "John Doe",
                    },
                    externalUser: null,
                    parent: null,
                  },
                  {
                    id: "comment-2",
                    body:
                      "Working on a fix. Will increase the session timeout and add proper error handling.",
                    createdAt: "2024-01-15T14:22:00Z",
                    user: {
                      name: "jane.smith",
                      displayName: "Jane Smith",
                    },
                    externalUser: null,
                    parent: {
                      id: "comment-1",
                    },
                  },
                  {
                    id: "comment-3",
                    body:
                      "Sounds good! Also, we should add better error messaging for expired sessions.",
                    createdAt: "2024-01-15T15:10:00Z",
                    user: {
                      name: "alice.dev",
                      displayName: "Alice Developer",
                    },
                    externalUser: null,
                    parent: {
                      id: "comment-1",
                    },
                  },
                  {
                    id: "comment-4",
                    body:
                      "Should we also consider implementing automatic session refresh?",
                    createdAt: "2024-01-15T16:00:00Z",
                    user: {
                      name: "bob.senior",
                      displayName: "Bob Senior",
                    },
                    externalUser: null,
                    parent: null,
                  },
                ],
              },
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

// Test with mock server - Issue not found
await snapshotTest({
  name: "Issue View Command - Issue Not Found",
  meta: import.meta,
  colors: false,
  args: ["TEST-999"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetailsWithComments",
        variables: { id: "TEST-999" },
        response: {
          errors: [{
            message: "Issue not found: TEST-999",
            extensions: { code: "NOT_FOUND" },
          }],
        },
      },
    ])

    try {
      try {
        await viewCommand.parse()
      } catch (error) {
        console.log(`Error: ${(error as Error).message}`)
      }
    } finally {
      await cleanup()
    }
  },
})

// Test JSON output with no comments
await snapshotTest({
  name: "Issue View Command - JSON Output No Comments",
  meta: import.meta,
  colors: false,
  args: ["TEST-123", "--no-comments"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetails",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug-in-login-flow",
              branchName: "fix/test-123-auth-bug",
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

// Test JSON output with comments
await snapshotTest({
  name: "Issue View Command - JSON Output With Comments",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueDetailsWithComments",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              title: "Fix authentication bug in login flow",
              description:
                "Users are experiencing issues logging in when their session expires.",
              url:
                "https://linear.app/test-team/issue/TEST-123/fix-authentication-bug-in-login-flow",
              branchName: "fix/test-123-auth-bug",
              comments: {
                nodes: [
                  {
                    id: "comment-1",
                    body:
                      "I've reproduced this issue on staging. The session timeout seems to be too aggressive.",
                    createdAt: "2024-01-15T10:30:00Z",
                    user: {
                      name: "john.doe",
                      displayName: "John Doe",
                    },
                    externalUser: null,
                    parent: null,
                  },
                  {
                    id: "comment-2",
                    body:
                      "Working on a fix. Will increase the session timeout and add proper error handling.",
                    createdAt: "2024-01-15T14:22:00Z",
                    user: {
                      name: "jane.smith",
                      displayName: "Jane Smith",
                    },
                    externalUser: null,
                    parent: {
                      id: "comment-1",
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
      await viewCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
