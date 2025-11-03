import type { FC, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

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
  const toolCount = endIndex - startIndex + 1;
  const label =
    toolCount === 1
      ? `Tool call #${startIndex + 1}`
      : `Tool calls #${startIndex + 1}–${endIndex + 1}`;

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
          {toolCount} {toolCount === 1 ? "entry" : "entries"}
        </span>
      </summary>
      <div className="aui-tool-group-content space-y-3 border-t border-border bg-background/80 px-4 py-3">
        {children}
      </div>
    </details>
  );
};

