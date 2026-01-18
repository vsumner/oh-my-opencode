import { describe, expect, test } from "bun:test"
import {
  formatDetailedError,
  formatErrorWithSuggestion,
  formatToolError,
} from "./error-formatter"

describe("formatDetailedError", () => {
  test("formats basic error with operation", () => {
    //#given
    const error = new Error("Test error message")
    const ctx = { operation: "test operation" }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("test operation failed")
    expect(result).toContain("**Error**: Test error message")
  })

  test("includes session ID when provided", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      sessionID: "ses_abc123",
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("**Session ID**: ses_abc123")
  })

  test("includes agent and category when provided", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      agent: "oracle",
      category: "high",
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("**Agent**: oracle (category: high)")
  })

  test("formats DelegateTaskArgs when provided", () => {
    //#given
    const error = new Error("Task failed")
    const ctx = {
      operation: "task execution",
      sessionID: "ses_xyz",
      agent: "explore",
      category: "quick",
      args: {
        description: "Find patterns",
        category: "quick",
        subagent_type: "explore",
        run_in_background: true,
        skills: ["git-master"],
      },
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("**Arguments**:")
    expect(result).toContain("- description: \"Find patterns\"")
    expect(result).toContain("- category: quick")
    expect(result).toContain("- subagent_type: explore")
    expect(result).toContain("- run_in_background: true")
    expect(result).toContain("- skills: [git-master]")
  })

  test("handles BigInt in arguments without throwing", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      args: { bigNumber: 1234567890123456789012345678901234567890n },
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    // Should not throw and should format BigInt as string representation
    expect(result).toContain("**Arguments**:")
    expect(result).toContain("1234567890123456789012345678901234567890")
  })

  test("handles circular references in arguments without throwing", () => {
    //#given
    const error = new Error("Test error")
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const ctx = {
      operation: "test",
      args: circular,
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    // Should not throw and should handle circular reference gracefully
    expect(result).toContain("**Arguments**:")
    // Circular references are stringified and include "self: [object Object]"
    expect(result).toContain("self: [object Object]")
  })

  test("formats generic arguments", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      args: { key1: "value1", key2: 42, nested: { a: 1, b: 2 } },
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("- key1: value1")
    expect(result).toContain("- key2: 42")
    expect(result).toContain("- nested:")
  })

  test("handles BigInt in generic arguments without throwing", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      args: { value: 9007199254740991n },
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    // Should not throw and should format BigInt as string
    expect(result).toContain("**Arguments**:")
    expect(result).toContain("9007199254740991")
  })

  test("handles circular references in generic arguments without throwing", () => {
    //#given
    const error = new Error("Test error")
    const obj1: Record<string, unknown> = { name: "obj1" }
    const obj2: Record<string, unknown> = { name: "obj2" }
    obj1.ref = obj2
    obj2.ref = obj1
    const ctx = {
      operation: "test",
      args: obj1,
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    // Should not throw and should handle circular reference gracefully
    expect(result).toContain("**Arguments**:")
  })

  test("includes stack trace when provided", () => {
    //#given
    const error = new Error("Test error")
    const ctx = {
      operation: "test",
      stack: "Error: Test error\n    at test.js:1:1",
    }

    //#when
    const result = formatDetailedError(error, ctx)

    //#then
    expect(result).toContain("**Stack Trace**:")
    expect(result).toContain("```")
  })
})

describe("formatErrorWithSuggestion", () => {
  test("returns suggestion for permission error", () => {
    //#given
    const error = new Error("EACCES: permission denied")
    error.name = "Error"
    ;(error as { code?: string }).code = "EACCES"

    //#when
    const result = formatErrorWithSuggestion(error, "delete file")

    //#then
    expect(result).toContain("Permission denied")
    expect(result).toContain("Cannot delete file")
    expect(result).toContain("elevated permissions")
  })

  test("returns suggestion for file not found", () => {
    //#given
    const error = new Error("ENOENT: no such file")
    error.name = "Error"
    ;(error as { code?: string }).code = "ENOENT"

    //#when
    const result = formatErrorWithSuggestion(error, "read config")

    //#then
    expect(result).toContain("File not found")
    expect(result).toContain("read config")
  })

  test("returns suggestion for ENOSPC (disk full)", () => {
    //#given
    const error = new Error("ENOSPC: no space left")
    error.name = "Error"

    //#when
    const result = formatErrorWithSuggestion(error, "write file")

    //#then
    expect(result).toContain("Disk full")
    expect(result).toContain("Free up disk space")
  })

  test("returns suggestion for EROFS (read-only filesystem)", () => {
    //#given
    const error = new Error("EROFS: read-only file system")
    error.name = "Error"

    //#when
    const result = formatErrorWithSuggestion(error, "write file")

    //#then
    expect(result).toContain("Read-only filesystem")
    expect(result).toContain("Cannot write file")
  })

  test("returns generic message for unknown error", () => {
    //#given
    const error = new Error("Unknown error")

    //#when
    const result = formatErrorWithSuggestion(error, "do something")

    //#then
    expect(result).toBe("Failed to do something: Unknown error")
  })
})

describe("formatToolError", () => {
  test("formats error with tool name", () => {
    //#given
    const error = new Error("Tool execution failed")

    //#when
    const result = formatToolError(error, "execute command", "bash")

    //#then
    expect(result).toContain("execute command failed")
    expect(result).toContain("**Arguments**:")
    expect(result).toContain("- tool: bash")
  })
})
