import type { PruningState, ErroredToolCall } from "./pruning-types"
import { estimateTokens } from "./pruning-types"
import {
  readMessages,
  isToolProtectedByTurn,
  type TurnProtectionConfig,
} from "./pruning-utils"
import { log } from "../../shared/logger"

export interface PurgeErrorsConfig {
  enabled: boolean
  turns: number
  protectedTools?: string[]
}

export function executePurgeErrors(
  sessionID: string,
  state: PruningState,
  config: PurgeErrorsConfig,
  protectedTools: Set<string>,
  turnProtection?: TurnProtectionConfig
): number {
  if (!config.enabled) return 0

  const messages = readMessages(sessionID)
  const maxTurn = state.currentTurn
  
  let turnCounter = 0
  let prunedCount = 0
  let tokensSaved = 0
  
  for (const msg of messages) {
    if (!msg.parts) continue
    
    for (const part of msg.parts) {
      if (part.type === "step-start") {
        turnCounter++
        continue
      }
      
      if (part.type !== "tool" || !part.callID || !part.tool) continue
      
      if (protectedTools.has(part.tool)) continue
      
      if (config.protectedTools?.includes(part.tool)) continue
      
      if (state.toolIdsToPrune.has(part.callID)) continue
      
      if (part.state?.status !== "error") continue
      
      if (isToolProtectedByTurn(turnCounter, maxTurn, turnProtection)) {
        log("[pruning-purge-errors] skipping protected turn", {
          tool: part.tool,
          callID: part.callID,
          turn: turnCounter,
          maxTurn,
        })
        continue
      }
      
      const turnAge = maxTurn - turnCounter
      
      if (turnAge >= config.turns) {
        state.toolIdsToPrune.add(part.callID)
        prunedCount++
        
        const input = part.state.input
        if (input) {
          tokensSaved += estimateTokens(JSON.stringify(input))
        }
        
        const errorInfo: ErroredToolCall = {
          callID: part.callID,
          toolName: part.tool,
          turn: turnCounter,
          errorAge: turnAge,
        }
        
        state.erroredTools.set(part.callID, errorInfo)
        
        log("[pruning-purge-errors] pruned old error", {
          tool: part.tool,
          callID: part.callID,
          turn: turnCounter,
          errorAge: turnAge,
          threshold: config.turns,
        })
      }
    }
  }
  
  log("[pruning-purge-errors] complete", {
    prunedCount,
    tokensSaved,
    currentTurn: maxTurn,
    threshold: config.turns,
  })
  
  return prunedCount
}
