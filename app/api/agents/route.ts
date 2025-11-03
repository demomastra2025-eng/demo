import { mastra } from "@/mastra";
import { NextResponse } from "next/server";

type AgentDescriptor = {
  id: string;
  label: string;
  description: string;
  system: string;
};

const normalizeInstructions = (instructions: unknown): string => {
  if (typeof instructions === "string") {
    return instructions;
  }

  if (
    instructions &&
    typeof instructions === "object" &&
    "content" in instructions &&
    Array.isArray((instructions as { content?: unknown }).content)
  ) {
    const parts = (instructions as { content: Array<{ text?: string }> }).content
      .map((chunk) => chunk?.text ?? "")
      .filter((chunk): chunk is string => typeof chunk === "string" && chunk.trim().length > 0);
    return parts.join("\n\n");
  }

  return "";
};

export async function GET() {
  const agentsRecord = mastra.getAgents();

  const agents: AgentDescriptor[] = await Promise.all(
    Object.entries(agentsRecord).map(async ([id, agent]) => {
      const description =
        typeof agent.getDescription === "function"
          ? agent.getDescription()
          : "";

      let system = "";

      try {
        const resolvedInstructions =
          typeof agent.getInstructions === "function"
            ? await agent.getInstructions()
            : undefined;
        system = normalizeInstructions(resolvedInstructions);
      } catch {
        system = "";
      }

      return {
        id,
        label: agent.name ?? id,
        description,
        system,
      };
    }),
  );

  return NextResponse.json({ agents });
}
