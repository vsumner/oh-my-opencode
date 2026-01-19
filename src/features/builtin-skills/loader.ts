import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "../../shared/frontmatter"
import type { SkillMcpConfig } from "../skill-mcp-manager/types"
import type { BuiltinSkill } from "./types"

const SKILL_FILE_NAME = "SKILL.md"

/**
 * Resolves builtin skill file path using SKILL.md-first convention.
 */
function resolveSkillPath(name: string, baseDir: string): string | null {
  const skillDirPath = join(baseDir, name)
  const skillMdPath = join(skillDirPath, SKILL_FILE_NAME)
  if (existsSync(skillMdPath)) {
    return skillMdPath
  }

  const flatMdPath = join(baseDir, `${name}.md`)
  if (existsSync(flatMdPath)) {
    return flatMdPath
  }

  return null
}

/**
 * Loads a skill from a markdown file.
 * Handles missing files gracefully by returning null.
 */
export function loadSkillFromFile(name: string, baseDir: string = __dirname): BuiltinSkill | null {
  const filePath = resolveSkillPath(name, baseDir)

  if (!filePath) {
    return null
  }

  const content = readFileSync(filePath, "utf-8")
  const { data: attributes, body } = parseFrontmatter(content)

  const description = typeof attributes.description === "string" ? attributes.description : ""
  const metadata = (attributes.metadata as Record<string, unknown>) ?? {}
  const mcpConfig = attributes.mcpConfig as SkillMcpConfig | undefined

  return {
    name,
    description,
    template: body.trim(),
    metadata,
    mcpConfig,
  }
}

/**
 * Creates builtin skills array.
 */
export function createBuiltinSkills(): BuiltinSkill[] {
  const playwright = loadSkillFromFile("playwright")
  const frontend = loadSkillFromFile("frontend-ui-ux")
  const gitMaster = loadSkillFromFile("git-master")

  return [playwright, frontend, gitMaster].filter((skill): skill is BuiltinSkill => skill !== null)
}
