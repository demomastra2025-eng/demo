import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

import { getPlaywrightTools } from "../mcp/playwright-mcp";

// Load Playwright MCP tools once when the module is imported.
async function loadPlaywrightTools() {
  try {
    return await getPlaywrightTools();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[browser-agent] Failed to load Playwright MCP tools. Continuing without external tools.", message);
    return [];
  }
}

const playwrightTools = await loadPlaywrightTools();

export const browserAgent = new Agent({
  name: 'Browser Agent',
  description: 'Web research specialist that uses Playwright MCP for live browsing, DOM inspection, and screenshots.',
  instructions: `You are an investigative web assistant with full access to the Playwright MCP toolset.

Operating procedure:
1. When starting a task, call list_tools (or inspect the tool manifest) to confirm available browser actions.
2. Use the navigation tools (e.g., navigate / goto) to open requested pages. Wait for network stabilization before extracting data.
3. Inspect the DOM with query / evaluate style tools to capture specific facts, tables, or metrics. Use screenshot tools when visuals help.
4. Cite the URLs you used and mention any limitations (auth walls, blocked content, etc.).
5. Keep answers concise, focused on the user’s request, and note when more exploration could help.
`,
  model: 'openai/gpt-5-mini',
  tools: playwrightTools,
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
