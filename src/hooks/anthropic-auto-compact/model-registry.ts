/**
 * Model Registry: Known context window sizes for popular LLM models
 *
 * This registry provides fallback context window sizes when error messages
 * don't contain token limit information. Values are based on official
 * documentation and are used to enable intelligent recovery from token limit errors.
 */

export interface ModelInfo {
  maxTokens: number
  description?: string
}

type ModelRegistry = {
  [providerID: string]: {
    [modelID: string]: ModelInfo
  }
}

/**
 * Known model context windows by provider and model ID
 * Sources:
 * - Anthropic: https://docs.anthropic.com/en/docs/about-claude/models
 * - OpenAI: https://platform.openai.com/docs/models
 * - Google: https://ai.google.dev/gemini-api/docs/models/gemini
 */
export const MODEL_REGISTRY: ModelRegistry = {
  // Anthropic Claude Models
  anthropic: {
    // Claude 4.5 family
    "claude-opus-4-5": { maxTokens: 200000, description: "Claude Opus 4.5" },
    "claude-sonnet-4-5": { maxTokens: 200000, description: "Claude Sonnet 4.5" },
    "claude-haiku-4-5": { maxTokens: 200000, description: "Claude Haiku 4.5" },

    // Claude 4 family
    "claude-opus-4": { maxTokens: 200000, description: "Claude Opus 4" },
    "claude-sonnet-4": { maxTokens: 200000, description: "Claude Sonnet 4" },

    // Claude 3.5 family
    "claude-3-5-sonnet-20241022": { maxTokens: 200000, description: "Claude 3.5 Sonnet (Oct 2024)" },
    "claude-3-5-sonnet-20240620": { maxTokens: 200000, description: "Claude 3.5 Sonnet (Jun 2024)" },
    "claude-3-5-haiku-20241022": { maxTokens: 200000, description: "Claude 3.5 Haiku" },

    // Claude 3 family
    "claude-3-opus-20240229": { maxTokens: 200000, description: "Claude 3 Opus" },
    "claude-3-sonnet-20240229": { maxTokens: 200000, description: "Claude 3 Sonnet" },
    "claude-3-haiku-20240307": { maxTokens: 200000, description: "Claude 3 Haiku" },

    // Legacy Claude 2
    "claude-2.1": { maxTokens: 200000, description: "Claude 2.1" },
    "claude-2.0": { maxTokens: 100000, description: "Claude 2.0" },

    // Legacy Claude Instant
    "claude-instant-1.2": { maxTokens: 100000, description: "Claude Instant 1.2" },
  },

  // OpenAI Models
  openai: {
    // GPT-5 (hypothetical - adjust when official)
    "gpt-5.2": { maxTokens: 200000, description: "GPT-5.2" },
    "gpt-5": { maxTokens: 200000, description: "GPT-5" },

    // GPT-4 Turbo and GPT-4
    "gpt-4-turbo": { maxTokens: 128000, description: "GPT-4 Turbo" },
    "gpt-4-turbo-2024-04-09": { maxTokens: 128000, description: "GPT-4 Turbo (Apr 2024)" },
    "gpt-4-turbo-preview": { maxTokens: 128000, description: "GPT-4 Turbo Preview" },
    "gpt-4-0125-preview": { maxTokens: 128000, description: "GPT-4 Turbo Preview (Jan 2025)" },
    "gpt-4-1106-preview": { maxTokens: 128000, description: "GPT-4 Turbo Preview (Nov 2023)" },
    "gpt-4": { maxTokens: 8192, description: "GPT-4" },
    "gpt-4-0613": { maxTokens: 8192, description: "GPT-4 (Jun 2023)" },
    "gpt-4-32k": { maxTokens: 32768, description: "GPT-4 32k" },
    "gpt-4-32k-0613": { maxTokens: 32768, description: "GPT-4 32k (Jun 2023)" },

    // GPT-4o (Omni)
    "gpt-4o": { maxTokens: 128000, description: "GPT-4o" },
    "gpt-4o-2024-11-20": { maxTokens: 128000, description: "GPT-4o (Nov 2024)" },
    "gpt-4o-2024-08-06": { maxTokens: 128000, description: "GPT-4o (Aug 2024)" },
    "gpt-4o-2024-05-13": { maxTokens: 128000, description: "GPT-4o (May 2024)" },
    "gpt-4o-mini": { maxTokens: 128000, description: "GPT-4o mini" },
    "gpt-4o-mini-2024-07-18": { maxTokens: 128000, description: "GPT-4o mini (Jul 2024)" },

    // O1 Series
    "o1": { maxTokens: 200000, description: "O1" },
    "o1-preview": { maxTokens: 128000, description: "O1 Preview" },
    "o1-mini": { maxTokens: 128000, description: "O1 Mini" },
    "o1-2024-12-17": { maxTokens: 200000, description: "O1 (Dec 2024)" },
    "o1-preview-2024-09-12": { maxTokens: 128000, description: "O1 Preview (Sep 2024)" },
    "o1-mini-2024-09-12": { maxTokens: 128000, description: "O1 Mini (Sep 2024)" },
    "o3-mini": { maxTokens: 200000, description: "O3 Mini" },

    // GPT-3.5
    "gpt-3.5-turbo": { maxTokens: 16385, description: "GPT-3.5 Turbo" },
    "gpt-3.5-turbo-0125": { maxTokens: 16385, description: "GPT-3.5 Turbo (Jan 2025)" },
    "gpt-3.5-turbo-1106": { maxTokens: 16385, description: "GPT-3.5 Turbo (Nov 2023)" },
    "gpt-3.5-turbo-16k": { maxTokens: 16385, description: "GPT-3.5 Turbo 16k" },
  },

  // Google Gemini Models
  google: {
    // Gemini 3 (hypothetical - adjust when official)
    "gemini-3-pro-high": { maxTokens: 2000000, description: "Gemini 3 Pro High" },
    "gemini-3-pro-medium": { maxTokens: 2000000, description: "Gemini 3 Pro Medium" },
    "gemini-3-pro-low": { maxTokens: 2000000, description: "Gemini 3 Pro Low" },
    "gemini-3-flash": { maxTokens: 1000000, description: "Gemini 3 Flash" },
    "gemini-3-flash-lite": { maxTokens: 1000000, description: "Gemini 3 Flash Lite" },

    // Gemini 2.0 (as of Dec 2024)
    "gemini-2.0-flash-exp": { maxTokens: 1000000, description: "Gemini 2.0 Flash Experimental" },
    "gemini-2.0-flash-thinking-exp-1219": {
      maxTokens: 32000,
      description: "Gemini 2.0 Flash Thinking (Dec 2024)",
    },

    // Gemini 1.5
    "gemini-1.5-pro": { maxTokens: 2000000, description: "Gemini 1.5 Pro" },
    "gemini-1.5-pro-002": { maxTokens: 2000000, description: "Gemini 1.5 Pro 002" },
    "gemini-1.5-pro-001": { maxTokens: 2000000, description: "Gemini 1.5 Pro 001" },
    "gemini-1.5-flash": { maxTokens: 1000000, description: "Gemini 1.5 Flash" },
    "gemini-1.5-flash-002": { maxTokens: 1000000, description: "Gemini 1.5 Flash 002" },
    "gemini-1.5-flash-001": { maxTokens: 1000000, description: "Gemini 1.5 Flash 001" },
    "gemini-1.5-flash-8b": { maxTokens: 1000000, description: "Gemini 1.5 Flash 8B" },

    // Gemini 1.0
    "gemini-1.0-pro": { maxTokens: 32000, description: "Gemini 1.0 Pro" },
    "gemini-1.0-pro-001": { maxTokens: 32000, description: "Gemini 1.0 Pro 001" },
    "gemini-1.0-pro-vision": { maxTokens: 16000, description: "Gemini 1.0 Pro Vision" },
    "gemini-pro": { maxTokens: 32000, description: "Gemini Pro (legacy alias)" },
    "gemini-pro-vision": { maxTokens: 16000, description: "Gemini Pro Vision (legacy alias)" },

    // Google via Antigravity (Claude models)
    "claude-sonnet-4-5": { maxTokens: 200000, description: "Claude Sonnet 4.5 (via Antigravity)" },
    "claude-sonnet-4-5-thinking": {
      maxTokens: 200000,
      description: "Claude Sonnet 4.5 Thinking (via Antigravity)",
    },
    "claude-opus-4-5-thinking": {
      maxTokens: 200000,
      description: "Claude Opus 4.5 Thinking (via Antigravity)",
    },

    // Google via Antigravity (GPT OSS)
    "gpt-oss-120b-medium": { maxTokens: 128000, description: "GPT OSS 120B Medium (via Antigravity)" },
  },

  // OpenCode specific models
  opencode: {
    "grok-code": { maxTokens: 128000, description: "Grok Code (via OpenCode)" },
    "big-pickle": { maxTokens: 128000, description: "Big Pickle (OpenCode fallback)" },
  },

  // Bedrock (AWS)
  bedrock: {
    "anthropic.claude-3-5-sonnet-20241022-v2:0": {
      maxTokens: 200000,
      description: "Claude 3.5 Sonnet (Bedrock)",
    },
    "anthropic.claude-3-5-sonnet-20240620-v1:0": {
      maxTokens: 200000,
      description: "Claude 3.5 Sonnet Jun 2024 (Bedrock)",
    },
    "anthropic.claude-3-5-haiku-20241022-v1:0": {
      maxTokens: 200000,
      description: "Claude 3.5 Haiku (Bedrock)",
    },
    "anthropic.claude-3-opus-20240229-v1:0": { maxTokens: 200000, description: "Claude 3 Opus (Bedrock)" },
    "anthropic.claude-3-sonnet-20240229-v1:0": {
      maxTokens: 200000,
      description: "Claude 3 Sonnet (Bedrock)",
    },
    "anthropic.claude-3-haiku-20240307-v1:0": { maxTokens: 200000, description: "Claude 3 Haiku (Bedrock)" },
  },

  // Azure OpenAI
  azure: {
    "gpt-4-turbo": { maxTokens: 128000, description: "GPT-4 Turbo (Azure)" },
    "gpt-4": { maxTokens: 8192, description: "GPT-4 (Azure)" },
    "gpt-4-32k": { maxTokens: 32768, description: "GPT-4 32k (Azure)" },
    "gpt-35-turbo": { maxTokens: 16385, description: "GPT-3.5 Turbo (Azure)" },
    "gpt-35-turbo-16k": { maxTokens: 16385, description: "GPT-3.5 Turbo 16k (Azure)" },
  },
}

/**
 * Lookup context window size for a given provider and model
 * @param providerID - Provider identifier (e.g., "anthropic", "openai")
 * @param modelID - Model identifier (e.g., "claude-opus-4-5", "gpt-4-turbo")
 * @returns maxTokens if found, undefined if unknown
 */
export function getModelMaxTokens(
  providerID: string | undefined,
  modelID: string | undefined,
): number | undefined {
  if (!providerID || !modelID) return undefined

  const provider = MODEL_REGISTRY[providerID]
  if (!provider) return undefined

  const modelInfo = provider[modelID]
  return modelInfo?.maxTokens
}

/**
 * Get model info for logging/debugging
 */
export function getModelInfo(
  providerID: string | undefined,
  modelID: string | undefined,
): ModelInfo | undefined {
  if (!providerID || !modelID) return undefined

  const provider = MODEL_REGISTRY[providerID]
  if (!provider) return undefined

  return provider[modelID]
}
