import { execSync } from "node:child_process"

/**
 * Represents file change statistics from git.
 */
export interface GitFileStat {
  path: string
  added: number
  removed: number
  status: "modified" | "added" | "deleted"
}

/**
 * Formatting options for file changes summary.
 */
export interface FormatChangesOptions {
  notepadPath?: string
}

/**
 * Interface for Git operations service.
 * Provides git command execution and data parsing with error handling.
 */
export interface IGitService {
  /**
   * Gets diff statistics for the given directory.
   * @param directory - Git repository directory path
   * @returns Array of file change statistics, empty array on error
   */
  getDiffStats(directory: string): GitFileStat[]
}

/**
 * Git service implementation.
 * Handles git command execution and diff statistics parsing.
 */
export class GitService implements IGitService {
  /**
   * Gets diff statistics for the given directory.
   * Executes git diff --numstat and git status commands.
   * Parses output into structured GitFileStat array.
   * 
   * @param directory - Git repository directory path
   * @returns Array of file change statistics, empty array on error
   */
  getDiffStats(directory: string): GitFileStat[] {
    try {
      const diffOutput = execSync("git diff --numstat HEAD", {
        cwd: directory,
        encoding: "utf-8",
        timeout: 5000,
      }).trim()

      if (!diffOutput) return []

      const statusOutput = execSync("git status --porcelain", {
        cwd: directory,
        encoding: "utf-8",
        timeout: 5000,
      }).trim()

      // Build status map from git status output
      const statusMap = new Map<string, "modified" | "added" | "deleted">()
      for (const line of statusOutput.split("\n")) {
        if (!line) continue

        const status = line.substring(0, 2).trim()
        const filePath = line.substring(3)

        if (status === "A" || status === "??") {
          statusMap.set(filePath, "added")
        } else if (status === "D") {
          statusMap.set(filePath, "deleted")
        } else {
          statusMap.set(filePath, "modified")
        }
      }

      // Parse diff stats from git diff --numstat output
      const stats: GitFileStat[] = []
      for (const line of diffOutput.split("\n")) {
        const parts = line.split("\t")
        if (parts.length < 3) continue

        const [addedStr, removedStr, path] = parts
        const added = addedStr === "-" ? 0 : parseInt(addedStr, 10)
        const removed = removedStr === "-" ? 0 : parseInt(removedStr, 10)

        stats.push({
          path,
          added,
          removed,
          status: statusMap.get(path) ?? "modified",
        })
      }

      return stats
    } catch (error) {
      // Log error and return empty array
      console.error("GitService.getDiffStats error:", error)
      return []
    }
  }
}

/**
 * Factory function to create a GitService instance.
 */
export function createGitService(): IGitService {
  return new GitService()
}
