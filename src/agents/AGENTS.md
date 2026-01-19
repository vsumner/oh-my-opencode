# AGENTS KNOWLEDGE BASE

## OVERVIEW

10 AI agents for multi-model orchestration. Sisyphus (primary), oracle, librarian, explore, frontend, document-writer, multimodal-looker, Prometheus, Metis, Momus.

## STRUCTURE

```
agents/
├── orchestrator-sisyphus.ts    # Orchestrator (1531 lines) - 7-phase delegation
├── sisyphus.ts                 # Main prompt (141 lines) - refactored
├── sisyphus/constants.ts       # Constants extracted from sisyphus.ts (554 lines)
├── sisyphus-junior.ts          # Delegated task executor
├── sisyphus-prompt-builder.ts  # Dynamic prompt generation
├── oracle.ts                   # Strategic advisor (GPT-5.2) - factory pattern
├── librarian.ts                # Multi-repo research (GLM-4.7-free) - factory pattern
├── explore.ts                  # Fast grep (Grok Code) - factory pattern
├── frontend-ui-ux-engineer.ts  # UI specialist (Gemini 3 Pro) - factory pattern
├── document-writer.ts          # Technical writer (Gemini 3 Flash) - factory pattern
├── multimodal-looker.ts        # Media analyzer (Gemini 3 Flash) - factory pattern
├── prometheus-prompt.ts        # Planning (1196 lines) - interview mode
├── metis.ts                    # Plan consultant - pre-planning analysis - factory pattern
├── momus.ts                    # Plan reviewer - validation - factory pattern
├── types.ts                    # AgentModelConfig interface
├── utils.ts                    # createBuiltinAgents(), getAgentName()
├── utils/
│   └── factory.ts              # Agent factory utilities (178 lines)
└── index.ts                    # builtinAgents export
```

## AGENT MODELS

| Agent | Model | Temperature | Purpose |
|-------|-------|-------------|---------|
| Sisyphus | anthropic/claude-opus-4-5 | 0.1 | Primary orchestrator, todo-driven |
| oracle | openai/gpt-5.2 | 0.1 | Read-only consultation, debugging |
| librarian | opencode/glm-4.7-free | 0.1 | Docs, GitHub search, OSS examples |
| explore | opencode/grok-code | 0.1 | Fast contextual grep |
| frontend-ui-ux-engineer | google/gemini-3-pro-preview | 0.7 | UI generation, visual design |
| document-writer | google/gemini-3-flash | 0.3 | Technical documentation |
| multimodal-looker | google/gemini-3-flash | 0.1 | PDF/image analysis |
| Prometheus | anthropic/claude-opus-4-5 | 0.1 | Strategic planning, interview mode |
| Metis | anthropic/claude-sonnet-4-5 | 0.1 | Pre-planning gap analysis |
| Momus | anthropic/claude-sonnet-4-5 | 0.1 | Plan validation |

## HOW TO ADD

1. Create `src/agents/my-agent.ts` using factory pattern
2. Add to `builtinAgents` in `src/agents/index.ts`
3. Update `AgentNameSchema` in `src/config/schema.ts`
4. Register in `src/index.ts` initialization

## FACTORY PATTERN

Use factory functions from `src/agents/utils/factory.ts` for consistent agent creation:

```typescript
import { createAgentFactory, createGptAgentFactory } from "./utils/factory"

const DEFAULT_MODEL = "anthropic/claude-opus-4-5"
const MY_PROMPT = `...`

export const createMyAgent = createAgentFactory({
  description: "My custom agent description",
  mode: "subagent",
  defaultModel: DEFAULT_MODEL,
  prompt: MY_PROMPT,
  restrictedTools: ["write", "edit", "task", "delegate_task"],
  temperature: 0.1,
})

export const myAgent = createMyAgent()
```

### Factory Functions

| Factory | Use When | Auto-Configuration |
|---------|----------|-------------------|
| `createAgentFactory` | Base factory with full control | Applies `reasoningEffort` (GPT) or `thinking` (Claude) based on model type |
| `createGptAgentFactory` | GPT-default agents | `reasoningEffort: "medium"`; if model resolves to Claude, applies `thinking: { type: "enabled", budgetTokens: 32000 }` and removes GPT-specific fields |
| `createClaudeAgentFactory` | Claude-default agents | `thinking: { type: "enabled", budgetTokens: 32000 }` |
| `createUnrestrictedAgentFactory` | No tool restrictions | All tools allowed |

### Model Detection

- `isGptModel()`: Detects GPT models (`openai/`, `github-copilot/gpt-*`)
- `isClaudeModel()`: Detects Claude models (`anthropic/claude-*`)
- Other models (Gemini, GLM, etc.): No model-specific configuration applied

### Options Interface

```typescript
interface AgentFactoryOptions {
  description: string       // Agent description
  mode: "primary" | "subagent"
  defaultModel: string      // Fallback model
  prompt: string            // System prompt
  restrictedTools?: string[] // Tools to deny
  allowedTools?: string[]   // Tools to allow (whitelist)
  temperature?: number      // Default: 0.1
  reasoningEffort?: "low" | "medium" | "high"  // GPT only
  thinking?: { type: "enabled"; budgetTokens: number }  // Claude only
  extra?: Partial<AgentConfig>  // Additional config merge
}
```

## TOOL RESTRICTIONS

| Agent | Denied Tools |
|-------|-------------|
| oracle | write, edit, task, delegate_task |
| librarian | write, edit, task, delegate_task, call_omo_agent |
| explore | write, edit, task, delegate_task, call_omo_agent |
| multimodal-looker | Allowlist: read, glob, grep |

## KEY PATTERNS

- **Factory**: Use appropriate factory for model type (Claude/GPT/Generic)
- **Metadata**: `XXX_PROMPT_METADATA: AgentPromptMetadata`
- **Tool restrictions**: `restrictedTools` or `allowedTools` in factory options
- **Model-specific config**: Only applied to matching models (no Claude `thinking` on Gemini)
- **Manual agent creation**: Use factories instead of direct `AgentConfig` construction
