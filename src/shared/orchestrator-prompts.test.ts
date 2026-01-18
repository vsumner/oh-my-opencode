import { describe, it, expect } from "bun:test"
import {
  buildAgentSelectionSection,
  buildCategorySection,
  buildSkillsSection,
  buildDecisionMatrix,
} from "./orchestrator-prompts"

describe("orchestrator-prompts", () => {
  describe("buildAgentSelectionSection", () => {
    it("returns default table when no agents provided", () => {
      const result = buildAgentSelectionSection([])
      expect(result).toContain("Option B: Use AGENT directly")
      expect(result).toContain("| `oracle` | Read-only consultation")
    })

    it("includes provided agents in table", () => {
      const agents = [
        { name: "test-agent", description: "Test description for this agent" },
      ] as any
      const result = buildAgentSelectionSection(agents)
      expect(result).toContain("| `test-agent` | Test description for this agent |")
    })

    it("uses first sentence of description when period present", () => {
      const agents = [
        { name: "agent-one", description: "First sentence. Second sentence." },
      ] as any
      const result = buildAgentSelectionSection(agents)
      expect(result).toContain("| `agent-one` | First sentence |")
    })
  })

  describe("buildCategorySection", () => {
    it("includes default categories when no user categories provided", () => {
      const result = buildCategorySection()
      expect(result).toContain("Option A: Use CATEGORY")
      expect(result).toContain("| Category | Temperature")
    })

    it("merges user categories with defaults", () => {
      const userCategories = {
        "custom-category": { temperature: 0.7, model: "test-model" },
      } as any
      const result = buildCategorySection(userCategories)
      expect(result).toContain("| `custom-category` | 0.7 |")
    })

    it("shows temperature in table", () => {
      const userCategories = {
        "test-cat": { temperature: 0.3 },
      } as any
      const result = buildCategorySection(userCategories)
      expect(result).toContain("| `test-cat` | 0.3 |")
    })
  })

  describe("buildSkillsSection", () => {
    it("returns empty string when no skills provided", () => {
      const result = buildSkillsSection([])
      expect(result).toBe("")
    })

    it("includes skills table when skills provided", () => {
      const skills = [
        { name: "test-skill", description: "Test skill description" },
      ] as any
      const result = buildSkillsSection(skills)
      expect(result).toContain("Skill Selection")
      expect(result).toContain("| `test-skill` | Test skill description |")
    })

    it("uses first sentence of skill description when period present", () => {
      const skills = [
        { name: "skill-one", description: "First sentence. More text here." },
      ] as any
      const result = buildSkillsSection(skills)
      expect(result).toContain("| `skill-one` | First sentence |")
    })

    it("includes usage examples with playwright", () => {
      const skills = [
        { name: "playwright", description: "Browser automation" },
      ] as any
      const result = buildSkillsSection(skills)
      expect(result).toContain("| `playwright` | Browser automation |")
    })
  })

  describe("buildDecisionMatrix", () => {
    it("includes visual category when present", () => {
      const userCategories = {
        "visual-engineering": { temperature: 0.7 },
      } as any
      const result = buildDecisionMatrix([], userCategories)
      expect(result).toContain("| Implement frontend feature | `category=\"visual-engineering\"` |")
    })

    it("includes strategic category when present", () => {
      const userCategories = {
        "ultrabrain": { temperature: 0.1 },
      } as any
      const result = buildDecisionMatrix([], userCategories)
      expect(result).toContain("| Implement backend feature | `category=\"ultrabrain\"` |")
    })

    it("includes oracle agent when in list", () => {
      const agents = [{ name: "oracle", description: "Strategic advisor" }] as any
      const result = buildDecisionMatrix(agents)
      expect(result).toContain("| Code review / architecture | `agent=\"oracle\"` |")
    })

    it("includes git-master agent row", () => {
      const result = buildDecisionMatrix([])
      expect(result).toContain("| Git commit | `agent=\"git-master\"` |")
    })

    it("warns about mutual exclusivity", () => {
      const result = buildDecisionMatrix([])
      expect(result).toContain("NEVER provide both category AND agent")
      expect(result).toContain("they are mutually exclusive")
    })
  })
})
