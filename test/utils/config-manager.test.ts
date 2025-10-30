import { assertEquals, assertExists } from "@std/assert"
import {
  ConfigManager,
  getConfigManager,
  type LinearConfig,
} from "../../src/utils/config-manager.ts"
import { join } from "@std/path"

// Helper to create a temporary directory for testing
async function createTempDir(): Promise<string> {
  const tempDir = await Deno.makeTempDir()
  return tempDir
}

// Helper to create a test config file
async function createTestConfig(
  dir: string,
  filename: string,
  content: string,
): Promise<string> {
  const configPath = join(dir, filename)
  await Deno.writeTextFile(configPath, content)
  return configPath
}

Deno.test("ConfigManager - get() retrieves simple values", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    const configPath = await createTestConfig(
      tempDir,
      "linear.toml",
      `
workspace = "test-workspace"
team_id = "ENG"
`,
    )

    // Manually load from our test path
    const content = await Deno.readTextFile(configPath)
    const { parse } = await import("@std/toml")
    manager["config"] = parse(content) as LinearConfig
    manager["configPath"] = configPath

    assertEquals(manager.get("workspace"), "test-workspace")
    assertEquals(manager.get("team_id"), "ENG")
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - get() retrieves nested values with dot notation", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    const configPath = await createTestConfig(
      tempDir,
      "linear.toml",
      `
[defaults]
team = "ENG"

[defaults.project]
status = "In Progress"
color = "#FF0000"
`,
    )

    const content = await Deno.readTextFile(configPath)
    const { parse } = await import("@std/toml")
    manager["config"] = parse(content) as LinearConfig
    manager["configPath"] = configPath

    assertEquals(manager.get("defaults.team"), "ENG")
    assertEquals(manager.get("defaults.project.status"), "In Progress")
    assertEquals(manager.get("defaults.project.color"), "#FF0000")
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - get() returns undefined for non-existent keys", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    const configPath = await createTestConfig(
      tempDir,
      "linear.toml",
      `
workspace = "test"
`,
    )

    const content = await Deno.readTextFile(configPath)
    const { parse } = await import("@std/toml")
    manager["config"] = parse(content) as LinearConfig

    assertEquals(manager.get("nonexistent"), undefined)
    assertEquals(manager.get("defaults.nonexistent"), undefined)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - set() sets simple values", () => {
  const manager = new ConfigManager()

  manager.set("workspace", "new-workspace")
  manager.set("team_id", "PLATFORM")

  assertEquals(manager.get("workspace"), "new-workspace")
  assertEquals(manager.get("team_id"), "PLATFORM")
})

Deno.test("ConfigManager - set() sets nested values with dot notation", () => {
  const manager = new ConfigManager()

  manager.set("defaults.team", "ENG")
  manager.set("defaults.project.status", "In Progress")
  manager.set("defaults.project.color", "#00FF00")

  assertEquals(manager.get("defaults.team"), "ENG")
  assertEquals(manager.get("defaults.project.status"), "In Progress")
  assertEquals(manager.get("defaults.project.color"), "#00FF00")
})

Deno.test("ConfigManager - set() creates intermediate objects", () => {
  const manager = new ConfigManager()

  // Set a deeply nested value that doesn't exist
  manager.set("level1.level2.level3.value", "deep")

  assertEquals(manager.get("level1.level2.level3.value"), "deep")

  // Verify intermediate objects were created
  const level1 = manager.get("level1") as Record<string, unknown>
  assertExists(level1)
  assertExists(level1.level2)
  assertExists((level1.level2 as Record<string, unknown>).level3)
})

Deno.test("ConfigManager - set() handles different value types", () => {
  const manager = new ConfigManager()

  manager.set("string_value", "hello")
  manager.set("number_value", 42)
  manager.set("boolean_value", true)
  manager.set("float_value", 3.14)

  assertEquals(manager.get("string_value"), "hello")
  assertEquals(manager.get("number_value"), 42)
  assertEquals(manager.get("boolean_value"), true)
  assertEquals(manager.get("float_value"), 3.14)
})

Deno.test("ConfigManager - getAll() returns entire config", () => {
  const manager = new ConfigManager()

  manager.set("workspace", "test")
  manager.set("team_id", "ENG")
  manager.set("defaults.project.status", "In Progress")

  const allConfig = manager.getAll()

  assertEquals(allConfig.workspace, "test")
  assertEquals(allConfig.team_id, "ENG")
  assertEquals(allConfig.defaults?.project?.status, "In Progress")
})

Deno.test("ConfigManager - getSection() returns specific section", () => {
  const manager = new ConfigManager()

  manager.set("workspace", "test")
  manager.set("defaults.team", "ENG")
  manager.set("defaults.project.status", "In Progress")

  const defaultsSection = manager.getSection("defaults") as Record<
    string,
    unknown
  >

  assertExists(defaultsSection)
  assertEquals(defaultsSection.team, "ENG")
  assertEquals(
    (defaultsSection.project as Record<string, unknown>).status,
    "In Progress",
  )
})

Deno.test("ConfigManager - getSection() returns undefined for non-existent section", () => {
  const manager = new ConfigManager()

  manager.set("workspace", "test")

  assertEquals(manager.getSection("nonexistent"), undefined)
})

Deno.test("ConfigManager - save() writes config to TOML file", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    const configPath = join(tempDir, "linear.toml")
    manager["configPath"] = configPath

    manager.set("workspace", "test-workspace")
    manager.set("team_id", "ENG")
    manager.set("defaults.project.status", "In Progress")

    await manager.save()

    // Verify file was written
    const content = await Deno.readTextFile(configPath)
    const { parse } = await import("@std/toml")
    const parsed = parse(content) as LinearConfig

    assertEquals(parsed.workspace, "test-workspace")
    assertEquals(parsed.team_id, "ENG")
    assertEquals(parsed.defaults?.project?.status, "In Progress")
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - load() reads from multiple possible paths", async () => {
  const tempDir = await createTempDir()

  try {
    // Create a config file in the temp directory
    await createTestConfig(
      tempDir,
      "linear.toml",
      `
workspace = "from-file"
team_id = "TEST"
`,
    )

    // Change to temp directory so relative paths work
    const originalDir = Deno.cwd()
    Deno.chdir(tempDir)

    const manager = new ConfigManager()
    await manager.load()

    assertEquals(manager.get("workspace"), "from-file")
    assertEquals(manager.get("team_id"), "TEST")

    // Restore original directory
    Deno.chdir(originalDir)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - load() handles missing config file gracefully", async () => {
  const tempDir = await createTempDir()

  try {
    // Change to temp directory with no config file
    const originalDir = Deno.cwd()
    Deno.chdir(tempDir)

    const manager = new ConfigManager()
    await manager.load()

    // Should not throw, config should be empty
    assertEquals(manager.getAll(), {})

    // ConfigPath should be set to default
    assertEquals(manager.getConfigPath(), "./.linear.toml")

    Deno.chdir(originalDir)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("ConfigManager - getConfigPath() returns config file path", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    await createTestConfig(
      tempDir,
      "linear.toml",
      `workspace = "test"`,
    )

    // Change to temp directory
    const originalDir = Deno.cwd()
    Deno.chdir(tempDir)

    await manager.load()

    const path = manager.getConfigPath()
    assertExists(path)
    assertEquals(path?.endsWith("linear.toml"), true)

    Deno.chdir(originalDir)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test("getConfigManager() returns singleton instance", async () => {
  // Clear singleton for test
  const { resetConfigManager } = await import("../../src/utils/config-manager.ts")
  resetConfigManager()

  const instance1 = await getConfigManager()
  const instance2 = await getConfigManager()

  // Should be the same instance
  assertEquals(instance1, instance2)
})

Deno.test("ConfigManager - handles legacy config fields", async () => {
  const manager = new ConfigManager()
  const tempDir = await createTempDir()

  try {
    const configPath = await createTestConfig(
      tempDir,
      ".linear.toml",
      `
# Legacy format
workspace = "old-workspace"
team_id = "OLD"
api_key = "lin_api_old_key"
issue_sort = "priority"
`,
    )

    const content = await Deno.readTextFile(configPath)
    const { parse } = await import("@std/toml")
    manager["config"] = parse(content) as LinearConfig

    assertEquals(manager.get("workspace"), "old-workspace")
    assertEquals(manager.get("team_id"), "OLD")
    assertEquals(manager.get("api_key"), "lin_api_old_key")
    assertEquals(manager.get("issue_sort"), "priority")
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})
