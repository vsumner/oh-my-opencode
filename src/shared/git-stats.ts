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
 * Handles both tracked files (XY path) and untracked files (?? path).
 */
function parseFileStatus(line: string): "modified" | "added" | "deleted" {
  const trimmed = line.trim()
  if (!trimmed) return "modified"

  const statusChar = trimmed.substring(0, 1)
  // Untracked files: "?? path/to/file" - status at index 0, path at index 3+
  if (trimmed.startsWith("??")) {
    return "added" as const
  }

  // Tracked files: "XY path/to/file" - status at index 0, path at index 2
  if (statusChar === "D") {
    return "deleted" as const
  }
  if (statusChar === "A" || statusChar === "?") {
    return "added" as const
  }
  return "modified" as const
}

/**
 * Gets line count for an untracked file.
 * Reads file directly to avoid command injection risks.
 */
function getUntrackedFileLines(filePath: string, directory: string): number {
  try {
    const fullPath = join(directory, filePath)
    const content = readFileSync(fullPath, "utf-8")
    // Count newlines: split by \n and count segments
    // Empty file = 0 lines, "hello" = 1 line, "hello\n" = 1 line
    const lines = content.split("\n")
    // If file ends with \n, last segment is empty, so length - 1
    // If file doesn't end with \n, last segment has content, so length
    return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
  } catch {
    // Silently return 0 for unreadable files (permission, deleted, etc.)
    return 0
  }
}

/**
 * Processes untracked files and returns their stats.
 */
function parsePorcelainPath(rawPath: string): string {
  const trimmed = rawPath.trim()
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed.slice(1, -1).replace(/\\\\/g, "\\").replace(/\\\"/g, "\"")
  }
  return trimmed
}

function processUntrackedFiles(
  statusOutput: string,
  directory: string
): GitFileStat[] {
  const untrackedLines = statusOutput.split("\n").filter((line) =>
    line.trim().startsWith("??")
  )

  return untrackedLines.map((line) => {
    const filePath = parsePorcelainPath(line.substring(3))
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
      const trimmed = line.trim()
      // Parse: "XY path/to/file" or "?? path/to/file"
      // For tracked files: status at index 0, path at index 2
      // For untracked files: path at index 3
      const pathStart = trimmed.startsWith("??") ? 3 : 2
      const rawPath = trimmed.substring(pathStart)
      const path = parsePorcelainPath(rawPath)
      const status = parseFileStatus(line)
      statusMap.set(path, status)
    }

    // Try to get git diff, but don't let failure drop untracked files
    const stats: GitFileStat[] = []
    try {
      const diffOutput = execSync("git diff --numstat HEAD", {
        cwd: directory,
        encoding: "utf-8",
        timeout: 5000,
      }).trim()

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
    } catch {
      // git diff failed (no HEAD, no commits), but untracked files still matter
      // Continue with empty stats array
    }

    // Always include untracked files, even when tracked changes don't exist
    const untrackedStats = processUntrackedFiles(statusOutput, directory)
    return stats.concat(untrackedStats)
  } catch {
    // Gracefully return empty array for non-git directories or git failures
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
      lines.push(`  ${f.path} (-${f.removed})`)
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
