type CommandSource = "claude-code" | "opencode"

export function sanitizeModelField(model: unknown, source: CommandSource = "claude-code"): string | undefined {
  if (source === "claude-code") {
    return undefined
  }
  
  if (typeof model === "string" && model.trim().length > 0) {
    return model.trim()
  }
  return undefined
}

/**
 * Parses a model string into providerID and modelID.
 * Splits by the first slash.
 * Example: "anthropic/claude-3-5-sonnet" -> { providerID: "anthropic", modelID: "claude-3-5-sonnet" }
 * If no slash, returns { providerID: "unknown", modelID: model }.
 */
export function parseModelString(model: string): { providerID: string, modelID: string } {
  const slashIndex = model.indexOf("/")
  if (slashIndex === -1) {
    return { providerID: "unknown", modelID: model }
  }
  return {
    providerID: model.substring(0, slashIndex),
    modelID: model.substring(slashIndex + 1),
  }
}
