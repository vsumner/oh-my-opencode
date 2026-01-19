import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { loadSkillFromFile } from "./loader"

describe("Skill Loader", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync("/tmp/skill-loader-test-")
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("loads skill with frontmatter correctly", () => {
    const skillContent = `---
description: Test skill description
metadata:
  key: value
mcpConfig:
  test-server:
    type: stdio
    command: test-command
---

# Test Skill

This is the template content.
`

    const skillDir = join(tempDir, "test-skill")
    const skillPath = join(skillDir, "SKILL.md")
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(skillPath, skillContent)

    const originalDirname = (global as any).__dirname
    ;(global as any).__dirname = tempDir

    try {
      const skill = loadSkillFromFile("test-skill", tempDir)

      expect(skill).not.toBeNull()
      expect(skill?.name).toBe("test-skill")
      expect(skill?.description).toBe("Test skill description")
      expect(skill?.metadata).toEqual({ key: "value" })
      expect(skill?.mcpConfig).toEqual({
        "test-server": {
          type: "stdio",
          command: "test-command"
        }
      })
      expect(skill?.template).toBe("# Test Skill\n\nThis is the template content.")
    } finally {
      ;(global as any).__dirname = originalDirname
    }
  })

  it("loads skill without frontmatter with defaults", () => {
    const skillContent = `# Test Skill

This is the template content.
`

    const skillDir = join(tempDir, "test-skill")
    const skillPath = join(skillDir, "SKILL.md")
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(skillPath, skillContent)

    const originalDirname = (global as any).__dirname
    ;(global as any).__dirname = tempDir

    try {
      const skill = loadSkillFromFile("test-skill", tempDir)

      expect(skill).not.toBeNull()
      expect(skill?.name).toBe("test-skill")
      expect(skill?.description).toBe("")
      expect(skill?.metadata).toEqual({})
      expect(skill?.mcpConfig).toBeUndefined()
      expect(skill?.template).toBe("# Test Skill\n\nThis is the template content.")
    } finally {
      ;(global as any).__dirname = originalDirname
    }
  })

  it("returns null for missing skill file", () => {
    const originalDirname = (global as any).__dirname
    ;(global as any).__dirname = tempDir

    try {
      const skill = loadSkillFromFile("nonexistent-skill", tempDir)
      expect(skill).toBeNull()
    } finally {
      ;(global as any).__dirname = originalDirname
    }
  })

  it("falls back to flat markdown when SKILL.md is missing", () => {
    const skillContent = `---
description: Flat skill
---

# Flat Skill

Flat template content.
`

    const skillPath = join(tempDir, "flat-skill.md")
    writeFileSync(skillPath, skillContent)

    const skill = loadSkillFromFile("flat-skill", tempDir)
    expect(skill).not.toBeNull()
    expect(skill?.description).toBe("Flat skill")
    expect(skill?.template).toBe("# Flat Skill\n\nFlat template content.")
  })

  it("preserves template content exactly", () => {
    const templateContent = `# Skill Template

Some content with **markdown** formatting.

\`\`\`typescript
const code = "preserved";
\`\`\`

End of template.
`

    const skillContent = `---
description: Test
---

${templateContent}`

    const skillDir = join(tempDir, "test-skill")
    const skillPath = join(skillDir, "SKILL.md")
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(skillPath, skillContent)

    const originalDirname = (global as any).__dirname
    ;(global as any).__dirname = tempDir

    try {
      const skill = loadSkillFromFile("test-skill", tempDir)
      expect(skill?.template).toBe(templateContent.trim())
    } finally {
      ;(global as any).__dirname = originalDirname
    }
  })
})