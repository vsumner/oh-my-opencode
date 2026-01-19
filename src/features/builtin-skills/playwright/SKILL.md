---
name: playwright
description: Browser automation with Playwright MCP for web scraping, testing, and screenshots
---

# Playwright Browser Automation

This skill provides browser automation capabilities via the Playwright MCP server.

## Usage

Trigger via `/playwright` skill or `skill: playwright` tool.

## MCP Configuration

The Playwright MCP server is configured in your MCP settings (typically `~/.claude/.mcp.json` or `~/.config/claude/.mcp.json`).

### Common Playwright Commands

```bash
# Navigate to a URL
npx @playwright/mcp@latest goto https://example.com

# Click an element
npx @playwright/mcp@latest click selector="button#submit"

# Get page text
npx @playwright/mcp@latest page_content

# Take screenshot
npx @playwright/mcp@latest screenshot path=~/screenshot.png
```

### Selector Examples

- CSS selector: `selector="css=.my-class"`
- Text selector: `selector="text=Submit"`
- XPath: `selector="xpath=//button[@type='submit']"`
- Test ID: `selector="testid=my-button"`
