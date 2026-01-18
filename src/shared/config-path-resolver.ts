import { join } from "node:path"
import { getOpenCodeConfigDir } from "./opencode-config-dir"
import { getClaudeConfigDir } from "./claude-config-dir"

/**
 * Unified configuration path resolver for OpenCode and Claude Code directories.
 * Provides a single source of truth for all path resolution across the codebase.
 *
 * @example
 * ```typescript
 * import { CONFIG_PATHS } from '@/shared/config-path-resolver'
 *
 * const skillsPath = CONFIG_PATHS.claudeSkills()
 * const commandsPath = CONFIG_PATHS.opencodeCommand()
 * ```
 */

/**
 * Configuration path getters for all OpenCode and Claude Code directories.
 * All paths are resolved functions to ensure they can be called at any time.
 */
export const CONFIG_PATHS = {
  /**
   * Get the main OpenCode configuration directory.
   * Respects OPENCODE_CONFIG_DIR environment variable.
   */
  opencode: (binary: "opencode" | "opencode-desktop" = "opencode", version?: string | null): string =>
    getOpenCodeConfigDir({ binary, version }),

  /**
   * Get the OpenCode config file path (JSON).
   */
  opencodeConfig: (binary: "opencode" | "opencode-desktop" = "opencode", version?: string | null): string =>
    join(getOpenCodeConfigDir({ binary, version }), "opencode.json"),

  /**
   * Get the OpenCode config file path (JSONC).
   */
  opencodeConfigC: (binary: "opencode" | "opencode-desktop" = "opencode", version?: string | null): string =>
    join(getOpenCodeConfigDir({ binary, version }), "opencode.jsonc"),

  /**
   * Get the OpenCode command directory.
   */
  opencodeCommand: (): string => join(getOpenCodeConfigDir({ binary: "opencode" }), "command"),

  /**
   * Get the OpenCode skill directory.
   */
  opencodeSkill: (): string => join(getOpenCodeConfigDir({ binary: "opencode" }), "skill"),

  /**
   * Get the oh-my-opencode config file path.
   */
  omoConfig: (binary: "opencode" | "opencode-desktop" = "opencode", version?: string | null): string =>
    join(getOpenCodeConfigDir({ binary, version }), "oh-my-opencode.json"),

  /**
   * Get the OpenCode package.json path.
   */
  packageJson: (binary: "opencode" | "opencode-desktop" = "opencode", version?: string | null): string =>
    join(getOpenCodeConfigDir({ binary, version }), "package.json"),

  /**
   * Get the main Claude Code configuration directory.
   * Respects CLAUDE_CONFIG_DIR environment variable.
   */
  claude: (): string => getClaudeConfigDir(),

  /**
   * Get the Claude Code commands directory.
   */
  claudeCommands: (): string => join(getClaudeConfigDir(), "commands"),

  /**
   * Get the Claude Code skills directory.
   */
  claudeSkills: (): string => join(getClaudeConfigDir(), "skills"),

  /**
   * Get the Claude Code agents directory.
   */
  claudeAgents: (): string => join(getClaudeConfigDir(), "agents"),

  /**
   * Get the Claude Code settings.json path.
   */
  claudeSettings: (): string => join(getClaudeConfigDir(), "settings.json"),

  /**
   * Get the Claude Code .mcp.json path.
   */
  claudeMcpConfig: (): string => join(getClaudeConfigDir(), ".mcp.json"),

  /**
   * Get the Claude Code transcripts directory.
   */
  claudeTranscripts: (): string => join(getClaudeConfigDir(), "transcripts"),

  /**
   * Get the Claude Code todos directory.
   */
  claudeTodos: (): string => join(getClaudeConfigDir(), "todos"),
} as const

/**
 * Type-safe config path keys.
 */
export type ConfigPathKey = keyof typeof CONFIG_PATHS
