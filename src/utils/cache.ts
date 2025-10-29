import { join } from "@std/path"
import { getOption } from "../config.ts"

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get cache directory path (lazy evaluation to avoid requiring HOME at module load)
 */
function getCacheDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "~"
  return join(home, ".cache", "linear-cli")
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Check if caching is enabled in config
 */
export function isCacheEnabled(): boolean {
  return getOption("cache_enabled") !== false
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await Deno.mkdir(getCacheDir(), { recursive: true })
  } catch {
    // Directory already exists, ignore
  }
}

/**
 * Get cache file path for a given key
 */
function getCacheFilePath(key: string): string {
  return join(getCacheDir(), `${key}.json`)
}

/**
 * Check if cache entry is still valid based on TTL
 */
function isCacheValid(entry: CacheEntry<unknown>): boolean {
  const age = Date.now() - entry.timestamp
  return age < CACHE_TTL_MS
}

/**
 * Read data from cache
 * Returns null if cache doesn't exist, is invalid, or caching is disabled
 */
export async function readCache<T>(key: string): Promise<T | null> {
  if (!isCacheEnabled()) {
    return null
  }

  try {
    const filePath = getCacheFilePath(key)
    const content = await Deno.readTextFile(filePath)
    const entry: CacheEntry<T> = JSON.parse(content)

    if (isCacheValid(entry)) {
      return entry.data
    }

    // Cache is stale, delete it
    await Deno.remove(filePath).catch(() => {}) // Ignore errors
    return null
  } catch {
    // Cache file doesn't exist or is corrupted
    return null
  }
}

/**
 * Write data to cache
 * Does nothing if caching is disabled
 */
export async function writeCache<T>(key: string, data: T): Promise<void> {
  if (!isCacheEnabled()) {
    return
  }

  try {
    await ensureCacheDir()
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }
    const filePath = getCacheFilePath(key)
    await Deno.writeTextFile(filePath, JSON.stringify(entry, null, 2))
  } catch (error) {
    console.error(`Failed to write cache for key '${key}':`, error)
  }
}

/**
 * Clear cache for a specific key
 */
export async function clearCache(key: string): Promise<void> {
  try {
    const filePath = getCacheFilePath(key)
    await Deno.remove(filePath)
  } catch {
    // File doesn't exist or couldn't be removed, ignore
  }
}

/**
 * Clear all cache files
 */
export async function clearAllCache(): Promise<void> {
  try {
    await Deno.remove(getCacheDir(), { recursive: true })
  } catch {
    // Directory doesn't exist or couldn't be removed, ignore
  }
}

/**
 * Generate cache key for team-specific data
 */
export function getTeamCacheKey(resource: string, teamId: string): string {
  return `${resource}-team-${teamId}`
}

/**
 * Generate cache key for workspace-specific data
 */
export function getWorkspaceCacheKey(resource: string): string {
  return `${resource}-workspace`
}
