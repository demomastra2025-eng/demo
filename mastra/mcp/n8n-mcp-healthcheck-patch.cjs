const path = require("node:path");

const pkgEntry = require.resolve("n8n-mcp");
const distDir = path.dirname(pkgEntry);
const serverModule = require(path.join(distDir, "mcp/server.js"));

if (serverModule?.N8NDocumentationMCPServer) {
  const { N8NDocumentationMCPServer } = serverModule;
  const originalValidate = N8NDocumentationMCPServer.prototype.validateDatabaseHealth;
  const { logger } = require(path.join(distDir, "utils/logger.js"));

  if (typeof originalValidate === "function") {
    N8NDocumentationMCPServer.prototype.validateDatabaseHealth = async function patchedValidateDatabaseHealth() {
      try {
        await originalValidate.call(this);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("fts5")) {
          logger.warn(
            "[n8n-mcp] FTS5 extension unavailable. Continuing with LIKE-based search."
          );
          logger.warn(
            "[n8n-mcp] Install better-sqlite3 (native) to enable full-text search."
          );
          return;
        }

        throw error;
      }
    };
  }
}
