/**
 * Context information for detailed error formatting.
 */
export interface ErrorContext {
  operation: string
  args?: unknown
  sessionID?: string
  agent?: string
  category?: string
  stack?: string
}

/**
 * Suggestion mapping for common error types.
 */
interface ErrorSuggestion {
  check: (error: unknown) => boolean
  suggestion: (context: string, error: unknown) => string
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
  {
    check: (error: unknown): boolean => isPermissionError(error),
    suggestion: (context: string): string =>
      `Permission denied: Cannot ${context}. Try running with elevated permissions or check file ownership.`,
  },
  {
    check: (error: unknown): boolean => isFileNotFoundError(error),
    suggestion: (context: string): string =>
      `File not found while trying to ${context}. The file may have been deleted or moved.`,
  },
  {
    check: (error: unknown): boolean => error instanceof SyntaxError,
    suggestion: (context: string, error: unknown): string => {
      const message = error instanceof SyntaxError ? error.message : String(error)
      return `JSON syntax error while trying to ${context}: ${message}. Check for missing commas, brackets, or invalid characters.`
    },
  },
  {
    check: (error: unknown): boolean => {
      const message = error instanceof Error ? error.message : String(error)
      return message.includes("ENOSPC")
    },
    suggestion: (context: string): string =>
      `Disk full: Cannot ${context}. Free up disk space and try again.`,
  },
  {
    check: (error: unknown): boolean => {
      const message = error instanceof Error ? error.message : String(error)
      return message.includes("EROFS")
    },
    suggestion: (context: string): string =>
      `Read-only filesystem: Cannot ${context}. Check if filesystem is mounted read-only.`,
  },
]

/**
 * Checks if an error is a permission error.
 */
function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const code = (error as { code?: string }).code

  return (
    code === "EACCES" ||
    code === "EPERM" ||
    code === "ERR_FS_CP_EACCES" ||
    code === "ERR_FS_CP_EPERM"
  )
}

/**
 * Checks if an error is a file not found error.
 */
function isFileNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const nodeErr = error as { code?: string }

  return nodeErr?.code === "ENOENT"
}

/**
 * Formats a detailed error with context information.
 * Used for error reporting in delegate-task, background agents, and other long-running processes.
 *
 * @param error - The error to format
 * @param ctx - Context information about the error
 * @returns Formatted error string with markdown formatting
 *
 * @example
 * ```typescript
 * formatDetailedError(error, {
 *   operation: "task execution",
 *   sessionID: "ses_abc123",
 *   agent: "explore",
 *   category: "quick",
 *   args: { description: "Find auth patterns" }
 * })
 * ```
 */
export function formatDetailedError(error: unknown, ctx: ErrorContext): string {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : ctx.stack

  const lines: string[] = [
    `${ctx.operation} failed`,
    "",
    `**Error**: ${message}`,
  ]

  if (ctx.sessionID) {
    lines.push(`**Session ID**: ${ctx.sessionID}`)
  }

  if (ctx.agent) {
    lines.push(
      `**Agent**: ${ctx.agent}${ctx.category ? ` (category: ${ctx.category})` : ""}`
    )
  }

  if (ctx.args) {
    lines.push("", "**Arguments**:")
    formatArguments(ctx.args, lines)
  }

  if (stack) {
    lines.push("", "**Stack Trace**:")
    lines.push("```")
    lines.push(stack.split("\n").slice(0, 10).join("\n"))
    lines.push("```")
  }

  return lines.join("\n")
}

/**
 * Formats an error with suggestions based on error type.
 * Used for CLI operations, config loading, and file operations.
 *
 * @param error - The error to format
 * @param context - Description of what was being attempted
 * @returns Formatted error with helpful suggestion
 *
 * @example
 * ```typescript
 * formatErrorWithSuggestion(err, "load config file")
 * ```
 */
export function formatErrorWithSuggestion(error: unknown, context: string): string {
  for (const { check, suggestion } of ERROR_SUGGESTIONS) {
    if (check(error)) {
      return suggestion(context, error)
    }
  }

  const message = error instanceof Error ? error.message : String(error)
  return `Failed to ${context}: ${message}`
}

/**
 * Formats an error from a tool execution context.
 * Convenience wrapper around formatDetailedError.
 *
 * @param error - The error to format
 * @param operation - Description of the operation that failed
 * @param tool - Name of the tool that failed
 * @returns Formatted error string
 *
 * @example
 * ```typescript
 * formatToolError(error, "execute LSP goto definition", "lsp_goto_definition")
 * ```
 */
export function formatToolError(
  error: unknown,
  operation: string,
  tool: string
): string {
  return formatDetailedError(error, { operation, args: { tool } })
}

/**
 * Formats arguments for error output.
 * Handles both DelegateTaskArgs and generic unknown arguments.
 */
function formatArguments(args: unknown, lines: string[]): void {
  if (typeof args !== "object" || args === null) {
    lines.push(`- args: ${JSON.stringify(args)}`)
    return
  }

  const argObj = args as Record<string, unknown>

  // Handle DelegateTaskArgs specifically for better formatting
  if ("description" in argObj && typeof argObj.description === "string") {
    lines.push(`- description: "${argObj.description}"`)
    lines.push(`- category: ${argObj.category ?? "(none)"}`)
    lines.push(`- subagent_type: ${argObj.subagent_type ?? "(none)"}`)
    lines.push(`- run_in_background: ${String(argObj.run_in_background ?? "false")}`)
    lines.push(
      `- skills: [${Array.isArray(argObj.skills) ? argObj.skills.join(", ") : ""}]`
    )
    if ("resume" in argObj && typeof argObj.resume === "string") {
      lines.push(`- resume: ${argObj.resume}`)
    }
    return
  }

  // Generic argument formatting
  for (const [key, value] of Object.entries(argObj)) {
    const valueStr =
      typeof value === "string" ? value : JSON.stringify(value, null, 2)
    lines.push(`- ${key}: ${valueStr}`)
  }
}
