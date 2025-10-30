import { snapshotTest } from "@cliffy/testing"
import { viewCommand } from "../../../src/commands/document/document-view.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Document View Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await viewCommand.parse()
  },
})

// Test viewing a document with markdown rendering
await snapshotTest({
  name: "Document View Command - Markdown Rendering",
  meta: import.meta,
  colors: false,
  args: ["doc-123", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewDocument",
        variables: { id: "doc-123" },
        response: {
          data: {
            document: {
              id: "doc-123",
              title: "API Design Document",
              slugId: "api-design-document",
              icon: null,
              color: null,
              url: "https://linear.app/test/document/api-design-document",
              content:
                "# API Design\n\nThis document describes the API design for the new backend service.\n\n## Overview\n\nThe API will use REST principles with JSON payloads.",
              project: {
                id: "project-789",
                name: "Backend Platform",
                url: "https://linear.app/test/project/backend-platform",
              },
              initiative: null,
              creator: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              updatedBy: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
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

// Test viewing a document with JSON output
await snapshotTest({
  name: "Document View Command - JSON Output",
  meta: import.meta,
  colors: false,
  args: ["doc-456", "--json", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewDocument",
        variables: { id: "doc-456" },
        response: {
          data: {
            document: {
              id: "doc-456",
              title: "Meeting Notes",
              slugId: "meeting-notes",
              icon: null,
              color: null,
              url: "https://linear.app/test/document/meeting-notes",
              content:
                "# Meeting Notes\n\n- Discussed API design\n- Next steps: prototype",
              project: null,
              initiative: null,
              creator: {
                id: "user-bob",
                name: "bob",
                displayName: "Bob Jones",
              },
              updatedBy: {
                id: "user-bob",
                name: "bob",
                displayName: "Bob Jones",
              },
              createdAt: "2024-01-12T09:00:00Z",
              updatedAt: "2024-01-12T11:30:00Z",
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

// Test viewing a document without project linkage
await snapshotTest({
  name: "Document View Command - No Project Linked",
  meta: import.meta,
  colors: false,
  args: ["doc-solo", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewDocument",
        variables: { id: "doc-solo" },
        response: {
          data: {
            document: {
              id: "doc-solo",
              title: "Standalone Document",
              slugId: "standalone-document",
              icon: null,
              color: null,
              url: "https://linear.app/test/document/standalone-document",
              content:
                "# Standalone\n\nThis document is not linked to any project.",
              project: null,
              initiative: null,
              creator: {
                id: "user-charlie",
                name: "charlie",
                displayName: "Charlie Brown",
              },
              updatedBy: {
                id: "user-charlie",
                name: "charlie",
                displayName: "Charlie Brown",
              },
              createdAt: "2024-01-14T15:00:00Z",
              updatedAt: "2024-01-14T15:00:00Z",
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

// Test viewing a document with empty content
await snapshotTest({
  name: "Document View Command - Empty Content",
  meta: import.meta,
  colors: false,
  args: ["doc-empty", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewDocument",
        variables: { id: "doc-empty" },
        response: {
          data: {
            document: {
              id: "doc-empty",
              title: "New Document",
              slugId: "new-document",
              icon: null,
              color: null,
              url: "https://linear.app/test/document/new-document",
              content: null,
              project: {
                id: "project-123",
                name: "Mobile App",
                url: "https://linear.app/test/project/mobile-app",
              },
              initiative: null,
              creator: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              updatedBy: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-16T08:00:00Z",
              updatedAt: "2024-01-16T08:00:00Z",
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

// Test viewing document by slug ID
await snapshotTest({
  name: "Document View Command - By Slug ID",
  meta: import.meta,
  colors: false,
  args: ["api-design-document", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "ViewDocument",
        variables: { id: "api-design-document" },
        response: {
          data: {
            document: {
              id: "doc-789",
              title: "API Design Document",
              slugId: "api-design-document",
              icon: null,
              color: null,
              url: "https://linear.app/test/document/api-design-document",
              content:
                "# API Design\n\nDetailed specifications for the new API.",
              project: {
                id: "project-456",
                name: "Backend Services",
                url: "https://linear.app/test/project/backend-services",
              },
              initiative: null,
              creator: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              updatedBy: {
                id: "user-alice",
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
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
