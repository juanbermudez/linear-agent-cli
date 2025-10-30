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
        queryName: "GetDocument",
        variables: { id: "doc-123" },
        response: {
          data: {
            document: {
              id: "doc-123",
              title: "API Design Document",
              slugId: "api-design-document",
              url: "https://linear.app/test/document/api-design-document",
              content:
                "# API Design\n\nThis document describes the API design for the new backend service.\n\n## Overview\n\nThe API will use REST principles with JSON payloads.",
              project: {
                id: "project-789",
                name: "Backend Platform",
                slugId: "backend-platform",
              },
              creator: {
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
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
        queryName: "GetDocument",
        variables: { id: "doc-456" },
        response: {
          data: {
            document: {
              id: "doc-456",
              title: "Meeting Notes",
              slugId: "meeting-notes",
              url: "https://linear.app/test/document/meeting-notes",
              content:
                "# Meeting Notes\n\n- Discussed API design\n- Next steps: prototype",
              project: null,
              creator: {
                name: "bob",
                displayName: "Bob Jones",
              },
              createdAt: "2024-01-12T09:00:00Z",
              updatedAt: "2024-01-12T11:30:00Z",
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
        queryName: "GetDocument",
        variables: { id: "doc-solo" },
        response: {
          data: {
            document: {
              id: "doc-solo",
              title: "Standalone Document",
              slugId: "standalone-document",
              url: "https://linear.app/test/document/standalone-document",
              content:
                "# Standalone\n\nThis document is not linked to any project.",
              project: null,
              creator: {
                name: "charlie",
                displayName: "Charlie Brown",
              },
              createdAt: "2024-01-14T15:00:00Z",
              updatedAt: "2024-01-14T15:00:00Z",
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
        queryName: "GetDocument",
        variables: { id: "doc-empty" },
        response: {
          data: {
            document: {
              id: "doc-empty",
              title: "New Document",
              slugId: "new-document",
              url: "https://linear.app/test/document/new-document",
              content: null,
              project: {
                id: "project-123",
                name: "Mobile App",
                slugId: "mobile-app",
              },
              creator: {
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-16T08:00:00Z",
              updatedAt: "2024-01-16T08:00:00Z",
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

// Test error when document not found
await snapshotTest({
  name: "Document View Command - Not Found",
  meta: import.meta,
  colors: false,
  args: ["doc-nonexistent", "--json", "--plain"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetDocument",
        variables: { id: "doc-nonexistent" },
        response: {
          data: {
            document: null,
          },
        },
      },
    ])

    try {
      await viewCommand.parse()
    } catch (_error) {
      // Expected to fail - document not found
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
        queryName: "GetDocument",
        variables: { id: "api-design-document" },
        response: {
          data: {
            document: {
              id: "doc-789",
              title: "API Design Document",
              slugId: "api-design-document",
              url: "https://linear.app/test/document/api-design-document",
              content:
                "# API Design\n\nDetailed specifications for the new API.",
              project: {
                id: "project-456",
                name: "Backend Services",
                slugId: "backend-services",
              },
              creator: {
                name: "alice",
                displayName: "Alice Smith",
              },
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-15T14:30:00Z",
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
