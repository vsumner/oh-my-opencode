import type { AvailableAgent, AvailableSkill } from "../agents/sisyphus-prompt-builder"
import type { CategoryConfig } from "../config/schema"
import { DEFAULT_CATEGORIES, CATEGORY_DESCRIPTIONS } from "../tools/sisyphus-task/constants"

/**
 * Builds the agent selection section of the orchestrator prompt.
 * Displays available agents in a table format.
 */
export function buildAgentSelectionSection(agents: AvailableAgent[]): string {
  if (agents.length === 0) {
    return `##### Option B: Use AGENT directly (for specialized experts)

| Agent | Best For |
|-------|----------|
| \`oracle\` | Read-only consultation. High-IQ debugging, architecture design |
| \`explore\` | Codebase exploration, pattern finding |
| \`librarian\` | External docs, GitHub examples, OSS reference |
| \`frontend-ui-ux-engineer\` | Visual design, UI implementation |
| \`document-writer\` | README, API docs, guides |
| \`git-master\` | Git commits (ALWAYS use for commits) |
| \`debugging-master\` | Complex debugging sessions |`
  }

  const rows = agents.map((a) => {
    const shortDesc = a.description.split(".")[0] || a.description
    return `| \`${a.name}\` | ${shortDesc} |`
  })

  return `##### Option B: Use AGENT directly (for specialized experts)

| Agent | Best For |
|-------|----------|
${rows.join("\n")}
| \`git-master\` | Git commits (ALWAYS use for commits) |
| \`debugging-master\` | Complex debugging sessions |`
}

/**
 * Builds the category selection section of the orchestrator prompt.
 * Displays available categories with their temperature and best use cases.
 */
export function buildCategorySection(userCategories?: Record<string, CategoryConfig>): string {
  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories }
  const categoryRows = Object.entries(allCategories).map(([name, config]) => {
    const temp = config.temperature ?? 0.5
    const bestFor = CATEGORY_DESCRIPTIONS[name] ?? "General tasks"
    return `| \`${name}\` | ${temp} | ${bestFor} |`
  })

  return `##### Option A: Use CATEGORY (for domain-specific work)

Categories spawn \`Sisyphus-Junior-{category}\` with optimized settings:

| Category | Temperature | Best For |
|----------|-------------|----------|
${categoryRows.join("\n")}

\`\`\`typescript
sisyphus_task(category="visual-engineering", prompt="...")      // UI/frontend work
sisyphus_task(category="ultrabrain", prompt="...")     // Backend/strategic work
\`\`\``
}

/**
 * Builds the skills selection section of the orchestrator prompt.
 * Displays available skills and when to use them.
 */
export function buildSkillsSection(skills: AvailableSkill[]): string {
  if (skills.length === 0) {
    return ""
  }

  const skillRows = skills.map((s) => {
    const shortDesc = s.description.split(".")[0] || s.description
    return `| \`${s.name}\` | ${shortDesc} |`
  })

  return `
#### 3.2.2: Skill Selection (PREPEND TO PROMPT)

**Skills are specialized instructions that guide subagent behavior. Consider them alongside category selection.**

| Skill | When to Use |
|-------|-------------|
${skillRows.join("\n")}

**When to include skills:**
- Task matches a skill's domain (e.g., \`frontend-ui-ux\` for UI work, \`playwright\` for browser automation)
- Multiple skills can be combined

**Usage:**
\`\`\`typescript
sisyphus_task(category="visual-engineering", skills=["frontend-ui-ux"], prompt="...")
sisyphus_task(category="general", skills=["playwright"], prompt="...")  // Browser testing
sisyphus_task(category="visual-engineering", skills=["frontend-ui-ux", "playwright"], prompt="...")  // UI with browser testing
\`\`\`

**IMPORTANT:**
- Skills are OPTIONAL - only include if task clearly benefits from specialized guidance
- Skills get prepended to the subagent's prompt, providing domain-specific instructions
- If no appropriate skill exists, omit the \`skills\` parameter entirely`
}

/**
 * Builds the decision matrix section for choosing between agents and categories.
 * Provides guidance on which approach to use for different task types.
 */
export function buildDecisionMatrix(agents: AvailableAgent[], userCategories?: Record<string, CategoryConfig>): string {
  const allCategories = { ...DEFAULT_CATEGORIES, ...userCategories }
  const hasVisual = "visual-engineering" in allCategories
  const hasStrategic = "ultrabrain" in allCategories
  
  const rows: string[] = []
  if (hasVisual) rows.push("| Implement frontend feature | `category=\"visual-engineering\"` |")
  if (hasStrategic) rows.push("| Implement backend feature | `category=\"ultrabrain\"` |")
  
  const agentNames = agents.map((a) => a.name)
  if (agentNames.includes("oracle")) rows.push("| Code review / architecture | `agent=\"oracle\"` |")
  if (agentNames.includes("explore")) rows.push("| Find code in codebase | `agent=\"explore\"` |")
  if (agentNames.includes("librarian")) rows.push("| Look up library docs | `agent=\"librarian\"` |")
  rows.push("| Git commit | `agent=\"git-master\"` |")
  rows.push("| Debug complex issue | `agent=\"debugging-master\"` |")

  return `##### Decision Matrix

| Task Type | Use |
|-----------|-----|
${rows.join("\n")}

**NEVER provide both category AND agent - they are mutually exclusive.**`
}
