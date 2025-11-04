"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { UIMessage } from "ai";

import {
  AssistantRuntimeProvider,
  useAssistantRuntime,
  useAssistantState,
  type AssistantRuntime,
} from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { AssistantModal } from "@/components/assistant-ui/assistant-modal";
import dynamic from "next/dynamic";

const SalesKanban = dynamic(
  () => import("@/components/assistant-ui/sales-kanban").then((mod) => mod.SalesKanban),
  { ssr: false }
);
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAgentContext } from "@/hooks/use-agent-context";

const ChatRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const { agents, agentId } = useAgentContext();

  return (
    <>
      {agents.map((agent) => (
        <AgentRuntimeSlot
          key={agent.id}
          agentId={agent.id}
          isActive={agent.id === agentId}
        >
          {agent.id === agentId ? children : null}
        </AgentRuntimeSlot>
      ))}
    </>
  );
};

const AgentRuntimeSlot = ({
  agentId,
  isActive,
  children,
}: {
  agentId: string;
  isActive: boolean;
  children: ReactNode;
}) => {
  const transportRef = useRef<AssistantChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) {
    transportRef.current = new AssistantChatTransport<UIMessage>({
      api: "/api/chat",
      prepareSendMessagesRequest: async (options) => {
        const body = {
          ...(options.body ?? {}),
          agentId,
          id: options.id,
          messages: options.messages,
          trigger: options.trigger,
          messageId: options.messageId,
        } as Record<string, unknown>;

        return { body };
      },
    });
  }

  const transport = transportRef.current!;

  const runtime = useChatRuntime({
    transport,
    id: agentId,
  });

  usePrewarmThread(runtime);

  if (!isActive) {
    return null;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AgentRuntimeBridge />
      <EnsureActiveThread />
      {children}
    </AssistantRuntimeProvider>
  );
};

const usePrewarmThread = (runtime: AssistantRuntime) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    try {
      const state = runtime.threads.getState();
      if (
        state.threads.length === 0 &&
        (state.newThread === undefined || state.newThread === null)
      ) {
        void runtime.switchToNewThread();
      }
    } catch (error) {
      console.warn("[usePrewarmThread] Failed to prewarm thread", error);
      initializedRef.current = false;
    }
  }, [runtime]);
};

const AgentRuntimeBridge = () => {
  const runtime = useAssistantRuntime();
  const { currentAgent } = useAgentContext();

  useEffect(() => {
    if (!runtime) return;

    return runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: currentAgent.system,
      }),
    });
  }, [runtime, currentAgent.system]);

  return null;
};

const EnsureActiveThread = () => {
  const runtime = useAssistantRuntime();
  const threadIsDisabled = useAssistantState(
    (state) => state.thread.isDisabled,
  );
  const hasThread = useAssistantState(
    (state) => state.threads.threadIds.length > 0,
  );
  const pendingThreadId = useAssistantState(
    (state) => state.threads.newThreadId,
  );

  useEffect(() => {
    if (!threadIsDisabled) return;
    if (hasThread || pendingThreadId) return;

    try {
      void runtime.switchToNewThread();
    } catch (error) {
      console.warn("[EnsureActiveThread] Failed to switch to new thread", error);
    }
  }, [runtime, threadIsDisabled, hasThread, pendingThreadId]);

  return null;
};

export const WorkspaceAssistant = () => {
  const { setAgentId, currentAgent } = useAgentContext();

  useEffect(() => {
    setAgentId("defaultAgent");
  }, [setAgentId]);

  return (
    <ChatRuntimeProvider>
      <SidebarProvider className="flex-1 min-h-0">
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-background">
          <ThreadListSidebar />
          <SidebarInset className="flex min-h-0 flex-1 flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-border/60 px-3 py-2 md:hidden">
              <SidebarTrigger
                aria-label="Открыть меню"
                className="h-9 w-9 rounded-xl border border-border/60 bg-background shadow-sm"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  Текущий агент
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {currentAgent?.label ?? "Агент"}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ChatRuntimeProvider>
  );
};

export const FloatingAssistant = () => {
  const { setAgentId } = useAgentContext();
  const [activeTab, setActiveTab] = useState<"sales" | "comingSoon">("sales");

  useEffect(() => {
    setAgentId("salesAgent");
  }, [setAgentId]);

  useEffect(() => {
    if (activeTab === "sales") {
      setAgentId("salesAgent");
    }
  }, [activeTab, setAgentId]);

  return (
    <ChatRuntimeProvider>
      <div className="relative flex h-[calc(100vh-5rem)] w-full flex-col gap-4 bg-background">
        <div className="flex w-full justify-center">
          <div className="flex w-full max-w-2xl gap-2 rounded-2xl border border-border/60 bg-muted/40 p-1 text-sm">
            <Button
              type="button"
              onClick={() => setActiveTab("sales")}
              variant={activeTab === "sales" ? "default" : "ghost"}
              className="h-9 flex-1 rounded-xl"
            >
              Sales Agent
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("comingSoon")}
              variant={activeTab === "comingSoon" ? "default" : "ghost"}
              className="h-9 flex-1 rounded-xl"
            >
              Скоро
            </Button>
          </div>
        </div>

        {activeTab === "sales" ? (
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex flex-1 overflow-hidden py-2">
              <SalesKanban className="size-full" />
            </div>
            <AssistantModal />
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Скоро появится новый агент</h2>
            <p className="text-sm text-muted-foreground">
              Мы готовим дополнительных ассистентов для специфических сценариев. Следите за обновлениями.
            </p>
          </div>
        )}
      </div>
    </ChatRuntimeProvider>
  );
};
