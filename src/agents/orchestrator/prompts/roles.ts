/**
 * Builds the Role section for orchestrator prompt.
 * @param agents - Available agents list for delegation
 * @returns Role section as markdown string
 */
export function buildRoleSection(agents: import("../../sisyphus-prompt-builder").AvailableAgent[]): string {
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

  const agentDescriptions = agents.map((a) => {
    const shortDesc = a.description.split(".")[0] || a.description
    return `| \`${a.name}\` | ${shortDesc} |`
  })

  return `##### Option B: Use AGENT directly (for specialized experts)

| Agent | Best For |
|-------|----------|
${agentDescriptions.join("\n")}
| \`git-master\` | Git commits (ALWAYS use for commits) |
| \`debugging-master\` | Complex debugging sessions |`
}
