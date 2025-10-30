import { snapshotTest } from "@cliffy/testing"
import { listCommand } from "../../../src/commands/document/document-list.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Document List Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await listCommand.parse()
  },
})

// Test listing all documents
await snapshotTest({
  name: "Document List Command - All Documents",
  meta: import.meta,
  colors: false,
  args: ["--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListDocuments",
        response: {
          data: {
            documents: {
              nodes: [
                {
                  id: "doc-1",
                  title: "API Design Document",
                  slugId: "api-design-document",
                  url: "https://linear.app/test/document/api-design-document",
                  project: {
                    id: "project-1",
                    name: "Backend Platform",
                  },
                  creator: {
                    name: "alice",
                    displayName: "Alice Smith",
                  },
                  createdAt: "2024-01-10T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
                {
                  id: "doc-2",
                  title: "Database Migration Plan",
                  slugId: "database-migration-plan",
                  url:
                    "https://linear.app/test/document/database-migration-plan",
                  project: {
                    id: "project-2",
                    name: "Infrastructure",
                  },
                  creator: {
                    name: "bob",
                    displayName: "Bob Jones",
                  },
                  createdAt: "2024-01-12T09:00:00Z",
                  updatedAt: "2024-01-12T09:00:00Z",
                },
                {
                  id: "doc-3",
                  title: "Meeting Notes",
                  slugId: "meeting-notes",
                  url: "https://linear.app/test/document/meeting-notes",
                  project: null,
                  creator: {
                    name: "charlie",
                    displayName: "Charlie Brown",
                  },
                  createdAt: "2024-01-14T15:00:00Z",
                  updatedAt: "2024-01-14T16:30:00Z",
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

// Test listing documents with JSON output
await snapshotTest({
  name: "Document List Command - JSON Output",
  meta: import.meta,
  colors: false,
  args: ["--json", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListDocuments",
        response: {
          data: {
            documents: {
              nodes: [
                {
                  id: "doc-1",
                  title: "API Design Document",
                  slugId: "api-design-document",
                  url: "https://linear.app/test/document/api-design-document",
                  project: {
                    id: "project-1",
                    name: "Backend Platform",
                  },
                  creator: {
                    name: "alice",
                    displayName: "Alice Smith",
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

// Test VCS integration with --current-project flag
await snapshotTest({
  name: "Document List Command - Current Project (VCS)",
  meta: import.meta,
  colors: false,
  args: ["--current-project", "--json", "--plain"],
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
      // Mock document list filtered by project
      {
        queryName: "ListDocuments",
        variables: {
          filter: { project: { id: { eq: "project-789" } } },
          first: 50,
          orderBy: "updatedAt",
          includeArchived: false,
        },
        response: {
          data: {
            documents: {
              nodes: [
                {
                  id: "doc-1",
                  title: "API Design Document",
                  slugId: "api-design-document",
                  url: "https://linear.app/test/document/api-design-document",
                  project: {
                    id: "project-789",
                    name: "Backend Platform",
                  },
                  creator: {
                    name: "alice",
                    displayName: "Alice Smith",
                  },
                  createdAt: "2024-01-10T10:00:00Z",
                  updatedAt: "2024-01-15T14:30:00Z",
                },
                {
                  id: "doc-2",
                  title: "Implementation Notes",
                  slugId: "implementation-notes",
                  url: "https://linear.app/test/document/implementation-notes",
                  project: {
                    id: "project-789",
                    name: "Backend Platform",
                  },
                  creator: {
                    name: "bob",
                    displayName: "Bob Jones",
                  },
                  createdAt: "2024-01-12T09:00:00Z",
                  updatedAt: "2024-01-14T11:20:00Z",
                },
              ],
            },
          },
        },
      },
    ], {
      // Simulate git branch with issue ID
      GIT_BRANCH: "feature/ENG-123-api-redesign",
    })

    try {
      await listCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test filtering by project ID
await snapshotTest({
  name: "Document List Command - Filter By Project",
  meta: import.meta,
  colors: false,
  args: ["--project", "project-123", "--json", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetProjectIdByName",
        variables: { name: "project-123" },
        response: {
          data: {
            projects: {
              nodes: [{
                id: "project-123",
              }],
            },
          },
        },
      },
      {
        queryName: "ListDocuments",
        variables: {
          filter: { project: { id: { eq: "project-123" } } },
          first: 50,
          orderBy: "updatedAt",
          includeArchived: false,
        },
        response: {
          data: {
            documents: {
              nodes: [
                {
                  id: "doc-1",
                  title: "Project Specific Doc",
                  slugId: "project-specific-doc",
                  url: "https://linear.app/test/document/project-specific-doc",
                  project: {
                    id: "project-123",
                    name: "Mobile App",
                  },
                  creator: {
                    name: "alice",
                    displayName: "Alice Smith",
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

// Test empty document list
await snapshotTest({
  name: "Document List Command - No Documents Found",
  meta: import.meta,
  colors: false,
  args: ["--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ListDocuments",
        response: {
          data: {
            documents: {
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

