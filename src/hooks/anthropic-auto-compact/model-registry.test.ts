import { describe, expect, test } from "bun:test"
import { getModelMaxTokens, getModelInfo } from "./model-registry"

describe("getModelMaxTokens", () => {
  test("returns maxTokens for known Anthropic models", () => {
    expect(getModelMaxTokens("anthropic", "claude-opus-4-5")).toBe(200000)
    expect(getModelMaxTokens("anthropic", "claude-sonnet-4-5")).toBe(200000)
    expect(getModelMaxTokens("anthropic", "claude-haiku-4-5")).toBe(200000)
    expect(getModelMaxTokens("anthropic", "claude-3-opus-20240229")).toBe(200000)
  })

  test("returns maxTokens for known OpenAI models", () => {
    expect(getModelMaxTokens("openai", "gpt-4-turbo")).toBe(128000)
    expect(getModelMaxTokens("openai", "gpt-4o")).toBe(128000)
    expect(getModelMaxTokens("openai", "o1")).toBe(200000)
    expect(getModelMaxTokens("openai", "gpt-3.5-turbo")).toBe(16385)
  })

  test("returns maxTokens for known Google models", () => {
    expect(getModelMaxTokens("google", "gemini-1.5-pro")).toBe(2000000)
    expect(getModelMaxTokens("google", "gemini-1.5-flash")).toBe(1000000)
    expect(getModelMaxTokens("google", "gemini-2.0-flash-exp")).toBe(1000000)
  })

  test("returns maxTokens for OpenCode models", () => {
    expect(getModelMaxTokens("opencode", "grok-code")).toBe(128000)
    expect(getModelMaxTokens("opencode", "big-pickle")).toBe(128000)
  })

  test("returns undefined for unknown provider", () => {
    expect(getModelMaxTokens("unknown-provider", "some-model")).toBeUndefined()
  })

  test("returns undefined for unknown model", () => {
    expect(getModelMaxTokens("anthropic", "unknown-model")).toBeUndefined()
  })

  test("returns undefined for undefined inputs", () => {
    expect(getModelMaxTokens(undefined, "gpt-4")).toBeUndefined()
    expect(getModelMaxTokens("openai", undefined)).toBeUndefined()
    expect(getModelMaxTokens(undefined, undefined)).toBeUndefined()
  })
})

describe("getModelInfo", () => {
  test("returns full model info including description", () => {
    const info = getModelInfo("anthropic", "claude-opus-4-5")
    expect(info).toEqual({
      maxTokens: 200000,
      description: "Claude Opus 4.5",
    })
  })

  test("returns undefined for unknown models", () => {
    expect(getModelInfo("unknown", "model")).toBeUndefined()
  })
})
