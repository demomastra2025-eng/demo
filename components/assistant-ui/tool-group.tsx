import type { FC, PropsWithChildren } from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useMessage } from "@assistant-ui/react";

type ToolGroupProps = PropsWithChildren<{
  startIndex: number;
  endIndex: number;
}>;

/**
 * Groups consecutive tool call parts into a collapsible section so the user
 * can scan large tool responses without scrolling through every item.
 */
export const ToolGroup: FC<ToolGroupProps> = ({
  startIndex,
  endIndex,
  children,
}) => {
  const messageContent = useMessage((state) => state.content);
  const toolLabels = useMemo(() => {
    if (!messageContent || messageContent.length === 0) {
      return [] as string[];
    }

    const tools: string[] = [];

    for (let index = startIndex; index <= endIndex; index += 1) {
      const part = messageContent[index];
      if (!part || part.type !== "tool-call") continue;
      if (typeof part.toolName === "string" && part.toolName.length > 0) {
        tools.push(part.toolName);
      }
    }

    return tools;
  }, [messageContent, startIndex, endIndex]);

  const label =
    toolLabels.length === 1
      ? `Tool: ${toolLabels[0]}`
      : toolLabels.length > 1
        ? `Tools: ${toolLabels.join(", ")}`
        : `Tools`;
  const toolCount =
    toolLabels.length > 0 ? toolLabels.length : endIndex - startIndex + 1;

  return (
    <details
      className={cn(
        "aui-tool-group group my-3 overflow-hidden rounded-lg border border-border bg-muted/40 transition-colors",
        "open:bg-muted/60",
      )}
    >
      <summary className="aui-tool-group-summary flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-foreground outline-none">
        <span>{label}</span>
        <span className="aui-tool-group-count text-xs text-muted-foreground">
          {toolCount} {toolCount === 1 ? "вызов" : "вызова"}
        </span>
      </summary>
      <div className="aui-tool-group-content space-y-3 border-t border-border bg-background/80 px-4 py-3">
        {children}
      </div>
    </details>
  );
};
