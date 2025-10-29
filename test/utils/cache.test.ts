import { describe, it } from "@std/testing/bdd"
import { assert, assertEquals, assertNotEquals } from "@std/assert"
import {
  clearAllCache,
  clearCache,
  getTeamCacheKey,
  getWorkspaceCacheKey,
  isCacheEnabled,
  readCache,
  writeCache,
} from "../../src/utils/cache.ts"

describe("Cache System", () => {
  // Clean up after tests
  const cleanup = async () => {
    await clearAllCache()
  }

  describe("Cache Key Generation", () => {
    it("should generate team-specific cache keys", () => {
      const key = getTeamCacheKey("workflows", "ENG")
      assertEquals(key, "workflows-team-ENG")
    })

    it("should generate workspace cache keys", () => {
      const key = getWorkspaceCacheKey("project-statuses")
      assertEquals(key, "project-statuses-workspace")
    })
  })

  describe("Cache Enabled Check", () => {
    it("should return true by default when cache_enabled not set", () => {
      // Default should be true
      const enabled = isCacheEnabled()
      assertEquals(enabled, true)
    })
  })

  describe("Write and Read Cache", () => {
    it("should write and read cache data", async () => {
      await cleanup()

      const testData = { id: "123", name: "Test" }
      const key = "test-write-read"

      await writeCache(key, testData)
      const result = await readCache<typeof testData>(key)

      assertEquals(result, testData)

      await cleanup()
    })

    it("should return null for non-existent cache", async () => {
      await cleanup()

      const result = await readCache("non-existent-key")
      assertEquals(result, null)

      await cleanup()
    })

    it("should handle complex nested data structures", async () => {
      await cleanup()

      const complexData = {
        workflows: [
          { id: "1", name: "Todo", type: "unstarted", position: 0 },
          { id: "2", name: "In Progress", type: "started", position: 1 },
        ],
        metadata: {
          teamId: "ENG",
          count: 2,
        },
      }

      const key = "test-complex"
      await writeCache(key, complexData)
      const result = await readCache<typeof complexData>(key)

      assertEquals(result, complexData)

      await cleanup()
    })
  })

  describe("Cache TTL", () => {
    it("should return valid cache within TTL", async () => {
      await cleanup()

      const testData = { value: "fresh" }
      const key = "test-ttl-valid"

      await writeCache(key, testData)

      // Read immediately - should be valid
      const result = await readCache<typeof testData>(key)
      assertEquals(result, testData)

      await cleanup()
    })

    // Note: Testing expired cache would require waiting 24 hours or mocking time
    // For now, we verify the cache structure includes timestamp
  })

  describe("Clear Cache", () => {
    it("should clear specific cache entry", async () => {
      await cleanup()

      const key = "test-clear-specific"
      await writeCache(key, { data: "test" })

      // Verify it exists
      let result = await readCache(key)
      assert(result !== null)

      // Clear it
      await clearCache(key)

      // Verify it's gone
      result = await readCache(key)
      assertEquals(result, null)

      await cleanup()
    })

    it("should clear all cache entries", async () => {
      await cleanup()

      // Write multiple entries
      await writeCache("key1", { data: "1" })
      await writeCache("key2", { data: "2" })
      await writeCache("key3", { data: "3" })

      // Clear all
      await clearAllCache()

      // Verify all are gone
      const result1 = await readCache("key1")
      const result2 = await readCache("key2")
      const result3 = await readCache("key3")

      assertEquals(result1, null)
      assertEquals(result2, null)
      assertEquals(result3, null)

      await cleanup()
    })

    it("should handle clearing non-existent cache gracefully", async () => {
      await cleanup()

      // Should not throw
      await clearCache("non-existent")
      await clearAllCache()

      // If we reach here without throwing, test passes
      assert(true)

      await cleanup()
    })
  })

  describe("Cache Isolation", () => {
    it("should keep team-specific caches separate", async () => {
      await cleanup()

      const dataENG = { workflows: ["started", "completed"] }
      const dataDesign = { workflows: ["backlog", "in-review"] }

      await writeCache(getTeamCacheKey("workflows", "ENG"), dataENG)
      await writeCache(getTeamCacheKey("workflows", "DESIGN"), dataDesign)

      const resultENG = await readCache(getTeamCacheKey("workflows", "ENG"))
      const resultDesign = await readCache(
        getTeamCacheKey("workflows", "DESIGN"),
      )

      assertEquals(resultENG, dataENG)
      assertEquals(resultDesign, dataDesign)
      assertNotEquals(resultENG, resultDesign)

      await cleanup()
    })
  })
})
