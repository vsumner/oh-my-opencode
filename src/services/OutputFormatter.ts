import type { GitFileStat } from "./GitService"

/**
 * Interface for output formatting service.
 * Provides markdown formatting for various data types.
 */
export interface IOutputFormatter {
  /**
   * Formats file changes summary as markdown.
   * @param stats - Array of git file change statistics
   * @param options - Optional formatting parameters
   * @returns Formatted markdown string
   */
  formatFileChanges(stats: GitFileStat[], options?: FormatChangesOptions): string
}

/**
 * Formatting options for file changes summary.
 */
export interface FormatChangesOutputOptions {
  notepadPath?: string
}

/**
 * Output formatter implementation.
 * Handles markdown formatting of file changes and other outputs.
 */
export class OutputFormatter implements IOutputFormatter {
  /**
   * Formats file changes summary as markdown.
   * Groups changes by status (modified, added, deleted).
   * Separates notepad updates when notepadPath provided.
   * 
   * @param stats - Array of git file change statistics
   * @param options - Optional formatting parameters including notepadPath
   * @returns Formatted markdown string with file changes summary
   */
  formatFileChanges(stats: GitFileStat[], options?: FormatChangesOutputOptions): string {
    if (stats.length === 0) {
      return "[FILE CHANGES SUMMARY]\nNo file changes detected.\n"
    }

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

    if (options?.notepadPath) {
      const notepadStat = stats.find(
        (s) => s.path.includes("notepad") || s.path.includes(".sisyphus")
      )
      if (notepadStat) {
        lines.push("[NOTEPAD UPDATED]")
        lines.push(`  ${notepadStat.path}  (+${notepadStat.added})`)
        lines.push("")
      }
    }

    return lines.join("\n")
      const notepadStat = stats.find(
        (s) => s.path.includes("notepad") || s.path.includes(".sisyphus")
      )
      if (notepadStat) {
        lines.push("[NOTEPAD UPDATED]")
        lines.push(`  ${notepadStat.path}  (+${notepadStat.added})`)
        lines.push("")
      }
    }

    return lines.join("\n")
  }
}

/**
 * Factory function to create an OutputFormatter instance.
 */
export function createOutputFormatter(): IOutputFormatter {
  return new OutputFormatter()
}
