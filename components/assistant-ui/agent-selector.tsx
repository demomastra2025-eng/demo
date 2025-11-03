"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAgentContext } from "@/hooks/use-agent-context";

type AgentSelectorProps = {
  layout?: "inline" | "stacked";
  showDescription?: boolean;
  className?: string;
  agentIds?: string[];
  variant?: "segmented" | "select";
};

/**
 * AgentSelector renders a segmented control that lets the user switch
 * between registered Mastra agents. Inspired by Kibo UI pills: the active
 * option is highlighted while inactive options remain subtle.
 */
export const AgentSelector = ({
  layout = "inline",
  showDescription = false,
  className,
  agentIds,
  variant = "segmented",
}: AgentSelectorProps) => {
  const { agents, agentId, setAgentId } = useAgentContext();
  const isSelectVariant = variant === "select";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectableAgents = useMemo(() => {
    if (!agentIds || agentIds.length === 0) {
      return agents;
    }

    const idSet = new Set(agentIds);
    return agents.filter((agent) => idSet.has(agent.id));
  }, [agents, agentIds]);

  useEffect(() => {
    if (selectableAgents.length === 0) return;
    if (!selectableAgents.some((agent) => agent.id === agentId)) {
      setAgentId(selectableAgents[0].id);
    }
  }, [selectableAgents, agentId, setAgentId]);

  const hasAgents = selectableAgents.length > 0;
  const activeAgent = hasAgents
    ? selectableAgents.find((agent) => agent.id === agentId) ?? selectableAgents[0]
    : undefined;

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => setOpen(false), []);

useEffect(() => {
  if (!isSelectVariant || !open) {
    return;
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      close();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      close();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [isSelectVariant, open, close]);

const handleSelect = useCallback(
  (id: string) => {
    setAgentId(id);
    close();
  },
  [setAgentId, close],
);

  if (!hasAgents) {
    return null;
  }

  if (isSelectVariant) {
    return (
      <div
        className={cn(
          "aui-agent-selector flex flex-col gap-2 ",
          className,
        )}
        ref={dropdownRef}
      >
        <div className="flex items-center justify-between gap-2 text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Текущий агент
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={toggleOpen}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex flex-col items-start">
            <span>{activeAgent?.label}</span>
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              open && "rotate-180",
            )}
          />
        </Button>
        {open && (
          <div
            role="listbox"
            aria-activedescendant={activeAgent?.id}
            className="aui-agent-selector-dropdown mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border/60 bg-background/98 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90"
          >
            {selectableAgents.map((agent) => {
              const isActive = agent.id === agentId;
              return (
                <button
                  key={agent.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(agent.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="font-medium">{agent.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {agent.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {showDescription && (
          <p className="text-xs text-muted-foreground">{activeAgent?.description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "aui-agent-selector flex flex-col gap-2",
        className,
      )}
    >
      {showDescription && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Выбор агента
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground/70">
            {activeAgent?.description}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex gap-1 rounded-2xl border border-border/60 bg-background/90 p-1 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
          layout === "stacked" &&
            "flex-col gap-2 border-none bg-transparent p-0 shadow-none supports-[backdrop-filter]:bg-transparent",
        )}
        role="tablist"
        aria-label="Выбор агента"
      >
        {selectableAgents.map((agent) => {
          const isActive = agent.id === agentId;
          return (
            <Fragment key={agent.id}>
              <Button
                type="button"
                onClick={() => setAgentId(agent.id)}
                className={cn(
                  "h-9 min-w-0 flex-1 justify-center rounded-xl px-3 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring/60",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  layout === "stacked" &&
                    "w-full justify-start rounded-lg border border-border/60 bg-background/80 text-foreground hover:border-border hover:bg-background",
                  layout === "stacked" && isActive && "border-primary/60 bg-primary/10 text-foreground",
                )}
                role="tab"
                aria-selected={isActive}
                variant="ghost"
              >
                {agent.label}
              </Button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
