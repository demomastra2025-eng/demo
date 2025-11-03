import { MCPClient } from '@mastra/mcp';

const env: Record<string, string> = {};

// Default to stdio transport to avoid non-JSON noise on stdout.
env.MCP_MODE = process.env.PLAYWRIGHT_MCP_MODE ?? 'stdio';

// Reduce Playwright MCP logging unless explicitly overridden.
if (process.env.PLAYWRIGHT_MCP_LOG_LEVEL) {
  env.LOG_LEVEL = process.env.PLAYWRIGHT_MCP_LOG_LEVEL;
} else if (process.env.LOG_LEVEL) {
  env.LOG_LEVEL = process.env.LOG_LEVEL;
}

if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
}

export const playwrightMcp = new MCPClient({
  id: 'playwright-mcp',
  servers: {
    browser: {
      command: 'npx',
      args: ['@playwright/mcp@latest'],
      env,
      timeout: Number(process.env.PLAYWRIGHT_MCP_TIMEOUT ?? 60000),
    },
  },
});

export async function connectPlaywrightMcp(): Promise<void> {
  // Provided for symmetry with other MCP clients; no-op for now.
}

export async function getPlaywrightTools() {
  return playwrightMcp.getTools();
}

export async function getPlaywrightToolsets() {
  return playwrightMcp.getToolsets();
}

export async function disconnectPlaywrightMcp(): Promise<void> {
  await playwrightMcp.disconnect();
}
