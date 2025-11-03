import { MCPClient } from '@mastra/mcp';

// Centralized MCP client for the n8n-mcp server.
// Reads configuration from environment variables.
//
// Required for stdio transport:
//   MCP_MODE=stdio (prevents non-JSON logs on stdout)
// Recommended:
//   LOG_LEVEL=error, DISABLE_CONSOLE_OUTPUT=true
// Optional (for managing a remote n8n instance via API):
//   N8N_API_URL, N8N_API_KEY

const env: Record<string, string> = {};
if (process.env.MCP_MODE) env.MCP_MODE = process.env.MCP_MODE!;
else env.MCP_MODE = 'stdio';

env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
env.DISABLE_CONSOLE_OUTPUT = process.env.DISABLE_CONSOLE_OUTPUT || 'true';

if (process.env.N8N_API_URL) env.N8N_API_URL = process.env.N8N_API_URL!;
if (process.env.N8N_API_KEY) env.N8N_API_KEY = process.env.N8N_API_KEY!;

export const n8nMcp = new MCPClient({
  id: 'n8n-mcp',
  servers: {
    // Namespaced as "n8n"; tools will appear with this namespace in getToolsets()
    n8n: {
      command: 'npx',
      args: ['n8n-mcp'],
      env,
      timeout: Number(process.env.N8N_MCP_TIMEOUT ?? 60000),
    },
  },
});

export async function connectN8nMcp(): Promise<void> {
  // Note: MCPClient lazily connects on first call; explicit connect not required.
  // Provided for explicit lifecycle control when needed.
  // No-op: kept for symmetry and future use.
}

export async function getN8nTools() {
  return n8nMcp.getTools();
}

export async function getN8nToolsets() {
  return n8nMcp.getToolsets();
}

export async function disconnectN8nMcp(): Promise<void> {
  await n8nMcp.disconnect();
}

