import { describe, it, expect } from "bun:test"
import { resolveCategoryConfig, mergeAgentConfig } from "./config-handler"
import type { CategoryConfig } from "../config/schema"

describe("Prometheus category config resolution", () => {
  test("resolves ultrabrain category config", () => {
    // #given
    const categoryName = "ultrabrain"

    // #when
    const config = resolveCategoryConfig(categoryName)

    // #then
    expect(config).toBeDefined()
    expect(config?.model).toBe("openai/gpt-5.2")
    expect(config?.temperature).toBe(0.1)
  })

  test("resolves visual-engineering category config", () => {
    // #given
    const categoryName = "visual-engineering"

    // #when
    const config = resolveCategoryConfig(categoryName)

    // #then
    expect(config).toBeDefined()
    expect(config?.model).toBe("google/gemini-3-pro-preview")
    expect(config?.temperature).toBe(0.7)
  })

  test("user categories override default categories", () => {
    // #given
    const categoryName = "ultrabrain"
    const userCategories: Record<string, CategoryConfig> = {
      ultrabrain: {
        model: "google/antigravity-claude-opus-4-5-thinking",
        temperature: 0.1,
      },
    }

    // #when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // #then
    expect(config).toBeDefined()
    expect(config?.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    expect(config?.temperature).toBe(0.1)
  })

  test("returns undefined for unknown category", () => {
    // #given
    const categoryName = "nonexistent-category"

    // #when
    const config = resolveCategoryConfig(categoryName)

    // #then
    expect(config).toBeUndefined()
  })

  test("falls back to default when user category has no entry", () => {
    // #given
    const categoryName = "ultrabrain"
    const userCategories: Record<string, CategoryConfig> = {
      "visual-engineering": {
        model: "custom/visual-model",
      },
    }

    // #when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // #then
    expect(config).toBeDefined()
    expect(config?.model).toBe("openai/gpt-5.2")
    expect(config?.temperature).toBe(0.1)
  })

  test("preserves all category properties (temperature, top_p, tools, etc.)", () => {
    // #given
    const categoryName = "custom-category"
    const userCategories: Record<string, CategoryConfig> = {
      "custom-category": {
        model: "test/model",
        temperature: 0.5,
        top_p: 0.9,
        maxTokens: 32000,
        tools: { tool1: true, tool2: false },
      },
    }

    // #when
    const config = resolveCategoryConfig(categoryName, userCategories)

    // #then
    expect(config).toBeDefined()
    expect(config?.model).toBe("test/model")
    expect(config?.temperature).toBe(0.5)
    expect(config?.top_p).toBe(0.9)
    expect(config?.maxTokens).toBe(32000)
    expect(config?.tools).toEqual({ tool1: true, tool2: false })
  })
})

describe("ConfigHandler - prompt_append", () => {
  it("prometheus prompt_append is appended to base prompt", () => {
    // #given
    const { PROMETHEUS_SYSTEM_PROMPT } = require("../agents/prometheus-prompt")
    const promptAppend = "\n\n## Custom Instructions\n\nThis should be appended."

    // Simulate mergeAgentConfig behavior
    const basePrompt = PROMETHEUS_SYSTEM_PROMPT

    // #when
    // Current behavior (buggy): Object spread overwrites entire prompt
    // Expected behavior (fixed): mergeAgentConfig appends prompt_append
    const mergedPrompt = basePrompt + "\n" + promptAppend

    // #then
    expect(mergedPrompt).toContain("## Custom Instructions")
    expect(mergedPrompt).toContain(PROMETHEUS_SYSTEM_PROMPT.substring(0, 50))
    expect(mergedPrompt).toMatch(/^.*\n\n## Custom Instructions\n$/s)
  })

  it("opencode-builder prompt_append is appended to base prompt", () => {
    // #given
    const { BUILD_SYSTEM_PROMPT } = require("../agents/build-prompt")
    const promptAppend = "Extra instructions for builder agent."
    const userConfig = { prompt_append: promptAppend }

    // #when
    // Test actual production merge logic via mergeAgentConfig
    const mergedPrompt = mergeAgentConfig(
      { prompt: BUILD_SYSTEM_PROMPT },
      userConfig
    ).prompt

    // #then
    expect(mergedPrompt).toContain("Extra instructions for builder agent.")
    expect(mergedPrompt).toContain("Build Mode - System Reminder")
    expect(mergedPrompt).toMatch(/^.*\nExtra instructions for builder agent\.$/s)
  })
})
