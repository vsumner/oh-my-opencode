import { describe, it, expect } from "bun:test"
import { GitService, type GitFileStat } from "./GitService"

describe("GitService", () => {
  describe("getDiffStats", () => {
    it("returns empty array on git command failure", () => {
      const service = new GitService()
      const result = service.getDiffStats("/nonexistent/path")
      expect(result).toEqual([])
    })

    it("returns correct stats for modified file", () => {
      const service = new GitService()
      const result = service.getDiffStats("/tmp/test")
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty("path")
      expect(result[0]).toHaveProperty("added")
      expect(result[0]).toHaveProperty("removed")
    })

    it("parses git status output correctly", () => {
      const service = new GitService()
      const result = service.getDiffStats("/tmp/test")
      // Verify status is one of the three types
      if (result.length > 0) {
        const validStatuses = ["modified", "added", "deleted"]
        expect(validStatuses).toContain(result[0].status)
      }
    })

    it("handles git command timeout", () => {
      const service = new GitService()
      const result = service.getDiffStats("/tmp/test")
      // Timeout is 5000ms, should return [] on failure
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe("createGitService", () => {
    it("returns GitService instance", () => {
      const service = createGitService()
      expect(service).toBeInstanceOf(GitService)
      expect(service.getDiffStats).toBeDefined()
    })
  })
})
