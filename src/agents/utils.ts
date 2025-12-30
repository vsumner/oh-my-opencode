import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrideConfig, AgentOverrides, AgentFactory } from "./types"
import type { AvailableAgent } from "./sisyphus-prompt-builder"
import { createSisyphusAgent } from "./sisyphus"
import { createOracleAgent, ORACLE_PROMPT_METADATA, ORACLE_DESCRIPTION } from "./oracle"
import { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA, LIBRARIAN_DESCRIPTION } from "./librarian"
import { createExploreAgent, EXPLORE_PROMPT_METADATA, EXPLORE_DESCRIPTION } from "./explore"
import { createFrontendUiUxEngineerAgent, FRONTEND_PROMPT_METADATA, FRONTEND_DESCRIPTION } from "./frontend-ui-ux-engineer"
import { createDocumentWriterAgent, DOCUMENT_WRITER_PROMPT_METADATA, DOCUMENT_WRITER_DESCRIPTION } from "./document-writer"
import { createMultimodalLookerAgent, MULTIMODAL_LOOKER_PROMPT_METADATA, MULTIMODAL_LOOKER_DESCRIPTION } from "./multimodal-looker"
import { deepMerge } from "../shared"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  Sisyphus: createSisyphusAgent,
  oracle: createOracleAgent,
  librarian: createLibrarianAgent,
  explore: createExploreAgent,
  "frontend-ui-ux-engineer": createFrontendUiUxEngineerAgent,
  "document-writer": createDocumentWriterAgent,
  "multimodal-looker": createMultimodalLookerAgent,
}

/**
 * Collects available agents (excluding Sisyphus) with their metadata for dynamic prompt generation
 */
export function collectAvailableAgents(disabledAgents: BuiltinAgentName[] = []): AvailableAgent[] {
  const agentMetadataMap: Array<{ name: BuiltinAgentName; description: string; metadata: typeof ORACLE_PROMPT_METADATA }> = [
    { name: "oracle", description: ORACLE_DESCRIPTION, metadata: ORACLE_PROMPT_METADATA },
    { name: "librarian", description: LIBRARIAN_DESCRIPTION, metadata: LIBRARIAN_PROMPT_METADATA },
    { name: "explore", description: EXPLORE_DESCRIPTION, metadata: EXPLORE_PROMPT_METADATA },
    { name: "frontend-ui-ux-engineer", description: FRONTEND_DESCRIPTION, metadata: FRONTEND_PROMPT_METADATA },
    { name: "document-writer", description: DOCUMENT_WRITER_DESCRIPTION, metadata: DOCUMENT_WRITER_PROMPT_METADATA },
    { name: "multimodal-looker", description: MULTIMODAL_LOOKER_DESCRIPTION, metadata: MULTIMODAL_LOOKER_PROMPT_METADATA },
  ]

  return agentMetadataMap.filter((agent) => !disabledAgents.includes(agent.name))
}

function isFactory(source: AgentSource): source is AgentFactory {
  return typeof source === "function"
}

function buildAgent(source: AgentSource, model?: string): AgentConfig {
  return isFactory(source) ? source(model) : source
}

export function createEnvContext(directory: string): string {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  const platform = process.platform as "darwin" | "linux" | "win32" | string

  return `
Here is some useful information about the environment you are running in:
<env>
  Working directory: ${directory}
  Platform: ${platform}
  Today's date: ${dateStr} (NOT 2024, NEVEREVER 2024)
  Current time: ${timeStr}
  Timezone: ${timezone}
  Locale: ${locale}
</env>`
}

function mergeAgentConfig(
  base: AgentConfig,
  override: AgentOverrideConfig
): AgentConfig {
  const { prompt_append, ...rest } = override
  const merged = deepMerge(base, rest as Partial<AgentConfig>)

  if (prompt_append && merged.prompt) {
    merged.prompt = merged.prompt + "\n" + prompt_append
  }

  return merged
}

export function createBuiltinAgents(
  disabledAgents: BuiltinAgentName[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string
): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {}
  const availableAgents = collectAvailableAgents(disabledAgents)

  for (const [name, source] of Object.entries(agentSources)) {
    const agentName = name as BuiltinAgentName

    if (disabledAgents.includes(agentName)) {
      continue
    }

    const override = agentOverrides[agentName]
    const model = override?.model ?? (agentName === "Sisyphus" ? systemDefaultModel : undefined)

    let config = agentName === "Sisyphus"
      ? createSisyphusAgent(model, availableAgents)
      : buildAgent(source, model)

    if ((agentName === "Sisyphus" || agentName === "librarian") && directory && config.prompt) {
      const envContext = createEnvContext(directory)
      config = { ...config, prompt: config.prompt + envContext }
    }

    if (override) {
      config = mergeAgentConfig(config, override)
    }

    result[name] = config
  }

  return result
}
