import { describe, expect, test } from "bun:test"
import { parseAnthropicTokenLimitError } from "./parser"

describe("parseAnthropicTokenLimitError with model registry fallback", () => {
  test("extracts tokens from error message when available", () => {
    const error = "prompt is too long: 250000 tokens > 200000 maximum"
    const result = parseAnthropicTokenLimitError(error, "anthropic", "claude-opus-4-5")

    expect(result).not.toBeNull()
    expect(result?.currentTokens).toBe(250000)
    expect(result?.maxTokens).toBe(200000)
  })

  test("uses model registry fallback when tokens not in error message", () => {
    const error = "Error: prompt is too long"
    const result = parseAnthropicTokenLimitError(error, "anthropic", "claude-opus-4-5")

    expect(result).not.toBeNull()
    expect(result?.currentTokens).toBe(0)
    expect(result?.maxTokens).toBe(200000)
    expect(result?.errorType).toBe("token_limit_exceeded_string")
  })

  test("uses model registry for OpenAI models", () => {
    const error = { message: "context length exceeded" }
    const result = parseAnthropicTokenLimitError(error, "openai", "gpt-4-turbo")

    expect(result).not.toBeNull()
    expect(result?.maxTokens).toBe(128000)
  })

  test("uses model registry for Google models", () => {
    const error = "token limit error"
    const result = parseAnthropicTokenLimitError(error, "google", "gemini-1.5-pro")

    expect(result).not.toBeNull()
    expect(result?.maxTokens).toBe(2000000)
  })

  test("falls back to 0 when model is unknown", () => {
    const error = "token limit error"
    const result = parseAnthropicTokenLimitError(error, "unknown-provider", "unknown-model")

    expect(result).not.toBeNull()
    expect(result?.maxTokens).toBe(0)
  })

  test("falls back to 0 when provider/model not provided", () => {
    const error = "token limit error"
    const result = parseAnthropicTokenLimitError(error)

    expect(result).not.toBeNull()
    expect(result?.maxTokens).toBe(0)
  })

  test("includes providerID and modelID in result", () => {
    const error = "prompt is too long"
    const result = parseAnthropicTokenLimitError(error, "anthropic", "claude-sonnet-4-5")

    expect(result).not.toBeNull()
    expect(result?.providerID).toBe("anthropic")
    expect(result?.modelID).toBe("claude-sonnet-4-5")
  })

  test("handles non-empty content error with model registry", () => {
    const error = "messages.0: text: Must have non-empty content"
    const result = parseAnthropicTokenLimitError(error, "anthropic", "claude-opus-4-5")

    expect(result).not.toBeNull()
    expect(result?.errorType).toBe("non-empty content")
    expect(result?.maxTokens).toBe(200000)
    expect(result?.messageIndex).toBe(0)
  })

  test("handles bedrock errors with model registry", () => {
    const responseBody = JSON.stringify({
      message: "Input is too long for requested model",
    })
    const error = {
      data: { responseBody },
    }
    const result = parseAnthropicTokenLimitError(error, "bedrock", "anthropic.claude-3-opus-20240229-v1:0")

    expect(result).not.toBeNull()
    expect(result?.errorType).toBe("bedrock_input_too_long")
    expect(result?.maxTokens).toBe(200000)
  })
})
