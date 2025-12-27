import { describe, test, expect } from "bun:test"
import { toFileURL, fromFileURL } from "./url-utils"
import { platform } from "os"

describe("toFileURL", () => {
  test("converts Unix absolute path", () => {
    // #given
    const unixPath = "/home/user/project/file.ts"

    // #when
    const result = toFileURL(unixPath)

    // #then
    expect(result).toBe("file:///home/user/project/file.ts")
  })

  test("converts Unix path with spaces", () => {
    // #given
    const pathWithSpaces = "/home/user/my project/file name.ts"

    // #when
    const result = toFileURL(pathWithSpaces)

    // #then
    expect(result).toBe("file:///home/user/my%20project/file%20name.ts")
  })

  test("converts Unix path with special characters", () => {
    // #given
    const specialPath = "/home/user/project/generated-image (3).png"

    // #when
    const result = toFileURL(specialPath)

    // #then
    expect(result).toStartWith("file:///")
    expect(result).toContain("generated-image")
  })

  test("converts Windows absolute path", () => {
    // #given
    const winPath = "C:\\Users\\test\\project\\file.ts"

    // #when
    const result = toFileURL(winPath)

    // #then
    if (platform() === "win32") {
      expect(result).toBe("file:///C:/Users/test/project/file.ts")
    } else {
      expect(result).toStartWith("file:///")
      expect(result).toContain("Users/test/project/file.ts")
    }
  })

  test("converts Windows path with spaces", () => {
    // #given
    const winPath = "C:\\Users\\test user\\my project\\file name.ts"

    // #when
    const result = toFileURL(winPath)

    // #then
    if (platform() === "win32") {
      expect(result).toBe("file:///C:/Users/test%20user/my%20project/file%20name.ts")
    } else {
      expect(result).toStartWith("file:///")
      expect(result).toContain("test%20user")
      expect(result).toContain("my%20project")
    }
  })

  test("converts Windows UNC path", () => {
    // #given
    const uncPath = "\\\\server\\share\\folder\\file.ts"

    // #when
    const result = toFileURL(uncPath)

    // #then
    expect(result).toStartWith("file://")
    expect(result).toContain("server")
    expect(result).toContain("share")
  })
})

describe("fromFileURL", () => {
  test("converts Unix file URL", () => {
    // #given
    const fileURL = "file:///home/user/project/file.ts"

    // #when
    const result = fromFileURL(fileURL)

    // #then
    expect(result).toBe("/home/user/project/file.ts")
  })

  test("converts Unix file URL with encoded spaces", () => {
    // #given
    const fileURL = "file:///home/user/my%20project/file%20name.ts"

    // #when
    const result = fromFileURL(fileURL)

    // #then
    expect(result).toBe("/home/user/my project/file name.ts")
  })

  test("converts Windows file URL", () => {
    // #given
    const fileURL = "file:///C:/Users/test/project/file.ts"

    // #when
    const result = fromFileURL(fileURL)

    // #then
    if (platform() === "win32") {
      expect(result).toBe("C:\\Users\\test\\project\\file.ts")
    } else {
      expect(result).toContain("/C:/Users/test/project/file.ts")
    }
  })

  test("converts Windows file URL with encoded spaces", () => {
    // #given
    const fileURL = "file:///C:/Users/test%20user/my%20project/file.ts"

    // #when
    const result = fromFileURL(fileURL)

    // #then
    if (platform() === "win32") {
      expect(result).toBe("C:\\Users\\test user\\my project\\file.ts")
    } else {
      expect(result).toContain("test user")
      expect(result).toContain("my project")
    }
  })
})

describe("roundtrip conversion", () => {
  test("Unix path roundtrip", () => {
    // #given
    const originalPath = "/home/user/my project/file (1).ts"

    // #when
    const url = toFileURL(originalPath)
    const backToPath = fromFileURL(url)

    // #then
    expect(backToPath).toBe(originalPath)
  })

  test("Windows path roundtrip (platform-specific)", () => {
    // #given
    const originalPath =
      platform() === "win32" ? "C:\\Users\\test\\my project\\file.ts" : "/C:/Users/test/my project/file.ts"

    // #when
    const url = toFileURL(originalPath)
    const backToPath = fromFileURL(url)

    // #then
    expect(backToPath).toBe(originalPath)
  })
})
