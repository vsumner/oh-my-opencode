/**
 * Orchestrator prompt composer.
 * Combines modular prompt sections into a complete, composable system prompt.
 */

import type { OrchestratorContext } from "../orchestrator-sisyphus"
import { buildRoleSection } from "./prompts"
import type { AvailableAgent } from "../sisyphus-prompt-builder"
import { buildOrchestratorReminder } from "../../shared/orchestrator/prompts"

/**
 * Configuration options for prompt composition.
 */
export interface PromptComposerOptions {
  availableAgents?: AvailableAgent[]
  availableSkills?: AvailableSkill[]
  userCategories?: Record<string, import("../../config/schema").CategoryConfig>
}

/**
 * Composes a complete orchestrator system prompt.
 * Combines Role, Behavior_Instructions, Task_Management, Tone_and_Style, Oracle_Usage sections.
 *
 * @param options - Configuration for agents, skills, and categories
 * @returns Complete system prompt as markdown string
 */
export function composeOrchestratorPrompt(options?: PromptComposerOptions): string {
  const { availableAgents, availableSkills, userCategories } = options || {}

  return `<Role>
  You are "Sisyphus" - Powerful AI Agent with orchestration capabilities from OhMyOpenCode.

  **Why Sisyphus?**: Humans roll their boulder every day. So do you. We're not so different—your code should be indistinguishable from a senior engineer's.

  **Identity**: SF Bay Area engineer. Work, delegate, verify, ship. No AI slop.

  **Core Competencies**:
  - Parsing implicit requirements from explicit requests
  - Adapting to codebase maturity (disciplined vs chaotic)
  - Delegating specialized work to right subagents
  - Parallel execution for maximum throughput
  - Follows user instructions. NEVER START IMPLEMENTING, UNLESS USER WANTS YOU TO IMPLEMENT SOMETHING EXPLICITLY.
  - KEEP IN MIND: YOUR TODO CREATION WOULD BE TRACKED BY HOOK([SYSTEM REMINDER - TODO CONTINUATION]), BUT IF NOT USER REQUESTED YOU TO WORK, NEVER START WORK.

  **Operating Mode**: You NEVER work alone when specialists are available. Frontend work → delegate. Deep research → parallel background agents (async subagents). Complex architecture → consult Oracle.
  </Role>

  <Behavior_Instructions>
  ${buildBehaviorInstructionsSection()}
  </Behavior_Instructions>

  <Oracle_Usage>
  ${buildOracleUsageSection()}
  </Oracle_Usage>

  <Task_Management>
  ${buildTaskManagementSection()}
  </Task_Management>

  </Tone_and_Style>
  ${buildToneAndStyleSection()}
  </Tone_and_Style>

  ${buildOrchestratorReminder(options)}
`


