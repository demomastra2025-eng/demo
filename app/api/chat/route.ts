import { mastra } from "@/mastra"; // Adjust the import path if necessary

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const payload = await req.json();
  const messages = payload?.messages ?? [];
  const systemMessage =
    typeof payload?.system === "string" && payload.system.trim().length > 0
      ? payload.system
      : undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Messages payload is required", { status: 400 });
  }

  const requestAgentId =
    payload?.agentId ?? payload?.callSettings?.metadata?.agentId;

  const agent =
    mastra.getAgent(requestAgentId ?? "defaultAgent") ??
    mastra.getAgent("defaultAgent");

  const result = await agent.stream(messages, {
    system: systemMessage,
  });

  return result.aisdk.v5.toUIMessageStreamResponse();
}
