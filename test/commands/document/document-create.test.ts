import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/document/document-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Document Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating a document with flags (happy path)
await snapshotTest({
  name: "Document Create Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "API Design Document",
    "--content",
    "# API Design\n\nThis document describes the API design.",
    "--project",
    "project-123",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock response for getProjectIdByName
      {
        queryName: "GetProjectIdByName",
        variables: { name: "project-123" },
        response: {
          data: {
            projects: {
              nodes: [
                {
                  id: "project-123",
                },
              ],
            },
          },
        },
      },
      // Mock response for createDocument mutation
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-123",
                title: "API Design Document",
                slugId: "api-design-document",
                url: "https://linear.app/test/document/api-design-document",
                content:
                  "# API Design\n\nThis document describes the API design.",
                project: {
                  id: "project-123",
                  name: "Backend Redesign",
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

// Test creating a document with minimal flags
await snapshotTest({
  name: "Document Create Command - Minimal Flags",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Quick Note",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-456",
                title: "Quick Note",
                slugId: "quick-note",
                url: "https://linear.app/test/document/quick-note",
                content: null,
                project: null,
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

// Test VCS integration with --current-project flag
await snapshotTest({
  name: "Document Create Command - VCS Integration (Current Project)",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Implementation Notes",
    "--current-project",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock getCurrentProjectFromIssue() - simulating git branch with issue ID
      {
        queryName: "GetIssueProject",
        variables: { issueId: "ENG-123" },
        response: {
          data: {
            issue: {
              id: "issue-123",
              project: {
                id: "project-789",
                name: "Backend Platform",
              },
            },
          },
        },
      },
      // Mock createDocument with project from VCS context
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-789",
                title: "Implementation Notes",
                slugId: "implementation-notes",
                url: "https://linear.app/test/document/implementation-notes",
                content: null,
                project: {
                  id: "project-789",
                  name: "Backend Platform",
                },
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ], {
      // Simulate git branch with issue ID
      GIT_BRANCH: "feature/ENG-123-api-redesign",
    })

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test non-JSON output format
await snapshotTest({
  name: "Document Create Command - Text Output",
  meta: import.meta,
  colors: false,
  args: [
    "--title",
    "Design Document",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-text",
                title: "Design Document",
                slugId: "design-document",
                url: "https://linear.app/test/document/design-document",
                content: null,
                project: null,
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
