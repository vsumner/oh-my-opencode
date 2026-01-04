/**
 * Shared permission constants for agent configurations.
 *
 * Centralizes permission patterns to ensure DRY principle and single source of truth.
 * All agents should import and use these constants instead of hardcoding permissions.
 *
 * @see https://github.com/anomalyco/opencode/releases/tag/v1.1.1
 */

import type { AgentConfig } from "@opencode-ai/sdk"

/**
 * Agents that are read-only and perform analysis/research.
 * Cannot edit files or execute bash commands.
 */
export const PERMISSION_READ_ONLY = {
  edit: "deny" as const,
  bash: "deny" as const,
} as const satisfies AgentConfig["permission"]

/**
 * Agents that can write files but cannot execute bash commands.
 * Used for documentation writing and similar tasks.
 */
export const PERMISSION_WRITE_ONLY = {
  bash: "deny" as const,
} as const satisfies AgentConfig["permission"]

/**
 * Agents with full execution permissions (edit + bash).
 * Used for build agents and primary orchestrators.
 */
export const PERMISSION_FULL_ACCESS = {
  edit: "allow" as const,
  bash: "allow" as const,
} as const satisfies AgentConfig["permission"]

/**
 * Type-safe permission configuration for agents.
 * This type is inferred from the actual permission constants.
 */
export type PermissionConfig = typeof PERMISSION_READ_ONLY | typeof PERMISSION_WRITE_ONLY | typeof PERMISSION_FULL_ACCESS
