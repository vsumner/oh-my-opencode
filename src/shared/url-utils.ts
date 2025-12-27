import { pathToFileURL, fileURLToPath } from "url"

/**
 * Converts a file system path to a proper file:// URL.
 * Handles Windows paths (backslashes, drive letters) and special characters.
 *
 * @param filePath - Absolute or relative file path
 * @returns Properly formatted file:// URL
 *
 * @example
 * // Unix
 * toFileURL("/home/user/file.ts") // "file:///home/user/file.ts"
 *
 * // Windows
 * toFileURL("C:\\Users\\test\\file.ts") // "file:///C:/Users/test/file.ts"
 * toFileURL("C:\\path with spaces\\file.ts") // "file:///C:/path%20with%20spaces/file.ts"
 */
export function toFileURL(filePath: string): string {
  return pathToFileURL(filePath).href
}

/**
 * Converts a file:// URL to a file system path.
 * Handles URL-encoded characters and platform-specific path formats.
 *
 * @param fileURL - file:// URL string
 * @returns Platform-specific file path
 *
 * @example
 * // Unix
 * fromFileURL("file:///home/user/file.ts") // "/home/user/file.ts"
 *
 * // Windows
 * fromFileURL("file:///C:/Users/test/file.ts") // "C:\\Users\\test\\file.ts"
 * fromFileURL("file:///C:/path%20with%20spaces/file.ts") // "C:\\path with spaces\\file.ts"
 */
export function fromFileURL(fileURL: string): string {
  return fileURLToPath(fileURL)
}
