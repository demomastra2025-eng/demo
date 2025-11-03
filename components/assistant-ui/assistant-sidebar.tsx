import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { FC, PropsWithChildren } from "react";

import { Thread } from "@/components/assistant-ui/thread";

export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="aui-root aui-assistant-sidebar h-full"
    >
      <ResizablePanel
        defaultSize={55}
        className="aui-assistant-sidebar-content flex h-full flex-col overflow-hidden"
      >
        {children}
      </ResizablePanel>
      <ResizableHandle className="aui-assistant-sidebar-handle" />
      <ResizablePanel
        defaultSize={45}
        minSize={35}
        className="aui-assistant-sidebar-thread flex h-full flex-col overflow-hidden bg-muted/20 p-4"
      >
        <div className="aui-assistant-thread-wrapper flex-1 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
          <Thread />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
