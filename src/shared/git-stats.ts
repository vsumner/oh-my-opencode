import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

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
 * Parses git status line and returns the file status.
 */
function parseFileStatus(line: string): "modified" | "added" | "deleted" {
  const status = line.substring(0, 2).trim()
  if (status.includes("D")) return "deleted"
  if (status.includes("A") || status.includes("?")) return "added"
  return "modified"
}

/**
 * Gets line count for an untracked file.
 * Reads file directly to avoid command injection risks.
 */
function getUntrackedFileLines(filePath: string, directory: string): number {
  try {
    const fullPath = join(directory, filePath)
    const content = readFileSync(fullPath, "utf-8")
    // Count newlines, handle files with/without trailing newline
    const newlineCount = content.split("\n").length - 1
    return newlineCount >= 0 ? newlineCount : 0
  } catch {
    return 0
  }
}

/**
 * Processes untracked files and returns their stats.
 */
function processUntrackedFiles(
  statusOutput: string,
  directory: string
): GitFileStat[] {
  const untrackedLines = statusOutput.split("\n").filter((line) =>
    line.trim().startsWith("??")
  )

  return untrackedLines.map((line) => {
    const filePath = line.substring(3)
    const lines = getUntrackedFileLines(filePath, directory)
    return {
      path: filePath,
      added: lines,
      removed: 0,
      status: "added" as const,
    }
  })
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

    // Build status map from git status
    const statusMap = new Map<string, "modified" | "added" | "deleted">()
    for (const line of statusOutput.split("\n")) {
      if (!line) continue
      const filePath = line.substring(3)
      statusMap.set(filePath, parseFileStatus(line))
    }

    const diffOutput = execSync("git diff --numstat HEAD", {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5000,
    }).trim()

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

    // Always include untracked files, even when tracked changes exist
    const untrackedStats = processUntrackedFiles(statusOutput, directory)
    return stats.concat(untrackedStats)
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
