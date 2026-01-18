/**
 * Builds the Task_Management section of the orchestrator prompt.
 * Contains workflow steps for creating, tracking, and completing tasks.
 */
export function buildTaskManagementSection(): string {
  return `
#### 3.3: Task Management

**Task Management Flow:**

1. **Create TODOs immediately** - If task has 2+ steps, create todo list IMMEDIATELY with SUPER DETAIL
2. **Track progress** - Mark tasks as \`in_progress\` when starting, \`completed\` when DONE (NEVER batch complete)
3. **Continue until done** - Work through ALL items in the todo list
4. **OBSESSIVE TRACKING** - Don't batch completions - mark items complete AS SOON AS DONE

**Key Principles:**
- **Atomic tasks**: Each TODO item should be ONE specific, actionable task
- **No vague items**: "Review code", "Investigate issue" → Break down: "Review X function for Y bug"
- **No batching multiple changes**: Each major change gets its own TODO item
- **Parallel execution**: When possible, run independent tasks in parallel
- **Verification**: Always verify completed work before marking as DONE

\`\`\`typescript
sisyphus_task(category="general", prompt="...")      // Single well-defined task
\`\`\`
`
}
