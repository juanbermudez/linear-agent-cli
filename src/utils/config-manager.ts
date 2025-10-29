import { parse, stringify } from "@std/toml"
import { join } from "@std/path"

export interface LinearConfig {
  auth?: {
    token?: string
  }
  defaults?: {
    team?: string
    editor?: string
    project?: {
      status?: string
      color?: string
      lead?: string
      updateHealth?: string
    }
    initiative?: {
      status?: string
      owner?: string
    }
    milestone?: {
      targetDateOffset?: number
    }
    label?: {
      colors?: Record<string, string>
    }
  }
  interactive?: {
    enabled?: boolean
    confirmDestructive?: boolean
  }
  output?: {
    format?: "text" | "json"
    color?: boolean
    pager?: "auto" | "always" | "never"
  }
  vcs?: {
    autoDetectContext?: boolean
  }
  // Legacy fields
  team_id?: string
  api_key?: string
  workspace?: string
  issue_sort?: "manual" | "priority"
}

export class ConfigManager {
  private config: LinearConfig = {}
  private configPath: string | null = null

  async load(): Promise<void> {
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
      // Not in a git repository
    }

    for (const path of configPaths) {
      try {
        await Deno.stat(path)
        const file = await Deno.readTextFile(path)
        this.config = parse(file) as LinearConfig
        this.configPath = path
        break
      } catch {
        // File not found; continue
      }
    }

    // If no config found, use default path
    if (!this.configPath) {
      this.configPath = "./.linear.toml"
    }
  }

  get(key: string): unknown {
    const parts = key.split(".")
    let current: any = this.config

    for (const part of parts) {
      if (current == null || typeof current !== "object") {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  set(key: string, value: unknown): void {
    const parts = key.split(".")
    let current: any = this.config

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (current[part] == null || typeof current[part] !== "object") {
        current[part] = {}
      }
      current = current[part]
    }

    const lastPart = parts[parts.length - 1]
    current[lastPart] = value
  }

  getAll(): LinearConfig {
    return this.config
  }

  getSection(section: string): unknown {
    return this.get(section)
  }

  async save(): Promise<void> {
    if (!this.configPath) {
      throw new Error("No config path available")
    }

    const toml = stringify(this.config as Record<string, unknown>)
    await Deno.writeTextFile(this.configPath, toml)
  }

  getConfigPath(): string | null {
    return this.configPath
  }
}

// Singleton instance
let configManager: ConfigManager | null = null

export async function getConfigManager(): Promise<ConfigManager> {
  if (!configManager) {
    configManager = new ConfigManager()
    await configManager.load()
  }
  return configManager
}
