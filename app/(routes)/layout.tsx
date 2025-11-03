import type { ReactNode } from "react";

import { AgentProvider } from "@/hooks/use-agent-context";
import { TopNav } from "@/components/navigation/top-nav";

export default function RoutesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AgentProvider>
      <div className="flex min-h-screen flex-col bg-muted/10">
        <TopNav />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-5 sm:px-6">
          <div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-6 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AgentProvider>
  );
}
