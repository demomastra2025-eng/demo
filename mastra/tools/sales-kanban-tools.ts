import { createTool } from "@mastra/core/tools";
import { randomUUID } from "crypto";
import { z } from "zod";

const pipelineStageEnum = ["new", "confirmation", "confirmed", "completed"] as const;
export type AppointmentStage = (typeof pipelineStageEnum)[number];

const ensureId = () => {
  try {
    return randomUUID();
  } catch {
    return `appt-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export const createAppointmentTool = createTool({
  id: "create-appointment",
  description:
    "Создаёт новую заявку пациента: укажи ФИО, врача/отделение, тип приема, контакт и статус (Новые обращения → Подтвердить приём → Подтвержден → Завершён).",
  inputSchema: z.object({
    patientName: z
      .string()
      .min(2, "После уточнения запиши полное имя пациента."),
    doctor: z
      .string()
      .min(2, "Укажи врача или специализированное отделение."),
    service: z
      .string()
      .min(2, "Коротко обозначь процедуру или диагноз."),
    status: z.enum(pipelineStageEnum),
    contact: z
      .string()
      .min(5, "Запиши номер телефона или мессенджер для связи.")
      .optional(),
    scheduledFor: z
      .string()
      .optional()
      .describe("Дата и время визита в формате 2025-02-12 14:30."),
    note: z
      .string()
      .optional()
      .describe("Пожелания пациента, подготовка к процедуре или инструкции врачу."),
  }),
  outputSchema: z.object({
    action: z.literal("create"),
    item: z.object({
      id: z.string(),
      name: z.string(),
      patient: z.string(),
      doctor: z.string(),
      service: z.string(),
      column: z.enum(pipelineStageEnum),
      contact: z.string().optional(),
      slot: z.string().optional(),
      note: z.string().optional(),
    }),
  }),
  execute: async ({ context }) => ({
    action: "create" as const,
    item: {
      id: ensureId(),
      name: context.patientName.trim(),
      patient: context.patientName.trim(),
      doctor: context.doctor.trim(),
      service: context.service.trim(),
      column: context.status,
      contact: context.contact?.trim(),
      slot: context.scheduledFor?.trim(),
      note: context.note?.trim(),
    },
  }),
});

export const updateAppointmentStageTool = createTool({
  id: "update-appointment-stage",
  description:
    "Переносит карточку между этапами воронки (например, из «Подтвердить приём» в «Подтвержден») и обновляет данные визита.",
  inputSchema: z.object({
    id: z
      .string()
      .min(4, "Укажи корректный идентификатор карточки (например, appt-*)."),
    status: z.enum(pipelineStageEnum),
    scheduledFor: z
      .string()
      .optional()
      .describe("Если известно точное время визита, внеси его здесь."),
    note: z
      .string()
      .optional()
      .describe("Добавь итог звонка, подтверждение или инструкции для ресепшена."),
  }),
  outputSchema: z.object({
    action: z.literal("move"),
    id: z.string(),
    column: z.enum(pipelineStageEnum),
    slot: z.string().optional(),
    note: z.string().optional(),
  }),
  execute: async ({ context }) => ({
    action: "move" as const,
    id: context.id.trim(),
    column: context.status,
    slot: context.scheduledFor?.trim(),
    note: context.note?.trim(),
  }),
});

export const upsertAppointmentNoteTool = createTool({
  id: "upsert-appointment-note",
  description:
    "Обновляет заметку по пациенту: передай новую информацию, подготовку перед приемом или итог консультации.",
  inputSchema: z.object({
    id: z
      .string()
      .min(4, "Укажи корректный идентификатор карточки (например, appt-*)."),
    note: z
      .string()
      .min(3, "Заметка должна быть содержательной, минимум 3 символа."),
  }),
  outputSchema: z.object({
    action: z.literal("note"),
    id: z.string(),
    note: z.string(),
  }),
  execute: async ({ context }) => ({
    action: "note" as const,
    id: context.id.trim(),
    note: context.note.trim(),
  }),
});
