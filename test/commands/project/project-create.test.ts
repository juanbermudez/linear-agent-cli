import { snapshotTest } from "@cliffy/testing"
import { createCommand } from "../../../src/commands/project/project-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Project Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await createCommand.parse()
  },
})

// Test creating a project with flags (happy path)
await snapshotTest({
  name: "Project Create Command - Happy Path",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "API Redesign",
    "--description",
    "Comprehensive API redesign project",
    "--team",
    "ENG",
    "--status",
    "planned",
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
      // Mock listProjectStatuses
      {
        queryName: "ListProjectStatuses",
        response: {
          data: {
            projectStatuses: {
              nodes: [
                {
                  id: "status-planned",
                  name: "Planned",
                  type: "planned",
                  color: "#5E6AD2",
                  description: null,
                  position: 0,
                },
                {
                  id: "status-started",
                  name: "In Progress",
                  type: "started",
                  color: "#26B5CE",
                  description: null,
                  position: 1,
                },
              ],
            },
          },
        },
      },
      // Mock createProject mutation
      {
        queryName: "CreateProject",
        response: {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: "project-123",
                name: "API Redesign",
                slugId: "api-redesign",
                url: "https://linear.app/test/project/api-redesign",
                description: "Comprehensive API redesign project",
                status: {
                  id: "status-planned",
                  name: "Planned",
                  type: "planned",
                },
                lead: null,
                teams: {
                  nodes: [{
                    id: "team-eng-id",
                    key: "ENG",
                    name: "Engineering",
                  }],
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

// Test creating project with document (cross-entity integration)
await snapshotTest({
  name: "Project Create Command - With Document (Cross-Entity)",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Mobile App Redesign",
    "--description",
    "Complete mobile app UI/UX overhaul",
    "--team",
    "DESIGN",
    "--with-doc",
    "--doc-title",
    "Mobile Redesign Design Doc",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      // Mock getTeamIdByKey
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "DESIGN" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-design-id" }],
            },
          },
        },
      },
      // Mock createProject mutation
      {
        queryName: "CreateProject",
        response: {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: "project-456",
                name: "Mobile App Redesign",
                slugId: "mobile-app-redesign",
                url: "https://linear.app/test/project/mobile-app-redesign",
                description: "Complete mobile app UI/UX overhaul",
                status: {
                  id: "status-planned",
                  name: "Planned",
                  type: "planned",
                },
                lead: null,
                teams: {
                  nodes: [{
                    id: "team-design-id",
                    key: "DESIGN",
                    name: "Design",
                  }],
                },
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
      // Mock createDocument mutation (for --with-doc)
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-789",
                title: "Mobile Redesign Design Doc",
                slugId: "mobile-redesign-design-doc",
                url:
                  "https://linear.app/test/document/mobile-redesign-design-doc",
                content: null,
                project: {
                  id: "project-456",
                  name: "Mobile App Redesign",
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

// Test --with-doc with default document title
await snapshotTest({
  name: "Project Create Command - With Doc (Default Title)",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Backend Platform",
    "--team",
    "ENG",
    "--with-doc",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
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
      {
        queryName: "ListProjectStatuses",
        response: {
          data: {
            projectStatuses: {
              nodes: [
                { id: "status-1", name: "Planned", type: "planned", position: 0 },
                { id: "status-2", name: "In Progress", type: "started", position: 1 },
                { id: "status-3", name: "Completed", type: "completed", position: 2 },
              ],
            },
          },
        },
      },
      {
        queryName: "CreateProject",
        response: {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: "project-default",
                name: "Backend Platform",
                slugId: "backend-platform",
                url: "https://linear.app/test/project/backend-platform",
                description: null,
                status: {
                  id: "status-1",
                  name: "Planned",
                  type: "planned",
                },
                lead: null,
                teams: {
                  nodes: [{
                    id: "team-eng-id",
                    key: "ENG",
                    name: "Engineering",
                  }],
                },
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
      {
        queryName: "CreateDocument",
        response: {
          data: {
            documentCreate: {
              success: true,
              document: {
                id: "doc-default",
                title: "Backend Platform Design Doc",
                slugId: "backend-platform-design-doc",
                url:
                  "https://linear.app/test/document/backend-platform-design-doc",
                content: null,
                project: {
                  id: "project-default",
                  name: "Backend Platform",
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

// Test creating project with minimal flags
await snapshotTest({
  name: "Project Create Command - Minimal Flags",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Quick Project",
    "--json",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
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
      {
        queryName: "ListProjectStatuses",
        response: {
          data: {
            projectStatuses: {
              nodes: [
                { id: "status-1", name: "Planned", type: "planned", position: 0 },
                { id: "status-2", name: "In Progress", type: "started", position: 1 },
                { id: "status-3", name: "Completed", type: "completed", position: 2 },
              ],
            },
          },
        },
      },
      {
        queryName: "CreateProject",
        response: {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: "project-minimal",
                name: "Quick Project",
                slugId: "quick-project",
                url: "https://linear.app/test/project/quick-project",
                description: null,
                status: {
                  id: "status-1",
                  name: "Planned",
                  type: "planned",
                },
                lead: null,
                teams: {
                  nodes: [{
                    id: "team-eng-id",
                    key: "ENG",
                    name: "Engineering",
                  }],
                },
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
              },
            },
          },
        },
      },
    ], { LINEAR_TEAM_ID: "ENG" })

    try {
      await createCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test non-JSON output format
await snapshotTest({
  name: "Project Create Command - Text Output",
  meta: import.meta,
  colors: false,
  args: [
    "--name",
    "Infrastructure Project",
    "--team",
    "OPS",
    "--plain",
  ],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetTeamIdByKey",
        variables: { team: "OPS" },
        response: {
          data: {
            teams: {
              nodes: [{ id: "team-ops-id" }],
            },
          },
        },
      },
      {
        queryName: "CreateProject",
        response: {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: "project-text",
                name: "Infrastructure Project",
                slugId: "infrastructure-project",
                url: "https://linear.app/test/project/infrastructure-project",
                description: null,
                status: {
                  id: "status-1",
                  name: "Planned",
                  type: "planned",
                },
                lead: null,
                teams: {
                  nodes: [{
                    id: "team-ops-id",
                    key: "OPS",
                    name: "Operations",
                  }],
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
