import { describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { execSync } from "node:child_process"
import { getGitDiffStats, formatFileChanges, type GitFileStat } from "./git-stats"

describe("getGitDiffStats", () => {
  const createTestDir = () => join(tmpdir(), `git-stats-${Date.now()}-${Math.random().toString(16).slice(2)}`)

  test("returns empty array when git is not available", () => {
    //#given
    const nonGitDir = join(__dirname, ".non-git-dir")

    //#when
    const result = getGitDiffStats(nonGitDir)

    //#then
    expect(result).toEqual([])
  })

  test("returns empty array when no changes exist", () => {
    //#given
    const testDir = createTestDir()
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    execSync("git init", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.email 'test@example.com'", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.name 'Test User'", { cwd: testDir, stdio: "ignore" })
    execSync("git commit --allow-empty -m initial", { cwd: testDir, stdio: "ignore" })

    //#when
    const result = getGitDiffStats(testDir)

    //#then
    expect(result).toEqual([])

    rmSync(testDir, { recursive: true, force: true })
  })

  test("returns stats for modified files", () => {
    //#given
    const testDir = createTestDir()
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    execSync("git init", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.email 'test@example.com'", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.name 'Test User'", { cwd: testDir, stdio: "ignore" })
    const testFile = join(testDir, "test.ts")
    writeFileSync(testFile, "original content\n")
    execSync("git add .", { cwd: testDir, stdio: "ignore" })
    execSync("git commit -m initial", { cwd: testDir, stdio: "ignore" })
    writeFileSync(testFile, "modified content\nnew line\n")

    //#when
    const result = getGitDiffStats(testDir)

    //#then
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe("test.ts")
    expect(result[0].status).toBe("modified")
    expect(result[0].added).toBeGreaterThan(0)
    expect(result[0].removed).toBeGreaterThan(0)

    rmSync(testDir, { recursive: true, force: true })
  })

  test("returns stats for added files", () => {
    //#given
    const testDir = createTestDir()
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    execSync("git init", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.email 'test@example.com'", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.name 'Test User'", { cwd: testDir, stdio: "ignore" })
    execSync("git commit --allow-empty -m initial", { cwd: testDir, stdio: "ignore" })
    const testFile = join(testDir, "newfile.ts")
    writeFileSync(testFile, "new file content\n")

    //#when
    const result = getGitDiffStats(testDir)

    //#then
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe("newfile.ts")
    expect(result[0].status).toBe("added")
    expect(result[0].added).toBeGreaterThan(0)
    expect(result[0].removed).toBe(0)

    rmSync(testDir, { recursive: true, force: true })
  })

  test("includes untracked files (??) in stats", () => {
    //#given
    const testDir = createTestDir()
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    execSync("git init", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.email 'test@example.com'", { cwd: testDir, stdio: "ignore" })
    execSync("git config user.name 'Test User'", { cwd: testDir, stdio: "ignore" })
    execSync("git commit --allow-empty -m initial", { cwd: testDir, stdio: "ignore" })
    const untrackedFile = join(testDir, "untracked.ts")
    writeFileSync(untrackedFile, "untracked file content\n")

    //#when
    const result = getGitDiffStats(testDir)

    //#then
    expect(result.length).toBeGreaterThan(0)
    const untrackedStat = result.find((s) => s.path === "untracked.ts")
    expect(untrackedStat).toBeDefined()
    expect(untrackedStat?.status).toBe("added")
    expect(untrackedStat?.added).toBeGreaterThan(0)

    rmSync(testDir, { recursive: true, force: true })
  })
})

describe("formatFileChanges", () => {
  test("returns formatted string with no changes", () => {
    //#given
    const stats: GitFileStat[] = []

    //#when
    const result = formatFileChanges(stats)

    //#then
    expect(result).toContain("[FILE CHANGES SUMMARY]")
    expect(result).toContain("No file changes detected.")
  })

  test("returns formatted string with modified files", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "file1.ts",
        added: 10,
        removed: 5,
        status: "modified",
      },
      {
        path: "file2.ts",
        added: 3,
        removed: 1,
        status: "modified",
      },
    ]

    //#when
    const result = formatFileChanges(stats)

    //#then
    expect(result).toContain("[FILE CHANGES SUMMARY]")
    expect(result).toContain("Modified files:")
    expect(result).toContain("file1.ts  (+10, -5)")
    expect(result).toContain("file2.ts  (+3, -1)")
  })

  test("returns formatted string with added files", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "newfile.ts",
        added: 15,
        removed: 0,
        status: "added",
      },
    ]

    //#when
    const result = formatFileChanges(stats)

    //#then
    expect(result).toContain("Created files:")
    expect(result).toContain("newfile.ts  (+15)")
  })

  test("returns formatted string with deleted files", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "oldfile.ts",
        added: 0,
        removed: 20,
        status: "deleted",
      },
    ]

    //#when
    const result = formatFileChanges(stats)

    //#then
    expect(result).toContain("[FILE CHANGES SUMMARY]")
    expect(result).toContain("Deleted files:")
    expect(result).toContain("oldfile.ts (-20)\n")
  })

  test("includes notepad section when notepadPath matches", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "src/notepad.md",
        added: 25,
        removed: 5,
        status: "modified",
      },
    ]

    //#when
    const result = formatFileChanges(stats, "src/notepad.md")

    //#then
    expect(result).toContain("[NOTEPAD UPDATED]")
    expect(result).toContain("src/notepad.md  (+25)")
  })

  test("does not include notepad section when path does not match", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "src/notepad.md",
        added: 25,
        removed: 5,
        status: "modified",
      },
    ]

    //#when
    const result = formatFileChanges(stats, "other/notepad.md")

    //#then
    expect(result).not.toContain("[NOTEPAD UPDATED]")
  })

  test("includes partial path match for notepad", () => {
    //#given
    const stats: GitFileStat[] = [
      {
        path: "src/custom/notepad/custom.md",
        added: 30,
        removed: 10,
        status: "modified",
      },
    ]

    //#when
    const result = formatFileChanges(stats, "custom/notepad/custom.md")

    //#then
    expect(result).toContain("[NOTEPAD UPDATED]")
    expect(result).toContain("src/custom/notepad/custom.md  (+30)")
  })
})
