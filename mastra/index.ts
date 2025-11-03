
import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { defaultAgent } from "./agents/default-agent";
import { browserAgent } from "./agents/browser-agent";
import { doctorAgent } from "./agents/doctor-agent";
import { geoAgent } from "./agents/geo-agent";
import { n8nAgent } from "./agents/n8n-agent";
import { salesAgent } from "./agents/sales-agent";
import {
  completenessScorer,
  toolCallAppropriatenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import { weatherWorkflow } from "./workflows/weather-workflow";

declare global {
  // eslint-disable-next-line no-var
  var __mastra: Mastra | undefined;
}

const createMastraInstance = () =>
  new Mastra({
    workflows: { weatherWorkflow },
    agents: {
      defaultAgent,
      geoAgent,
      n8nAgent,
      browserAgent,
      doctorAgent,
      salesAgent,
    },
    scorers: {
      toolCallAppropriatenessScorer,
      completenessScorer,
      translationScorer,
    },
    storage: new LibSQLStore({
      // Persist traces, scores, and memory so Playground can display tool output history.
      url: "file:./mastra.db",
    }),
    logger: new PinoLogger({
      name: "Mastra",
      level: "info",
    }),
    telemetry: {
      // Telemetry is deprecated and will be removed in the Nov 4th release
      enabled: false,
    },
    observability: {
      // Enables DefaultExporter and CloudExporter for AI tracing
      default: { enabled: true },
    },
  });

const mastraInstance = globalThis.__mastra ?? createMastraInstance();

if (process.env.NODE_ENV !== "production") {
  globalThis.__mastra = mastraInstance;
}

export const mastra = mastraInstance;
