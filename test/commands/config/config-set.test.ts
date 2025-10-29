import { snapshotTest } from "@cliffy/testing"
import { setCommand } from "../../../src/commands/config/config-set.ts"
import { commonDenoArgs } from "../../utils/test-helpers.ts"
import { join } from "@std/path"

// Helper to create a temporary directory with config file
async function setupTempConfig(): Promise<{ tempDir: string; cleanup: () => Promise<void> }> {
  const tempDir = await Deno.makeTempDir()
  const configPath = join(tempDir, "linear.toml")

  // Create initial config
  await Deno.writeTextFile(configPath, `workspace = "test-workspace"\nteam_id = "ENG"\n`)

  // Change to temp directory so config is found
  const originalDir = Deno.cwd()
  Deno.chdir(tempDir)

  return {
    tempDir,
    cleanup: async () => {
      Deno.chdir(originalDir)
      await Deno.remove(tempDir, { recursive: true })
    },
  }
}

// Test help output
await snapshotTest({
  name: "Config Set Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await setCommand.parse()
  },
})

// Test setting a simple value
await snapshotTest({
  name: "Config Set Command - Simple Value",
  meta: import.meta,
  colors: false,
  args: ["workspace", "new-workspace", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting a nested value with dot notation
await snapshotTest({
  name: "Config Set Command - Nested Value (Dot Notation)",
  meta: import.meta,
  colors: false,
  args: ["defaults.project.status", "In Progress", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting a boolean value
await snapshotTest({
  name: "Config Set Command - Boolean Value",
  meta: import.meta,
  colors: false,
  args: ["interactive.enabled", "true", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting a number value
await snapshotTest({
  name: "Config Set Command - Number Value",
  meta: import.meta,
  colors: false,
  args: ["defaults.milestone.targetDateOffset", "30", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting a deeply nested value
await snapshotTest({
  name: "Config Set Command - Deeply Nested Value",
  meta: import.meta,
  colors: false,
  args: ["level1.level2.level3.value", "deep", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test non-JSON output format
await snapshotTest({
  name: "Config Set Command - Text Output",
  meta: import.meta,
  colors: false,
  args: ["team_id", "PLATFORM"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting with string that looks like a number but has leading zero
await snapshotTest({
  name: "Config Set Command - String With Leading Zero",
  meta: import.meta,
  colors: false,
  args: ["code", "0123", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting false boolean value
await snapshotTest({
  name: "Config Set Command - False Boolean",
  meta: import.meta,
  colors: false,
  args: ["output.color", "false", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test setting a float value
await snapshotTest({
  name: "Config Set Command - Float Value",
  meta: import.meta,
  colors: false,
  args: ["version", "1.5", "--json"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupTempConfig()

    try {
      await setCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
