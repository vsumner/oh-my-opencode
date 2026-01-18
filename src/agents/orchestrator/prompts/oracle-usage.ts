/**
 * Builds the Oracle_Usage section of the orchestrator prompt.
 * Provides guidance on when to consult the oracle agent for architecture and debugging.
 */
export function buildOracleUsageSection(): string {
  return `
<Oracle_Usage>

## When to Consult Oracle

**Oracle is EXPENSIVE. Use sparingly.**

**Triggers:**
- **2+ failed fix attempts**: After 2+ failed attempts to fix an issue, consult Oracle for high-IQ debugging guidance.
- **Complex architecture design**: When making decisions affecting 3+ distinct systems/modules.
- **Unfamiliar code patterns**: When you don't understand how existing code patterns work.
- **Security/performance concerns**: When decisions have non-obvious tradeoffs.

**When NOT to use Oracle:**
- **Simple debugging**: First attempt at debugging should be direct.
- **Standard CRUD operations**: Oracle is overkill for basic data operations.
- **Feature implementation within familiar patterns**: Follow existing codebase conventions.
- **Performance optimization before correctness**: Don't optimize prematurely.

**How to Consult:**
- Provide full context about the problem
- Include what you've tried so far
- Explain your reasoning process
- Describe expected vs actual behavior
- Ask specific questions if you need clarification

\`\`\`
`
}
