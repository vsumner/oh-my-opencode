import { describe, test, expect, beforeEach } from "bun:test"
import type { BackgroundTask } from "./types"
import { isRateLimitError, RATE_LIMIT_PATTERNS } from "./manager"

class MockBackgroundManager {
  private tasks: Map<string, BackgroundTask> = new Map()
  private modelCooldowns: Map<string, number> = new Map()

  addTask(task: BackgroundTask): void {
    this.tasks.set(task.id, task)
  }

  getTask(id: string): BackgroundTask | undefined {
    return this.tasks.get(id)
  }

  setCooldown(model: string, expiresAt: number): void {
    this.modelCooldowns.set(model, expiresAt)
  }

  getCooldown(model: string): number | undefined {
    return this.modelCooldowns.get(model)
  }

  resetCooldowns(): void {
    this.modelCooldowns.clear()
  }

  findAvailableFallback(task: BackgroundTask): string | undefined {
    if (!task.fallback) return undefined

    const now = Date.now()
    for (let i = 0; i < task.fallback.length; i++) {
      const candidate = task.fallback[i]
      const cooldownUntil = this.modelCooldowns.get(candidate)

      if (!cooldownUntil || cooldownUntil <= now) {
        task.fallback.splice(i, 1)
        return candidate
      }
    }

    return undefined
  }

  getTasksByParentSession(sessionID: string): BackgroundTask[] {
    const result: BackgroundTask[] = []
    for (const task of this.tasks.values()) {
      if (task.parentSessionID === sessionID) {
        result.push(task)
      }
    }
    return result
  }

  getAllDescendantTasks(sessionID: string): BackgroundTask[] {
    const result: BackgroundTask[] = []
    const directChildren = this.getTasksByParentSession(sessionID)

    for (const child of directChildren) {
      result.push(child)
      const descendants = this.getAllDescendantTasks(child.sessionID)
      result.push(...descendants)
    }

    return result
  }
}

function createMockTask(overrides: Partial<BackgroundTask> & { id: string; sessionID: string; parentSessionID: string }): BackgroundTask {
  return {
    parentMessageID: "mock-message-id",
    description: "test task",
    prompt: "test prompt",
    agent: "test-agent",
    status: "running",
    startedAt: new Date(),
    ...overrides,
  }
}

describe("BackgroundManager.getAllDescendantTasks", () => {
  let manager: MockBackgroundManager

  beforeEach(() => {
    // #given
    manager = new MockBackgroundManager()
  })

  test("should return empty array when no tasks exist", () => {
    // #given - empty manager

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toEqual([])
  })

  test("should return direct children only when no nested tasks", () => {
    // #given
    const taskB = createMockTask({
      id: "task-b",
      sessionID: "session-b",
      parentSessionID: "session-a",
    })
    manager.addTask(taskB)

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("task-b")
  })

  test("should return all nested descendants (2 levels deep)", () => {
    // #given
    // Session A -> Task B -> Task C
    const taskB = createMockTask({
      id: "task-b",
      sessionID: "session-b",
      parentSessionID: "session-a",
    })
    const taskC = createMockTask({
      id: "task-c",
      sessionID: "session-c",
      parentSessionID: "session-b",
    })
    manager.addTask(taskB)
    manager.addTask(taskC)

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toContain("task-b")
    expect(result.map(t => t.id)).toContain("task-c")
  })

  test("should return all nested descendants (3 levels deep)", () => {
    // #given
    // Session A -> Task B -> Task C -> Task D
    const taskB = createMockTask({
      id: "task-b",
      sessionID: "session-b",
      parentSessionID: "session-a",
    })
    const taskC = createMockTask({
      id: "task-c",
      sessionID: "session-c",
      parentSessionID: "session-b",
    })
    const taskD = createMockTask({
      id: "task-d",
      sessionID: "session-d",
      parentSessionID: "session-c",
    })
    manager.addTask(taskB)
    manager.addTask(taskC)
    manager.addTask(taskD)

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toHaveLength(3)
    expect(result.map(t => t.id)).toContain("task-b")
    expect(result.map(t => t.id)).toContain("task-c")
    expect(result.map(t => t.id)).toContain("task-d")
  })

  test("should handle multiple branches (tree structure)", () => {
    // #given
    // Session A -> Task B1 -> Task C1
    //           -> Task B2 -> Task C2
    const taskB1 = createMockTask({
      id: "task-b1",
      sessionID: "session-b1",
      parentSessionID: "session-a",
    })
    const taskB2 = createMockTask({
      id: "task-b2",
      sessionID: "session-b2",
      parentSessionID: "session-a",
    })
    const taskC1 = createMockTask({
      id: "task-c1",
      sessionID: "session-c1",
      parentSessionID: "session-b1",
    })
    const taskC2 = createMockTask({
      id: "task-c2",
      sessionID: "session-c2",
      parentSessionID: "session-b2",
    })
    manager.addTask(taskB1)
    manager.addTask(taskB2)
    manager.addTask(taskC1)
    manager.addTask(taskC2)

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toContain("task-b1")
    expect(result.map(t => t.id)).toContain("task-b2")
    expect(result.map(t => t.id)).toContain("task-c1")
    expect(result.map(t => t.id)).toContain("task-c2")
  })

  test("should not include tasks from unrelated sessions", () => {
    // #given
    // Session A -> Task B
    // Session X -> Task Y (unrelated)
    const taskB = createMockTask({
      id: "task-b",
      sessionID: "session-b",
      parentSessionID: "session-a",
    })
    const taskY = createMockTask({
      id: "task-y",
      sessionID: "session-y",
      parentSessionID: "session-x",
    })
    manager.addTask(taskB)
    manager.addTask(taskY)

    // #when
    const result = manager.getAllDescendantTasks("session-a")

    // #then
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("task-b")
    expect(result.map(t => t.id)).not.toContain("task-y")
  })

  test("getTasksByParentSession should only return direct children (not recursive)", () => {
    // #given
    // Session A -> Task B -> Task C
    const taskB = createMockTask({
      id: "task-b",
      sessionID: "session-b",
      parentSessionID: "session-a",
    })
    const taskC = createMockTask({
      id: "task-c",
      sessionID: "session-c",
      parentSessionID: "session-b",
    })
    manager.addTask(taskB)
    manager.addTask(taskC)

    // #when
    const result = manager.getTasksByParentSession("session-a")

    // #then
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("task-b")
  })
})

describe("isRateLimitError", () => {
  test("should detect 429 status code in error object", () => {
    // #given
    const error = { status: 429, message: "Rate limit exceeded" }

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect 429 status code in nested response", () => {
    // #given
    const error = { response: { status: 429 } }

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect rate limit in error message", () => {
    // #given
    const error = new Error("API rate limit exceeded")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect 429 in error message string", () => {
    // #given
    const error = "Error 429: Too many requests"

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect quota exceeded", () => {
    // #given
    const error = new Error("Quota exceeded for this model")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect throttling", () => {
    // #given
    const error = new Error("Request throttled by server")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect resource exhausted (Google)", () => {
    // #given
    const error = new Error("RESOURCE_EXHAUSTED: Quota exceeded")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect overloaded", () => {
    // #given
    const error = new Error("Service overloaded, please retry")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should return false for non-rate-limit errors", () => {
    // #given
    const error = new Error("Connection timeout")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(false)
  })

  test("should return false for 500 errors", () => {
    // #given
    const error = { status: 500, message: "Internal server error" }

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(false)
  })

  test("should detect message field on non-Error objects", () => {
    // #given
    const error = { message: "Rate limit exceeded", code: "RATE_LIMITED" }

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should detect capacity exceeded", () => {
    // #given
    const error = new Error("Server capacity exceeded")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(true)
  })

  test("should not false positive on storage capacity", () => {
    // #given
    const error = new Error("Storage capacity limit reached")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(false)
  })

  test("should not false positive on memory capacity", () => {
    // #given
    const error = new Error("Memory capacity insufficient")

    // #when
    const result = isRateLimitError(error)

    // #then
    expect(result).toBe(false)
  })
})

describe("findAvailableFallback", () => {
  let manager: MockBackgroundManager

  beforeEach(() => {
    manager = new MockBackgroundManager()
  })

  test("should return first fallback when none are on cooldown", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: ["model-a", "model-b", "model-c"],
    })

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBe("model-a")
    expect(task.fallback).toEqual(["model-b", "model-c"])
  })

  test("should skip models on cooldown", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: ["model-a", "model-b", "model-c"],
    })
    manager.setCooldown("model-a", Date.now() + 60000)

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBe("model-b")
    expect(task.fallback).toEqual(["model-a", "model-c"])
  })

  test("should preserve models on cooldown in fallback array", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: ["model-a", "model-b", "model-c"],
    })
    manager.setCooldown("model-a", Date.now() + 60000)
    manager.setCooldown("model-b", Date.now() + 60000)

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBe("model-c")
    expect(task.fallback).toEqual(["model-a", "model-b"])
  })

  test("should return undefined when all fallbacks on cooldown", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: ["model-a", "model-b"],
    })
    manager.setCooldown("model-a", Date.now() + 60000)
    manager.setCooldown("model-b", Date.now() + 60000)

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBeUndefined()
    expect(task.fallback).toEqual(["model-a", "model-b"])
  })

  test("should return undefined when fallback array is empty", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: [],
    })

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBeUndefined()
  })

  test("should return undefined when no fallback configured", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
    })

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBeUndefined()
  })

  test("should use expired cooldown model", () => {
    // #given
    const task = createMockTask({
      id: "task-1",
      sessionID: "session-1",
      parentSessionID: "session-a",
      fallback: ["model-a", "model-b"],
    })
    manager.setCooldown("model-a", Date.now() - 1000)

    // #when
    const result = manager.findAvailableFallback(task)

    // #then
    expect(result).toBe("model-a")
  })

  test("resetCooldowns should clear all cooldowns", () => {
    // #given
    manager.setCooldown("model-a", Date.now() + 60000)
    manager.setCooldown("model-b", Date.now() + 60000)

    // #when
    manager.resetCooldowns()

    // #then
    expect(manager.getCooldown("model-a")).toBeUndefined()
    expect(manager.getCooldown("model-b")).toBeUndefined()
  })
})
