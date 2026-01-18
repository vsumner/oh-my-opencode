import { describe, it, expect } from "bun:test"
import { OutputFormatter, type GitFileStat, type FormatChangesOptions } from "./OutputFormatter"

describe("OutputFormatter", () => {
  describe("formatFileChanges", () => {
    it("returns correct message for empty stats", () => {
      const formatter = new OutputFormatter()
      const result = formatter.formatFileChanges([])
      expect(result).toBe("[FILE CHANGES SUMMARY]\nNo file changes detected.\n")
    })

    it("includes modified files section", () => {
      const formatter = new OutputFormatter()
      const stats: GitFileStat[] = [
        { path: "test.ts", added: 10, removed: 2, status: "modified" },
        { path: "other.ts", added: 5, removed: 1, status: "modified" },
      ]
      const result = formatter.formatFileChanges(stats)
      expect(result).toContain("Modified files:")
      expect(result).toContain("  test.ts  (+10, -2)")
      expect(result).toContain("  other.ts  (+5, -1)")
    })

    it("includes added files section", () => {
      const formatter = new OutputFormatter()
      const stats: GitFileStat[] = [
        { path: "new.ts", added: 20, removed: 0, status: "added" },
      ]
      const result = formatter.formatFileChanges(stats)
      expect(result).toContain("Created files:")
      expect(result).toContain("  new.ts  (+20)")
    })

    it("includes deleted files section", () => {
      const formatter = new OutputFormatter()
      const stats: GitFileStat[] = [
        { path: "old.ts", added: 0, removed: 5, status: "deleted" },
      ]
      const result = formatter.formatFileChanges(stats)
      expect(result).toContain("Deleted files:")
      expect(result).toContain("  old.ts  (-5)")
    })

    it("includes notepad update when notepadPath provided", () => {
      const formatter = new OutputFormatter()
      const stats: GitFileStat[] = [
        { path: ".sisyphus/notepad.md", added: 15, removed: 3, status: "modified" },
      ]
      const options: FormatChangesOptions = {
        notepadPath: ".sisyphus/notepad.md",
      }
      const result = formatter.formatFileChanges(stats, options)
      expect(result).toContain("[NOTEPAD UPDATED]")
      expect(result).toContain("  .sisyphus/notepad.md  (+15)")
    })

    it("handles mixed status types", () => {
      const formatter = new OutputFormatter()
      const stats: GitFileStat[] = [
        { path: "modified.ts", added: 10, removed: 2, status: "modified" },
        { path: "added.ts", added: 15, removed: 0, status: "added" },
        { path: "deleted.ts", added: 0, removed: 5, status: "deleted" },
      ]
      const result = formatter.formatFileChanges(stats)
      expect(result).toContain("Modified files:")
      expect(result).toContain("Created files:")
      expect(result).toContain("Deleted files:")
    })
  })

  describe("createOutputFormatter", () => {
    it("returns OutputFormatter instance", () => {
      const formatter = createOutputFormatter()
      expect(formatter).toBeInstanceOf(OutputFormatter)
      expect(formatter.formatFileChanges).toBeDefined()
    })
  })
})
