import { parse } from "@std/toml"
import { join } from "@std/path"
import { load } from "@std/dotenv"

let config: Record<string, unknown> = {}

async function loadConfig() {
  const configPaths = [
    "./linear.toml",
    "./.linear.toml",
  ]
  try {
    const gitProcess = await new Deno.Command("git", {
      args: ["rev-parse", "--show-toplevel"],
    }).output()
    const gitRoot = new TextDecoder().decode(gitProcess.stdout).trim()
    configPaths.push(join(gitRoot, "linear.toml"))
    configPaths.push(join(gitRoot, ".linear.toml"))
    configPaths.push(join(gitRoot, ".config", "linear.toml"))
  } catch {
    // Not in a git repository; ignore additional paths.
  }

  for (const path of configPaths) {
    try {
      await Deno.stat(path)
      const file = await Deno.readTextFile(path)
      config = parse(file) as Record<string, unknown>
      break
    } catch {
      // File not found; continue.
    }
  }
}

// Load .env files
async function loadEnvFiles() {
  let envVars: Record<string, string> = {}
  if (await Deno.stat(".env").catch(() => null)) {
    envVars = await load()
  } else {
    try {
      const gitRoot = new TextDecoder()
        .decode(
          await new Deno.Command("git", {
            args: ["rev-parse", "--show-toplevel"],
          })
            .output()
            .then((output) => output.stdout),
        )
        .trim()

      const gitRootEnvPath = join(gitRoot, ".env")
      if (await Deno.stat(gitRootEnvPath).catch(() => null)) {
        envVars = await load({ envPath: gitRootEnvPath })
      }
    } catch {
      // Silently continue if not in a git repo
    }
  }

  // Apply known environment variables from .env
  const ALLOWED_ENV_VAR_PREFIXES = ["LINEAR_", "GH_", "GITHUB_"]
  for (const [key, value] of Object.entries(envVars)) {
    if (ALLOWED_ENV_VAR_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      // Use same precedence as dotenv
      if (Deno.env.get(key) !== undefined) continue
      Deno.env.set(key, value)
    }
  }
}

await loadEnvFiles()
await loadConfig()

// Helper to get nested config values using dot notation
function getNestedConfig(path: string): unknown {
  const parts = path.split(".")
  let current: unknown = config

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

export type OptionValueMapping = {
  team_id: string
  api_key: string
  workspace: string
  issue_sort: "manual" | "priority"
  vcs: "git" | "jj"
  auto_branch: boolean
  cache_enabled: boolean
}

export type OptionName = keyof OptionValueMapping

// Map option names to their config paths (supports nested paths)
const OPTION_CONFIG_PATHS: Record<OptionName, string> = {
  team_id: "team_id",
  api_key: "api_key",
  workspace: "workspace",
  issue_sort: "issue_sort",
  vcs: "vcs",
  auto_branch: "vcs.autoBranch",
  cache_enabled: "cache.enabled",
}

// Default values for options
const OPTION_DEFAULTS: Partial<OptionValueMapping> = {
  vcs: "git",
  auto_branch: true,
  cache_enabled: true,
}

function parseBooleanEnv(value: string): boolean {
  return value.toLowerCase() === "true" || value === "1"
}

export function getOption<T extends OptionName>(
  optionName: T,
  cliValue?: string | boolean,
): OptionValueMapping[T] | undefined {
  // Precedence: CLI arg > Env variable > Config file > Default
  if (cliValue !== undefined) return cliValue as OptionValueMapping[T]

  // Check environment variable first
  const envKey = "LINEAR_" + optionName.toUpperCase()
  const envValue = Deno.env.get(envKey)
  if (envValue !== undefined) {
    // Handle boolean types from env vars
    if (optionName === "auto_branch" || optionName === "cache_enabled") {
      return parseBooleanEnv(envValue) as OptionValueMapping[T]
    }
    return envValue as OptionValueMapping[T]
  }

  // Fall back to config file (with nested path support)
  const configPath = OPTION_CONFIG_PATHS[optionName]
  const fromConfig = getNestedConfig(configPath)
  if (fromConfig !== undefined) {
    return fromConfig as OptionValueMapping[T]
  }

  // Return default if available
  if (optionName in OPTION_DEFAULTS) {
    return OPTION_DEFAULTS[optionName] as OptionValueMapping[T]
  }

  return undefined
}
