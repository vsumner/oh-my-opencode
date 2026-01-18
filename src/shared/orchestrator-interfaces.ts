/**
 * Orchestrator abstraction layer interfaces.
 * Provides type contracts for external system dependencies to enable testability and flexibility.
 */

import type { IBoulderStateService, ISessionService } from "./orchestrator-interfaces"

/**
 * Re-exports existing service interfaces for convenience.
 * Allows importing all orchestrator interfaces from single shared module.
 */
export type { IGitService, IOutputFormatter } from "../services"

/**
 * Interface for boulder state management.
 * Handles reading boulder plan files and tracking progress.
 */
export interface IBoulderStateService {
  /**
   * Reads boulder state from plan file.
   * @param planPath - Path to plan file (.sisyphus/plans/{plan-name}.md)
   * @returns Parsed boulder state or null if file doesn't exist
   */
  readBoulderState(planPath: string): {
    state: string | null
  } | null
}

/**
 * Interface for session management.
 * Handles session ID resolution, subagent session tracking, and main session identification.
 */
export interface ISessionService {
  /**
   * Gets the main session ID from subagent context.
   * @returns Main session ID or null if not in subagent context
   */
  getMainSessionID(): string | null
}
