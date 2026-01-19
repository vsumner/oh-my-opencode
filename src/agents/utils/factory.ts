import type { AgentConfig } from "@opencode-ai/sdk"
import { isGptModel, isClaudeModel } from "../types"
import { createAgentToolRestrictions, createAgentToolAllowlist } from "../../shared/permission-compat"

/**
 * Factory options for creating agents with consistent patterns
 */
export interface AgentFactoryOptions {
  /** Agent description */
  description: string
  /** Agent mode (primary or subagent) */
  mode: "primary" | "subagent"
  /** Default model for this agent */
  defaultModel: string
  /** System prompt for the agent */
  prompt: string
  /** Restricted tools (will be converted to tool restrictions) */
  restrictedTools?: string[]
  /** Allowed tools (will be converted to allowlist) */
  allowedTools?: string[]
  /** Temperature setting */
  temperature?: number
  /** GPT-specific reasoning effort */
  reasoningEffort?: "low" | "medium" | "high"
  /** Claude-specific thinking configuration */
  thinking?: { type: "enabled"; budgetTokens: number }
  /** Additional properties to merge into config */
  extra?: Partial<AgentConfig>
}

/**
 * Creates a simple agent factory function.
 *
 * @example
 * ```typescript
 * const createMyAgent = createAgentFactory({
 *   description: "My custom agent",
 *   mode: "subagent",
 *   defaultModel: "anthropic/claude-sonnet-4-5",
 *   prompt: MY_PROMPT,
 *   restrictedTools: ["write", "edit"],
 * })
 *
 * export const myAgent = createMyAgent()
 * ```
 */
export function createAgentFactory(options: AgentFactoryOptions): (model?: string) => AgentConfig {
  const {
    description,
    mode,
    defaultModel,
    prompt,
    restrictedTools,
    allowedTools,
    temperature = 0.1,
    reasoningEffort,
    thinking,
    extra,
  } = options

  return (model?: string): AgentConfig => {
    const resolvedModel = model ?? defaultModel
    let config: AgentConfig = {
      description,
      mode,
      model: resolvedModel,
      temperature,
      prompt,
      ...extra,
    }

    const effectiveModel = config.model ?? resolvedModel

    // Apply tool restrictions or allowlist
    config = applyToolRestrictions(config, restrictedTools, allowedTools)

    // Apply model-specific configuration
    if (isGptModel(effectiveModel)) {
      if (reasoningEffort) {
        config = { ...config, reasoningEffort }
      }
    } else if (isClaudeModel(effectiveModel)) {
      // Apply thinking configuration for Claude models only
      if (thinking) {
        config = { ...config, thinking }
      }
    }
    // No model-specific config for other models (Gemini, GLM, etc.)

    return config
  }
}

/**
 * Applies tool restrictions or allowlist to a config object.
 */
function applyToolRestrictions(
  config: AgentConfig,
  restrictedTools?: string[],
  allowedTools?: string[],
): AgentConfig {
  if (restrictedTools && restrictedTools.length > 0) {
    const restrictions = createAgentToolRestrictions(restrictedTools)
    return { ...config, ...restrictions }
  } else if (allowedTools && allowedTools.length > 0) {
    const allowlist = createAgentToolAllowlist(allowedTools)
    return { ...config, ...allowlist }
  }
  return config
}

/**
 * Creates an agent factory for GPT models (automatically handles reasoningEffort).
 *
 * @example
 * ```typescript
 * const createMyGptAgent = createGptAgentFactory({
 *   description: "My GPT agent",
 *   defaultModel: "openai/gpt-5.2",
 *   prompt: MY_PROMPT,
 *   restrictedTools: ["write", "edit"],
 * })
 * ```
 */
export function createGptAgentFactory(options: {
  description: string
  mode: "primary" | "subagent"
  defaultModel: string
  prompt: string
  restrictedTools?: string[]
  allowedTools?: string[]
  temperature?: number
  /** GPT-specific text verbosity setting */
  textVerbosity?: "low" | "medium" | "high"
  extra?: Partial<AgentConfig>
}): (model?: string) => AgentConfig {
  return (model?: string): AgentConfig => {
    const resolvedModel = model ?? options.defaultModel
    const baseFactory = createAgentFactory({
      ...options,
      reasoningEffort: "medium",
      extra: options.extra,
    })

    let config = baseFactory(resolvedModel)

    if (isGptModel(resolvedModel) && options.textVerbosity) {
      config = { ...config, textVerbosity: options.textVerbosity }
    }

    if (isClaudeModel(resolvedModel)) {
      const { textVerbosity, reasoningEffort, ...rest } = config
      config = { ...rest, thinking: { type: "enabled", budgetTokens: 32000 } }
    }

    return config
  }
}

/**
 * Creates an agent factory for Claude models (automatically handles thinking).
 *
 * @example
 * ```typescript
 * const createMyClaudeAgent = createClaudeAgentFactory({
 *   description: "My Claude agent",
 *   defaultModel: "anthropic/claude-opus-4-5",
 *   prompt: MY_PROMPT,
 *   restrictedTools: ["write", "edit"],
 * })
 * ```
 */
export function createClaudeAgentFactory(options: {
  description: string
  mode: "primary" | "subagent"
  defaultModel: string
  prompt: string
  restrictedTools?: string[]
  allowedTools?: string[]
  temperature?: number
  budgetTokens?: number
  extra?: Partial<AgentConfig>
}): (model?: string) => AgentConfig {
  return createAgentFactory({
    ...options,
    thinking: { type: "enabled", budgetTokens: options.budgetTokens ?? 32000 },
  })
}

/**
 * Creates an agent with no tool restrictions (all tools allowed).
 */
export function createUnrestrictedAgentFactory(options: {
  description: string
  mode: "primary" | "subagent"
  defaultModel: string
  prompt: string
  temperature?: number
  extra?: Partial<AgentConfig>
}): (model?: string) => AgentConfig {
  return createAgentFactory(options)
}


