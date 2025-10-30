import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"

describe("Config System", () => {
  describe("Environment Variable Precedence", () => {
    it("should prioritize environment variables over config file", async () => {
      // Set environment variable
      Deno.env.set("LINEAR_TEAM_ID", "ENV_TEAM")

      // Import after setting env var
      const { getOption } = await import("../../src/config.ts")

      const teamId = getOption("team_id")
      expect(teamId).toBe("ENV_TEAM")

      // Cleanup
      Deno.env.delete("LINEAR_TEAM_ID")
    })

    it("should use CLI value over environment variable", async () => {
      // Set environment variable
      Deno.env.set("LINEAR_TEAM_ID", "ENV_TEAM")

      const { getOption } = await import("../../src/config.ts")

      // CLI value should take precedence
      const teamId = getOption("team_id", "CLI_TEAM")
      expect(teamId).toBe("CLI_TEAM")

      // Cleanup
      Deno.env.delete("LINEAR_TEAM_ID")
    })

    it("should handle boolean environment variables", async () => {
      // Test "true" string
      Deno.env.set("LINEAR_AUTO_BRANCH", "true")
      const { getOption: getOption1 } = await import("../../src/config.ts")
      const autoBranch1 = getOption1("auto_branch")
      expect(autoBranch1).toBe(true)

      // Test "false" string
      Deno.env.set("LINEAR_AUTO_BRANCH", "false")
      // Need to clear module cache to re-import
      const autoBranch2 = getOption1("auto_branch")
      expect(autoBranch2).toBe(false)

      // Test "1" as true
      Deno.env.set("LINEAR_AUTO_BRANCH", "1")
      const autoBranch3 = getOption1("auto_branch")
      expect(autoBranch3).toBe(true)

      // Test "0" as false
      Deno.env.set("LINEAR_AUTO_BRANCH", "0")
      const autoBranch4 = getOption1("auto_branch")
      expect(autoBranch4).toBe(false)

      // Cleanup
      Deno.env.delete("LINEAR_AUTO_BRANCH")
    })
  })

  describe("Default Values", () => {
    it("should use default value when not set elsewhere", async () => {
      // Ensure no env var is set
      Deno.env.delete("LINEAR_VCS")
      Deno.env.delete("LINEAR_AUTO_BRANCH")
      Deno.env.delete("LINEAR_CACHE_ENABLED")

      const { getOption } = await import("../../src/config.ts")

      // Test defaults
      const vcs = getOption("vcs")
      expect(vcs).toBe("git")

      const autoBranch = getOption("auto_branch")
      expect(autoBranch).toBe(true)

      const cacheEnabled = getOption("cache_enabled")
      expect(cacheEnabled).toBe(true)
    })
  })

  describe("Config Path Mapping", () => {
    it("should map auto_branch to vcs.autoBranch path", async () => {
      // This test verifies the config path mapping exists
      // We can't directly access OPTION_CONFIG_PATHS as it's not exported
      // But we can verify the behavior
      const { getOption } = await import("../../src/config.ts")

      // If config file has vcs.autoBranch, it should be accessible via auto_branch option
      const autoBranch = getOption("auto_branch")
      expect(typeof autoBranch).toBe("boolean")
    })

    it("should map cache_enabled to cache.enabled path", async () => {
      const { getOption } = await import("../../src/config.ts")

      const cacheEnabled = getOption("cache_enabled")
      expect(typeof cacheEnabled).toBe("boolean")
    })
  })

  describe("Environment Variable Formats", () => {
    it("should handle LINEAR_ prefix for all options", async () => {
      // Test various options with LINEAR_ prefix
      Deno.env.set("LINEAR_API_KEY", "test-key")
      Deno.env.set("LINEAR_WORKSPACE", "test-workspace")
      Deno.env.set("LINEAR_ISSUE_SORT", "priority")

      const { getOption } = await import("../../src/config.ts")

      expect(getOption("api_key")).toBe("test-key")
      expect(getOption("workspace")).toBe("test-workspace")
      expect(getOption("issue_sort")).toBe("priority")

      // Cleanup
      Deno.env.delete("LINEAR_API_KEY")
      Deno.env.delete("LINEAR_WORKSPACE")
      Deno.env.delete("LINEAR_ISSUE_SORT")
    })

    it("should handle uppercase conversion of option names", async () => {
      // team_id -> LINEAR_TEAM_ID
      Deno.env.set("LINEAR_TEAM_ID", "MY_TEAM")

      const { getOption } = await import("../../src/config.ts")

      expect(getOption("team_id")).toBe("MY_TEAM")

      // Cleanup
      Deno.env.delete("LINEAR_TEAM_ID")
    })
  })

  describe("Undefined Values", () => {
    it("should return undefined for unset options without defaults", async () => {
      // Ensure no env vars
      Deno.env.delete("LINEAR_API_KEY")

      const { getOption } = await import("../../src/config.ts")

      const apiKey = getOption("api_key")
      expect(apiKey).toBeUndefined()
    })

    it("should not return undefined for options with defaults", async () => {
      Deno.env.delete("LINEAR_VCS")

      const { getOption } = await import("../../src/config.ts")

      const vcs = getOption("vcs")
      expect(vcs).not.toBeUndefined()
      expect(vcs).toBe("git")
    })
  })

  describe("Type Safety", () => {
    it("should handle string option types", async () => {
      Deno.env.set("LINEAR_TEAM_ID", "ENG")

      const { getOption } = await import("../../src/config.ts")

      const teamId = getOption("team_id")
      expect(typeof teamId).toBe("string")

      Deno.env.delete("LINEAR_TEAM_ID")
    })

    it("should handle boolean option types", async () => {
      Deno.env.set("LINEAR_AUTO_BRANCH", "true")

      const { getOption } = await import("../../src/config.ts")

      const autoBranch = getOption("auto_branch")
      expect(typeof autoBranch).toBe("boolean")

      Deno.env.delete("LINEAR_AUTO_BRANCH")
    })
  })
})
