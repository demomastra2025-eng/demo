"use client";

import { useAssistantState } from "@assistant-ui/react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import mermaid from "mermaid";
import { type FC, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Props for the MermaidDiagram component.
 */
export type MermaidDiagramProps = SyntaxHighlighterProps & {
  className?: string;
};

// Configure mermaid once for the client.
mermaid.initialize({ theme: "default", startOnLoad: false });

/**
 * MermaidDiagram component for rendering Mermaid diagrams inside markdown.
 * Use it via `componentsByLanguage` in `markdown-text.tsx`.
 */
export const MermaidDiagram: FC<MermaidDiagramProps> = ({
  code,
  className,
  node: _node,
  components: _components,
  language: _language,
}) => {
  void _node;
  void _components;
  void _language;

  const ref = useRef<HTMLPreElement>(null);

  const isComplete = useAssistantState(({ part }) => {
    if (part.type !== "text") return false;

    const codeIndex = part.text.indexOf(code);
    if (codeIndex === -1) return false;

    const afterCode = part.text.substring(codeIndex + code.length);
    const closingBackticksMatch = afterCode.match(/^```|^\n```/);
    return closingBackticksMatch !== null;
  });

  useEffect(() => {
    if (!isComplete) return;

    (async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const result = await mermaid.render(id, code);
        if (ref.current) {
          ref.current.innerHTML = result.svg;
          result.bindFunctions?.(ref.current);
        }
      } catch (error) {
        console.warn("Failed to render Mermaid diagram:", error);
      }
    })();
  }, [isComplete, code]);

  return (
    <pre
      ref={ref}
      className={cn(
        "aui-mermaid-diagram rounded-b-lg bg-muted p-2 text-center [&_svg]:mx-auto",
        className,
      )}
    >
      Drawing diagram...
    </pre>
  );
};

MermaidDiagram.displayName = "MermaidDiagram";
