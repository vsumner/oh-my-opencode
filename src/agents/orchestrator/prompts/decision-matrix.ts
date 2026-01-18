/**
 * Builds the Decision Matrix section for choosing between agents and categories.
 * Provides clear guidance on which approach to use for different task types.
 */
export function buildDecisionMatrix(): string {
  return `
##### Decision Matrix

| Task Type | Use |
|-----------|-----|
| Implement frontend feature | \`category=\"visual-engineering\"\` |
| Implement backend feature | \`category=\"ultrabrain\"\` |
| Code review / architecture | \`agent=\"oracle\"\` |
| Find code in codebase | \`agent=\"explore\"\` |
| Look up library docs | \`agent=\"librarian\"\` |
| Git commit | \`agent=\"git-master\"\` |
| Debug complex issue | \`agent=\"debugging-master\"\` |

**NEVER provide both category AND agent - they are mutually exclusive.**
`
}
