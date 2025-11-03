"use client";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
  type ImperativePanelGroupHandle,
  type PanelGroupProps,
  type PanelProps,
} from "react-resizable-panels";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = forwardRef<
  ImperativePanelGroupHandle,
  PanelGroupProps
>(({ className, ...props }, ref) => {
  return (
    <PanelGroup
      ref={ref}
      className={cn("relative flex h-full w-full", className)}
      {...props}
    />
  );
});
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = forwardRef<ImperativePanelHandle, PanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <Panel
        ref={ref}
        className={cn("flex h-full w-full flex-col", className)}
        {...props}
      />
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

type ResizableHandleProps = ComponentPropsWithoutRef<typeof PanelResizeHandle>;

const ResizableHandle = ({ className, ...props }: ResizableHandleProps) => {
  return (
    <PanelResizeHandle
      className={cn(
        "aui-resize-handle group relative flex h-full w-px items-center justify-center bg-border outline-none transition-colors focus-visible:bg-primary",
        "[&[data-panel-group-direction=vertical]]:h-px [&[data-panel-group-direction=vertical]]:w-full",
        "after:absolute after:h-10 after:w-1 after:rounded-full after:bg-muted-foreground/70 after:transition-colors",
        "hover:after:bg-primary",
        className,
      )}
      {...props}
    />
  );
};

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
