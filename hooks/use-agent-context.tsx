"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AgentOption = {
  id: string;
  label: string;
  description: string;
  system: string;
};

type AgentContextValue = {
  agents: AgentOption[];
  agentId: string;
  setAgentId: (id: string) => void;
  currentAgent: AgentOption;
};

const AgentContext = createContext<AgentContextValue | null>(null);

const FALLBACK_AGENTS: AgentOption[] = [
  {
    id: "defaultAgent",
    label: "Default Agent",
    description: "Универсальный помощник для текстовых запросов и объяснений.",
    system: "",
  },
  {
    id: "geoAgent",
    label: "Geo Agent",
    description:
      "Специалист по геоданным: поиск мест рядом, построение маршрутов, погода.",
    system: "",
  },
  {
    id: "salesAgent",
    label: "Sales Agent",
    description:
      "Координатор медцентра: оформляет записи, подтверждает визиты, ведёт контроль пациентов.",
    system: "",
  },
  {
    id: "browserAgent",
    label: "Browser Agent",
    description:
      "Исследует веб-страницы через Playwright MCP, снимает данные и скриншоты.",
    system: "",
  },
  {
    id: "doctorAgent",
    label: "Doctor Agent",
    description:
      "Консультант по медицинским вопросам, работает только с источниками PubMed.",
    system: "",
  },
  {
    id: "n8nAgent",
    label: "n8n Agent",
    description:
      "Эксперт по автоматизациям в n8n: дизайн, валидация и настройка воркфлоу.",
    system: "",
  },
];

export const AgentProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactNode => {
  const [agents, setAgents] =
    useState<AgentOption[]>(FALLBACK_AGENTS);
  const [agentId, setAgentId] = useState<string>(FALLBACK_AGENTS[0]?.id ?? "");

  useEffect(() => {
    let cancelled = false;

    const loadAgents = async () => {
      try {
        const response = await fetch("/api/agents", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load agents: ${response.status}`);
        }

        const data = (await response.json()) as {
          agents?: AgentOption[];
        };

        if (
          cancelled ||
          !Array.isArray(data.agents) ||
          data.agents.length === 0
        ) {
          return;
        }

        const fetchedAgents = data.agents;

        setAgents(fetchedAgents);
        setAgentId((currentId) => {
          const hasCurrent = fetchedAgents.some(
            (agent) => agent.id === currentId,
          );
          return hasCurrent ? currentId : fetchedAgents[0]?.id ?? currentId;
        });
      } catch (error) {
        console.warn("Failed to load Mastra agents from API.", error);
      }
    };

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AgentContextValue>(() => {
    const current =
      agents.find((agent) => agent.id === agentId) ??
      agents[0] ??
      FALLBACK_AGENTS[0];
    return {
      agents,
      agentId: current?.id ?? "",
      setAgentId,
      currentAgent: current,
    };
  }, [agentId, agents]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgentContext = (): AgentContextValue => {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgentContext must be used within an AgentProvider");
  }
  return ctx;
};
