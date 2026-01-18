/**
 * Shared orchestrator constants for agent configuration.
 * Extracts duplicated DEFAULT_MODEL constants from agent files to eliminate DRY violations.
 * Provides type-safe constant object with per-agent default models.
 */

export const DEFAULT_MODELS = {
  ORCHESTRATOR: "anthropic/claude-opus-4-5",
  SISYPHUS: "anthropic/claude-opus-4-5",
  ORACLE: "openai/gpt-5.2",
  LIBRARIAN: "opencode/glm-4.7-free",
  EXPLORE: "opencode/grok-code",
  FRONTEND_UI_UX_ENGINEER: "google/gemini-3-pro-preview",
  DOCUMENT_WRITER: "google/gemini-3-flash",
  MULTIMODAL_LOOKER: "google/gemini-3-flash",
  PROMETHEUS: "anthropic/claude-opus-4-5",
  METIS: "anthropic/claude-sonnet-4-5",
  MOMUS: "anthropic/claude-sonnet-4-5",
  BUILD: "anthropic/claude-opus-4-5",
  PLAN: "anthropic/claude-opus-4-5",
} as const;

export type DefaultModel = keyof typeof DEFAULT_MODELS;
