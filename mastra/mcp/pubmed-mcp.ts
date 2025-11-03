import { MCPClient } from '@mastra/mcp';

// Environment settings for the PubMed MCP server.
// Defaults to stdio transport to minimize noisy logging output unless overridden.
const env: Record<string, string> = {
  MCP_TRANSPORT_TYPE: process.env.PUBMED_MCP_TRANSPORT ?? 'stdio',
};

if (process.env.PUBMED_MCP_LOG_LEVEL) {
  env.MCP_LOG_LEVEL = process.env.PUBMED_MCP_LOG_LEVEL;
} else if (process.env.MCP_LOG_LEVEL) {
  env.MCP_LOG_LEVEL = process.env.MCP_LOG_LEVEL;
}

if (process.env.PUBMED_MCP_HTTP_PORT) {
  env.MCP_HTTP_PORT = process.env.PUBMED_MCP_HTTP_PORT;
}

if (process.env.PUBMED_MCP_HTTP_HOST) {
  env.MCP_HTTP_HOST = process.env.PUBMED_MCP_HTTP_HOST;
}

if (process.env.PUBMED_MCP_AUTH_MODE) {
  env.MCP_AUTH_MODE = process.env.PUBMED_MCP_AUTH_MODE;
}

if (process.env.PUBMED_MCP_AUTH_SECRET_KEY) {
  env.MCP_AUTH_SECRET_KEY = process.env.PUBMED_MCP_AUTH_SECRET_KEY;
}

if (process.env.NCBI_API_KEY) {
  env.NCBI_API_KEY = process.env.NCBI_API_KEY;
}

export const pubmedMcp = new MCPClient({
  id: 'pubmed-mcp',
  servers: {
    pubmed: {
      command: 'npx',
      args: ['@cyanheads/pubmed-mcp-server'],
      env,
      timeout: Number(process.env.PUBMED_MCP_TIMEOUT ?? 60000),
    },
  },
});

export async function getPubmedTools() {
  return pubmedMcp.getTools();
}

export async function getPubmedToolsets() {
  return pubmedMcp.getToolsets();
}

export async function disconnectPubmedMcp(): Promise<void> {
  await pubmedMcp.disconnect();
}

