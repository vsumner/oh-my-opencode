import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import type {
  BackgroundTask,
  LaunchInput,
} from "./types"
import type { AgentOverrideConfig } from "../../agents/types"
import { log } from "../../shared/logger"
import {
  findNearestMessageWithFields,
  MESSAGE_STORAGE,
} from "../hook-message-injector"
import { subagentSessions } from "../claude-code-session-state"
import { parseModelString } from "../../shared/model-sanitizer"

type OpencodeClient = PluginInput["client"]

interface MessagePartInfo {
  sessionID?: string
  type?: string
  tool?: string
}

interface EventProperties {
  sessionID?: string
  info?: { id?: string }
  [key: string]: unknown
}

interface Event {
  type: string
  properties?: EventProperties
}

interface Todo {
  content: string
  status: string
  priority: string
  id: string
}

const COOLDOWN_DURATION = 5 * 60 * 1000 // 5 minutes

function getMessageDir(sessionID: string): string | null {
  if (!existsSync(MESSAGE_STORAGE)) return null

  const directPath = join(MESSAGE_STORAGE, sessionID)
  if (existsSync(directPath)) return directPath

  for (const dir of readdirSync(MESSAGE_STORAGE)) {
    const sessionPath = join(MESSAGE_STORAGE, dir, sessionID)
    if (existsSync(sessionPath)) return sessionPath
  }

  return null
}

export class BackgroundManager {
  private tasks: Map<string, BackgroundTask>
  private notifications: Map<string, BackgroundTask[]>
  private client: OpencodeClient
  private directory: string
  private pollingInterval?: ReturnType<typeof setInterval>
  private agentConfigs: Record<string, AgentOverrideConfig> = {}
  private modelCooldowns: Map<string, number> = new Map()

  constructor(ctx: PluginInput) {
    this.tasks = new Map()
    this.notifications = new Map()
    this.client = ctx.client
    this.directory = ctx.directory
  }

  setAgentConfigs(configs: Record<string, AgentOverrideConfig>): void {
    this.agentConfigs = configs
  }

  public resetCooldowns(): void {
    this.modelCooldowns.clear()
    log("[background-agent] All model cooldowns reset")
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuiClient = this.client as any
    if (tuiClient.tui?.showToast) {
      tuiClient.tui.showToast({
        body: {
          title: "Cooldowns Reset",
          message: "All model rate-limit cooldowns have been cleared.",
          variant: "success",
          duration: 3000,
        },
      }).catch(() => {})
    }
  }

  public resetCooldown(model: string): void {
    this.modelCooldowns.delete(model)
    log(`[background-agent] Cooldown reset for model: ${model}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuiClient = this.client as any
    if (tuiClient.tui?.showToast) {
      tuiClient.tui.showToast({
        body: {
          title: "Cooldown Reset",
          message: `Rate-limit cooldown cleared for model: ${model}`,
          variant: "success",
          duration: 3000,
        },
      }).catch(() => {})
    }
  }

  /**
   * Find the next available fallback model that is not on cooldown.
   * Removes checked models from the fallback array as it searches.
   * Returns undefined if all fallbacks are on cooldown.
   */
  private findAvailableFallback(task: BackgroundTask): string | undefined {
    if (!task.fallback) return undefined

    while (task.fallback.length > 0) {
      const candidate = task.fallback[0]
      const cooldownUntil = this.modelCooldowns.get(candidate)
      
      if (!cooldownUntil || cooldownUntil <= Date.now()) {
        return task.fallback.shift()
      }
      
      log(`[background-agent] Skipping fallback "${candidate}" (also on cooldown)`)
      task.fallback.shift()
    }

    return undefined
  }

  async launch(input: LaunchInput): Promise<BackgroundTask> {
    if (!input.agent || input.agent.trim() === "") {
      throw new Error("Agent parameter is required")
    }

    const createResult = await this.client.session.create({
      body: {
        parentID: input.parentSessionID,
        title: `Background: ${input.description}`,
      },
    })

    if (createResult.error) {
      throw new Error(`Failed to create background session: ${createResult.error}`)
    }

    const sessionID = createResult.data.id
    subagentSessions.add(sessionID)

    const agentConfig = this.agentConfigs[input.agent]
    const fallback = agentConfig?.fallback ? [...agentConfig.fallback] : []

    const task: BackgroundTask = {
      id: `bg_${crypto.randomUUID().slice(0, 8)}`,
      sessionID,
      parentSessionID: input.parentSessionID,
      parentMessageID: input.parentMessageID,
      description: input.description,
      prompt: input.prompt,
      agent: input.agent,
      status: "running",
      startedAt: new Date(),
      progress: {
        toolCalls: 0,
        lastUpdate: new Date(),
      },
      parentModel: input.parentModel,
      fallback,
      retryCount: 0,
    }

    this.tasks.set(task.id, task)
    this.startPolling()

    log("[background-agent] Launching task:", { taskId: task.id, sessionID, agent: input.agent })

    this.executeTask(task)

    return task
  }

  private executeTask(task: BackgroundTask, modelOverride?: string): void {
    if (task.status === "cancelled") return;

    // Determine the model being used
    let modelToUse: string | undefined = modelOverride
    if (!modelToUse) {
      const agentConfig = this.agentConfigs[task.agent]
      modelToUse = agentConfig?.model
    }

    // Circuit Breaker: Check if model is on cooldown
    if (modelToUse) {
      const cooldownUntil = this.modelCooldowns.get(modelToUse)
      if (cooldownUntil && cooldownUntil > Date.now()) {
        log(`[background-agent] Skipping rate-limited model "${modelToUse}" (Circuit Breaker active)`)
        
        const nextModel = this.findAvailableFallback(task)
        if (nextModel) {
          log(`[background-agent] Circuit Breaker: Attempting fallback "${nextModel}" for task ${task.id}`)
          this.executeTask(task, nextModel)
          return
        } else {
          task.status = "error"
          task.error = `All models (including fallbacks) are currently rate-limited or unavailable for agent "${task.agent}".`
          task.completedAt = new Date()
          this.markForNotification(task)
          this.notifyParentSession(task)
          return
        }
      }
    }

    const model = modelToUse ? parseModelString(modelToUse) : undefined

    this.client.session.promptAsync({
      path: { id: task.sessionID },
      body: {
        agent: task.agent,
        model,
        tools: {
          task: false,
          background_task: false,
        },
        parts: [{ type: "text", text: task.prompt }],
      },
    }).catch((error) => {
      if (task.status === "cancelled") {
        log("[background-agent] executeTask: Task was cancelled, skipping error handling:", task.id)
        return
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      const isRateLimit = errorMessage.includes("429") || errorMessage.toLowerCase().includes("rate limit")

      log("[background-agent] executeTask error:", { taskId: task.id, error: errorMessage, isRateLimit, modelOverride })

      if (isRateLimit && modelToUse) {
        log(`[background-agent] Rate limit detected. Circuit breaker tripped for ${modelToUse} for 5 minutes.`)
        this.modelCooldowns.set(modelToUse, Date.now() + COOLDOWN_DURATION)
        
        const nextModel = this.findAvailableFallback(task)
        if (nextModel) {
          task.retryCount = (task.retryCount || 0) + 1
          task.status = "running"
          
          log("[background-agent] Rate limit fallback:", { 
            taskId: task.id, 
            fallbackModel: nextModel, 
            retryCount: task.retryCount 
          })
          
          this.executeTask(task, nextModel)
          return
        }
      }

      task.status = "error"
      if (errorMessage.includes("agent.name") || errorMessage.includes("undefined")) {
        task.error = `Agent "${task.agent}" not found. Make sure the agent is registered in your opencode.json or provided by a plugin.`
      } else {
        task.error = errorMessage
      }
      task.completedAt = new Date()
      this.markForNotification(task)
      this.notifyParentSession(task)
    })
  }

  getTask(id: string): BackgroundTask | undefined {
    return this.tasks.get(id)
  }

  public cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    task.status = "cancelled"
    task.completedAt = new Date()
    log("[background-agent] Task cancelled:", taskId)

    this.tasks.delete(taskId)
    this.clearNotificationsForTask(taskId)
    subagentSessions.delete(task.sessionID)
    return true
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

  findBySession(sessionID: string): BackgroundTask | undefined {
    for (const task of this.tasks.values()) {
      if (task.sessionID === sessionID) {
        return task
      }
    }
    return undefined
  }

  private async checkSessionTodos(sessionID: string): Promise<boolean> {
    try {
      const response = await this.client.session.todo({
        path: { id: sessionID },
      })
      const todos = (response.data ?? response) as Todo[]
      if (!todos || todos.length === 0) return false

      const incomplete = todos.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled"
      )
      return incomplete.length > 0
    } catch {
      return false
    }
  }

  handleEvent(event: Event): void {
    const props = event.properties

    if (event.type === "message.part.updated") {
      if (!props || typeof props !== "object" || !("sessionID" in props)) return
      const partInfo = props as unknown as MessagePartInfo
      const sessionID = partInfo?.sessionID
      if (!sessionID) return

      const task = this.findBySession(sessionID)
      if (!task) return

      if (partInfo?.type === "tool" || partInfo?.tool) {
        if (!task.progress) {
          task.progress = {
            toolCalls: 0,
            lastUpdate: new Date(),
          }
        }
        task.progress.toolCalls += 1
        task.progress.lastTool = partInfo.tool
        task.progress.lastUpdate = new Date()
      }
    }

    if (event.type === "session.idle") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      const task = this.findBySession(sessionID)
      if (!task || task.status !== "running") return

      this.checkSessionTodos(sessionID).then((hasIncompleteTodos) => {
        if (hasIncompleteTodos) {
          log("[background-agent] Task has incomplete todos, waiting for todo-continuation:", task.id)
          return
        }

        task.status = "completed"
        task.completedAt = new Date()
        this.markForNotification(task)
        this.notifyParentSession(task)
        log("[background-agent] Task completed via session.idle event:", task.id)
      })
    }

    if (event.type === "session.deleted") {
      const info = props?.info
      if (!info || typeof info.id !== "string") return
      const sessionID = info.id

      const task = this.findBySession(sessionID)
      if (!task) return

      if (task.status === "running") {
        task.status = "cancelled"
        task.completedAt = new Date()
        task.error = "Session deleted"
      }

      this.tasks.delete(task.id)
      this.clearNotificationsForTask(task.id)
      subagentSessions.delete(sessionID)
    }
  }

  markForNotification(task: BackgroundTask): void {
    const queue = this.notifications.get(task.parentSessionID) ?? []
    queue.push(task)
    this.notifications.set(task.parentSessionID, queue)
  }

  getPendingNotifications(sessionID: string): BackgroundTask[] {
    return this.notifications.get(sessionID) ?? []
  }

  clearNotifications(sessionID: string): void {
    this.notifications.delete(sessionID)
  }

  private clearNotificationsForTask(taskId: string): void {
    for (const [sessionID, tasks] of this.notifications.entries()) {
      const filtered = tasks.filter((t) => t.id !== taskId)
      if (filtered.length === 0) {
        this.notifications.delete(sessionID)
      } else {
        this.notifications.set(sessionID, filtered)
      }
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) return

    this.pollingInterval = setInterval(() => {
      this.pollRunningTasks()
    }, 2000)
    this.pollingInterval.unref()
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
    }
  }

  cleanup(): void {
    this.stopPolling()
    this.tasks.clear()
    this.notifications.clear()
  }

  private notifyParentSession(task: BackgroundTask): void {
    const duration = this.formatDuration(task.startedAt, task.completedAt)

    log("[background-agent] notifyParentSession called for task:", task.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuiClient = this.client as any
    if (tuiClient.tui?.showToast) {
      tuiClient.tui.showToast({
        body: {
          title: "Background Task Completed",
          message: `Task "${task.description}" finished in ${duration}.`,
          variant: "success",
          duration: 5000,
        },
      }).catch(() => {})
    }

    const message = `[BACKGROUND TASK COMPLETED] Task "${task.description}" finished in ${duration}. Use background_output with task_id="${task.id}" to get results.`

    log("[background-agent] Sending notification to parent session:", { parentSessionID: task.parentSessionID })

    const taskId = task.id
    setTimeout(async () => {
      try {
        const messageDir = getMessageDir(task.parentSessionID)
        const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null

        const modelContext = task.parentModel ?? prevMessage?.model
        const modelField = modelContext?.providerID && modelContext?.modelID
          ? { providerID: modelContext.providerID, modelID: modelContext.modelID }
          : undefined

        await this.client.session.prompt({
          path: { id: task.parentSessionID },
          body: {
            agent: prevMessage?.agent,
            model: modelField,
            parts: [{ type: "text", text: message }],
          },
          query: { directory: this.directory },
        })
        this.clearNotificationsForTask(taskId)
        log("[background-agent] Successfully sent prompt to parent session:", { parentSessionID: task.parentSessionID })
      } catch (error) {
        log("[background-agent] prompt failed:", String(error))
      } finally {
        this.tasks.delete(taskId)
        log("[background-agent] Removed completed task from memory:", taskId)
      }
    }, 200)
  }

  private formatDuration(start: Date, end?: Date): string {
    const duration = (end ?? new Date()).getTime() - start.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  private hasRunningTasks(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === "running") return true
    }
    return false
  }

  private async pollRunningTasks(): Promise<void> {
    const statusResult = await this.client.session.status()
    const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>

    for (const task of this.tasks.values()) {
      if (task.status !== "running") continue

      try {
        const sessionStatus = allStatuses[task.sessionID]
        
        if (!sessionStatus) {
          log("[background-agent] Session not found in status:", task.sessionID)
          continue
        }

        if (sessionStatus.type === "idle") {
          const hasIncompleteTodos = await this.checkSessionTodos(task.sessionID)
          if (hasIncompleteTodos) {
            log("[background-agent] Task has incomplete todos via polling, waiting:", task.id)
            continue
          }

          task.status = "completed"
          task.completedAt = new Date()
          this.markForNotification(task)
          this.notifyParentSession(task)
          log("[background-agent] Task completed via polling:", task.id)
          continue
        }

        const messagesResult = await this.client.session.messages({
          path: { id: task.sessionID },
        })

        if (!messagesResult.error && messagesResult.data) {
          const messages = messagesResult.data as Array<{
            info?: { role?: string }
            parts?: Array<{ type?: string; tool?: string; name?: string; text?: string }>
          }>
          const assistantMsgs = messages.filter(
            (m) => m.info?.role === "assistant"
          )

          let toolCalls = 0
          let lastTool: string | undefined
          let lastMessage: string | undefined

          for (const msg of assistantMsgs) {
            const parts = msg.parts ?? []
            for (const part of parts) {
              if (part.type === "tool_use" || part.tool) {
                toolCalls++
                lastTool = part.tool || part.name || "unknown"
              }
              if (part.type === "text" && part.text) {
                lastMessage = part.text
              }
            }
          }

          if (!task.progress) {
            task.progress = { toolCalls: 0, lastUpdate: new Date() }
          }
          task.progress.toolCalls = toolCalls
          task.progress.lastTool = lastTool
          task.progress.lastUpdate = new Date()
          if (lastMessage) {
            task.progress.lastMessage = lastMessage
            task.progress.lastMessageAt = new Date()
          }
        }
      } catch (error) {
        log("[background-agent] Poll error for task:", { taskId: task.id, error })
      }
    }

    if (!this.hasRunningTasks()) {
      this.stopPolling()
    }
  }
}
