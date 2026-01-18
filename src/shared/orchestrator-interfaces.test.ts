import { describe, it, expect, mock } from "bun:test"
import {
  IBoulderStateService,
  ISessionService,
  IBackgroundTaskService,
} from "../services"

// Mock implementations for testing
const mockBoulderService: IBoulderStateService = {
  readBoulderState: async (planPath) => {
    return null
  },
}

const mockSessionService: ISessionService = {
  getMainSessionID: async () => null,
}

const mockBackgroundTaskService: IBackgroundTaskService = {
  spawnTask: async () => ({ taskId: "test-task" } as { taskId: string }),
  getTasksByParentSession: async () => new Map(),
  getTaskOutput: async () => null,
  getRunningTasks: async () => [],
  cancelTask: async () => ({ success: true }),
}

const mockGitService: Partial<IGitService> = {
  getDiffStats: async () => [],
}

const mockOutputFormatter: Partial<IOutputFormatter> = {
  formatFileChanges: async () => "",
}

describe("orchestrator-interfaces", () => {
  it("exports IBoulderStateService interface", () => {
    expect(typeof IBoulderStateService).toBe("object")
    expect(IBoulderStateService).toBeDefined()
  })

  it("exports ISessionService interface", () => {
    expect(typeof ISessionService).toBe("object")
    expect(ISessionService).toBeDefined()
  })

  it("exports IBackgroundTaskService interface", () => {
    expect(typeof IBackgroundTaskService).toBe("object")
    expect(IBackgroundTaskService).toBeDefined()
  })

  it("exports IGitService type alias", () => {
    expect(IGitService).toBeDefined()
  })

  it("exports IOutputFormatter type alias", () => {
    expect(IOutputFormatter).toBeDefined()
  })

  it("IBoulderStateService has readBoulderState method", () => {
    expect(typeof mockBoulderService.readBoulderState).toBe("function")
    expect(mockBoulderService.readBoulderState).toBeDefined()
  })

  it("ISessionService has getMainSessionID method", () => {
    expect(typeof mockSessionService.getMainSessionID).toBe("function")
    expect(mockSessionService.getMainSessionID).toBeDefined()
  })

  it("IBackgroundTaskService has spawnTask method", () => {
    expect(typeof mockBackgroundTaskService.spawnTask).toBe("function")
    expect(mockBackgroundTaskService.spawnTask).toBeDefined()
  })

  it("IBackgroundTaskService has getTasksByParentSession method", () => {
    expect(typeof mockBackgroundTaskService.getTasksByParentSession).toBe("function")
    expect(mockBackgroundTaskService.getTasksByParentSession).toBeDefined()
  })

  it("IBackgroundTaskService has getTaskOutput method", () => {
    expect(typeof mockBackgroundTaskService.getTaskOutput).toBe("function")
    expect(mockBackgroundTaskService.getTaskOutput).toBeDefined()
  })

  it("IBackgroundTaskService has getRunningTasks method", () => {
    expect(typeof mockBackgroundTaskService.getRunningTasks).toBe("function")
    expect(mockBackgroundTaskService.getRunningTasks).toBeDefined()
  })

  it("IBackgroundTaskService has cancelTask method", () => {
    expect(typeof mockBackgroundTaskService.cancelTask).toBe("function")
    expect(mockBackgroundTaskService.cancelTask).toBeDefined()
  })

  it("IGitService has getDiffStats method", () => {
    expect(typeof mockGitService.getDiffStats).toBe("function")
    expect(mockGitService.getDiffStats).toBeDefined()
  })

  it("IOutputFormatter has formatFileChanges method", () => {
    expect(typeof mockOutputFormatter.formatFileChanges).toBe("function")
    expect(mockOutputFormatter.formatFileChanges).toBeDefined()
  })
})
