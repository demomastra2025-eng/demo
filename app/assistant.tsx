"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AssistantRuntimeProvider,
  useAssistantRuntime,
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAgentContext } from "@/hooks/use-agent-context";

const ChatRuntimeProvider = ({ children }: { children: ReactNode }) => {
  const { agentId } = useAgentContext();
  const agentIdRef = useRef(agentId);

  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async (options) => {
          const body = {
            ...(options.body ?? {}),
            agentId: agentIdRef.current,
            id: options.id,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
          } as Record<string, unknown>;

          return { body };
        },
      }),
    [],
  );

  const runtime = useChatRuntime({ transport, id: agentId });

  return (
    <AssistantRuntimeProvider runtime={runtime} key={agentId}>
      <AgentRuntimeBridge />
      {children}
    </AssistantRuntimeProvider>
  );
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

export const WorkspaceAssistant = () => {
  const { setAgentId } = useAgentContext();

  useEffect(() => {
    setAgentId("defaultAgent");
  }, [setAgentId]);

  return (
    <ChatRuntimeProvider>
      <SidebarProvider className="flex-1 min-h-0">
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-background">
          <ThreadListSidebar />
          <SidebarInset className="flex min-h-0 flex-1 flex-col bg-background">
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
