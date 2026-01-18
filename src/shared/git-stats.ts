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
 * Gets git diff statistics for the specified directory.
 * Returns an empty array if git is not available or no changes exist.
 *
 * @param directory - The directory to get git stats for
 * @returns Array of GitFileStat objects representing changed files
 */
export function getGitDiffStats(directory: string): GitFileStat[] {
  try {
    const statusOutput = execSync("git status --porcelain", {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5000,
    }).trim()

    const statusMap = new Map<string, "modified" | "added" | "deleted">()
    for (const line of statusOutput.split("\n")) {
      if (!line) continue
      const status = line.substring(0, 2).trim()
      const filePath = line.substring(3)
      // Check for status codes indicating deleted files first (D, AD, MD, etc.)
      // This must come before checking for "A" to correctly classify "AD" as deleted, not added
      if (status.includes("D")) {
        statusMap.set(filePath, "deleted")
      } else if (status.includes("A") || status.includes("?")) {
        statusMap.set(filePath, "added")
      } else {
        statusMap.set(filePath, "modified")
      }
    }

    const output = execSync("git diff --numstat HEAD", {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5000,
    }).trim()

    if (!output) {
      // No tracked changes, but there might be untracked files
      const untrackedFiles = statusOutput.split("\n").filter((line) =>
        line.trim().startsWith("??")
      )
      const stats: GitFileStat[] = []
      for (const line of untrackedFiles) {
        const filePath = line.substring(3)
        try {
          // Get line count for untracked files (since they have no diff)
          const linesOutput = execSync(`wc -l "${filePath}"`, {
            cwd: directory,
            encoding: "utf-8",
            timeout: 5000,
          }).trim()
          const lines = parseInt(linesOutput.split(/\s+/)[0], 10)
          stats.push({
            path: filePath,
            added: lines || 0,
            removed: 0,
            status: "added",
          })
        } catch {
          // If wc fails, just add the file without line count
          stats.push({
            path: filePath,
            added: 0,
            removed: 0,
            status: "added",
          })
        }
      }
      return stats
    }

    const stats: GitFileStat[] = []
    for (const line of output.split("\n")) {
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
  } catch {
    return []
  }
}

/**
 * Formats git file changes into a human-readable summary.
 *
 * @param stats - Array of GitFileStat objects
 * @param notepadPath - Optional path to notepad file for highlighting
 * @returns Formatted string with file changes summary
 */
export function formatFileChanges(stats: GitFileStat[], notepadPath?: string): string {
  if (stats.length === 0) return "[FILE CHANGES SUMMARY]\nNo file changes detected.\n"

  const modified = stats.filter((s) => s.status === "modified")
  const added = stats.filter((s) => s.status === "added")
  const deleted = stats.filter((s) => s.status === "deleted")

  const lines: string[] = ["[FILE CHANGES SUMMARY]"]

  if (modified.length > 0) {
    lines.push("Modified files:")
    for (const f of modified) {
      lines.push(`  ${f.path}  (+${f.added}, -${f.removed})`)
    }
    lines.push("")
  }

  if (added.length > 0) {
    lines.push("Created files:")
    for (const f of added) {
      lines.push(`  ${f.path}  (+${f.added})`)
    }
    lines.push("")
  }

  if (deleted.length > 0) {
    lines.push("Deleted files:")
    for (const f of deleted) {
      lines.push(`  ${f.path}  (-${f.removed})`)
    }
    lines.push("")
  }

  if (notepadPath) {
    const notepadStat = stats.find((s) => s.path === notepadPath || s.path.includes(notepadPath))
    if (notepadStat) {
      lines.push("[NOTEPAD UPDATED]")
      lines.push(`  ${notepadStat.path}  (+${notepadStat.added})`)
      lines.push("")
    }
  }

  return lines.join("\n")
}
