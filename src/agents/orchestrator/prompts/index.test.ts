import { describe, it, expect } from "bun:test"

import {
  buildRoleSection,
  buildTaskManagementSection,
  buildBehaviorInstructionsSection,
  buildToneAndStyleSection,
  buildOracleUsageSection,
  buildDecisionMatrix,
} from "."
import type { AvailableAgent } from "../../sisyphus-prompt-builder"

describe("orchestrator-prompt-modules", () => {
  describe("buildRoleSection", () => {
    it("returns default table when no agents provided", () => {
      const result = buildRoleSection([])
      expect(result).toContain("Option B: Use AGENT directly")
      expect(result).toContain("oracle")
      expect(result).toContain("explore")
      expect(result).toContain("librarian")
    })

    it("includes provided agents in table", () => {
      const agents: AvailableAgent[] = [
        { id: "test-agent", name: "test-agent", description: "Test description for this agent." },
        { id: "another-agent", name: "another-agent", description: "Another description." },
      ]
      const result = buildRoleSection(agents)
      expect(result).toContain("| `test-agent` | Test description |")
      expect(result).toContain("| `another-agent` | Another description |")
    })

    it("uses first sentence of description when period present", () => {
      const agents: AvailableAgent[] = [
        { id: "agent-one", name: "agent-one", description: "First sentence. Second sentence." },
      ]
      const result = buildRoleSection(agents)
      expect(result).toContain("| `agent-one` | First sentence |")
      expect(result).not.toContain("Second sentence.")
    })
  })

  describe("buildTaskManagementSection", () => {
    it("returns Task_Management section", () => {
      const result = buildTaskManagementSection()
      expect(result).toContain("## Phase 3: Task Management")
      expect(result).toContain("Create TODOs immediately")
      expect(result).toContain("Atomic tasks")
      expect(result).toContain("Track progress")
      expect(result).toContain("No batching")
    })

    it("includes TODO tracking principles", () => {
      const result = buildTaskManagementSection()
      expect(result).toContain("Mark tasks as `in_progress` when starting")
      expect(result).toContain("Mark `completed` as soon as done")
      expect(result).toContain("No batching")
    })
  })

  describe("buildBehaviorInstructionsSection", () => {
    it("returns Behavior_Instructions section", () => {
      const result = buildBehaviorInstructionsSection()
      expect(result).toContain("## Phase 0 - Intent Gate")
      expect(result).toContain("Key Triggers")
    })
  })

  describe("buildToneAndStyleSection", () => {
    it("returns Tone_and_Style section", () => {
      const result = buildToneAndStyleSection()
      expect(result).toContain("## Communication Style")
      expect(result).toContain("Be Concise")
      expect(result).toContain("No Flattery")
      expect(result).toContain("No Status Updates")
    })

    it("includes challenge guidance", () => {
      const result = buildToneAndStyleSection()
      expect(result).toContain("I notice [observation]")
      expect(result).toContain("Alternative: [your suggestion]")
    })
  })

  describe("buildOracleUsageSection", () => {
    it("returns Oracle_Usage section", () => {
      const result = buildOracleUsageSection()
      expect(result).toContain("## When to Consult Oracle")
      expect(result).toContain("Oracle is EXPENSIVE")
      expect(result).toContain("Use sparingly")
    })

    it("includes cost guidance", () => {
      const result = buildOracleUsageSection()
      expect(result).toContain("Oracle is EXPENSIVE. Use sparingly.")
    })

    it("includes triggers list", () => {
      const result = buildOracleUsageSection()
      expect(result).toContain("Triggers:")
    })
  })

  describe("buildDecisionMatrix", () => {
    it("returns Decision Matrix table", () => {
      const result = buildDecisionMatrix()
      expect(result).toContain("| Task Type | Use |")
      expect(result).toContain("| Implement frontend feature")
      expect(result).toContain("| Implement backend feature")
      expect(result).toContain("| Code review / architecture")
    })

    it("warns about mutual exclusivity", () => {
      const result = buildDecisionMatrix()
      expect(result).toContain("NEVER provide both category AND agent")
      expect(result).toContain("they are mutually exclusive")
    })
  })
})
