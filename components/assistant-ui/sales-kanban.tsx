"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import {
  makeAssistantVisible,
  useAssistantInstructions,
  useThread,
} from "@assistant-ui/react";
import { cn } from "@/lib/utils";

type AppointmentStage = "new" | "triage" | "scheduled" | "completed";

type AppointmentCard = {
  id: string;
  name: string;
  patient: string;
  doctor: string;
  service: string;
  column: AppointmentStage;
  contact?: string;
  slot?: string;
  note?: string;
};

type SalesKanbanProps = {
  className?: string;
};

type ColumnDefinition = {
  id: AppointmentStage;
  name: string;
  hint: string;
};

const COLUMNS: ColumnDefinition[] = [
  {
    id: "new",
    name: "Новые обращения",
    hint: "Поступил запрос, требуется первичный контакт",
  },
  {
    id: "triage",
    name: "Уточняем детали",
    hint: "Подтверждаем жалобу, противопоказания и подготовку",
  },
  {
    id: "scheduled",
    name: "Визит назначен",
    hint: "Подобрано время, напоминаем пациенту о подготовке",
  },
  {
    id: "completed",
    name: "Визит завершён",
    hint: "Пациент прошёл приём, готовим контрольный звонок",
  },
];

const PIPELINE_STAGE_IDS: AppointmentStage[] = COLUMNS.map(
  (column) => column.id,
);

const isAppointmentStage = (value: unknown): value is AppointmentStage =>
  typeof value === "string" &&
  PIPELINE_STAGE_IDS.includes(value as AppointmentStage);

const INITIAL_ITEMS: AppointmentCard[] = [
  {
    id: "appt-3201",
    name: "Динара Ахметова",
    patient: "Динара Ахметова",
    doctor: "Кардиолог • д-р Омарова",
    service: "Кардиоконсультация и ЭКГ",
    column: "new",
    contact: "+7 700 112-45-63 (WhatsApp)",
    note: "Просит подобрать слот после 18:00, жалобы на давление",
  },
  {
    id: "appt-3202",
    name: "Ермек Байжанов",
    patient: "Ермек Байжанов",
    doctor: "Невролог • д-р Курманов",
    service: "МРТ шейного отдела",
    column: "triage",
    contact: "+7 702 555-44-11",
    note: "Уточнить наличие металлоконструкций, ждёт звонок вечером",
  },
  {
    id: "appt-3203",
    name: "Анна Сидорова",
    patient: "Анна Сидорова",
    doctor: "Педиатр • д-р Алиева",
    service: "Детская вакцинация",
    column: "scheduled",
    contact: "+7 701 908-33-22",
    slot: "12.02, 10:30",
    note: "Отправить список анализов за день до визита",
  },
  {
    id: "appt-3204",
    name: "Руслан Ким",
    patient: "Руслан Ким",
    doctor: "Стоматолог • д-р Исабекова",
    service: "Хирургическое удаление зуба",
    column: "scheduled",
    contact: "ruslan.kim@example.com",
    slot: "13.02, 16:00",
    note: "Нужно напомнить про отмену антикоагулянтов за 24 часа",
  },
  {
    id: "appt-3197",
    name: "Зарина Бейсекова",
    patient: "Зарина Бейсекова",
    doctor: "Дерматолог • д-р Арман",
    service: "Лазерное удаление невуса",
    column: "completed",
    contact: "+7 705 321-77-88",
    note: "Контрольный звонок через 3 дня, проверить заживление",
  },
];

const ReadableAppointmentCard = makeAssistantVisible(
  ({
    item,
    highlight,
  }: {
    item: AppointmentCard;
    highlight: boolean;
  }) => (
    <div
      className={cn(
        "flex flex-col gap-1 transition-opacity",
        highlight ? "opacity-100" : "opacity-95",
      )}
      data-appointment-card={item.id}
      data-column={item.column}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {item.name}
        </span>
        {item.slot ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {item.slot}
          </span>
        ) : null}
      </div>
      <span className="text-xs text-muted-foreground">{item.doctor}</span>
      <span className="text-xs text-muted-foreground/80">{item.service}</span>
      {item.contact ? (
        <span className="text-[11px] text-muted-foreground/70">
          Контакт: {item.contact}
        </span>
      ) : null}
      {item.note ? (
        <p className="text-[11px] text-muted-foreground/80">{item.note}</p>
      ) : null}
    </div>
  ),
);

export const SalesKanban: FC<SalesKanbanProps> = ({ className }) => {
  const [items, setItems] = useState<AppointmentCard[]>(INITIAL_ITEMS);
  const [lastTouchedId, setLastTouchedId] = useState<string | null>(null);
  const processedToolCalls = useRef<Set<string>>(new Set());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadMessages = useThread((state) => state.messages);

  const markTouched = useCallback((id: string | null) => {
    setLastTouchedId(id);
    if (flashTimer.current) {
      clearTimeout(flashTimer.current);
    }
    if (id) {
      flashTimer.current = setTimeout(() => {
        setLastTouchedId(null);
      }, 4000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current) {
        clearTimeout(flashTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!threadMessages || threadMessages.length === 0) {
      processedToolCalls.current.clear();
      return;
    }

    threadMessages.forEach((message) => {
      if (message.role !== "assistant") return;
      message.content.forEach((part) => {
        if (part.type !== "tool-call" || !part.result) return;
        if (processedToolCalls.current.has(part.toolCallId)) return;

        processedToolCalls.current.add(part.toolCallId);
        const result = part.result as
          | {
              action?: string;
              item?: AppointmentCard;
              id?: string;
              column?: AppointmentStage;
              slot?: string;
              note?: string;
            }
          | undefined;

        if (!result?.action) return;

        if (result.action === "create" && result.item) {
          const newItem = result.item;
          if (!isAppointmentStage(newItem.column)) return;
          setItems((current) => {
            const exists = current.some((card) => card.id === newItem.id);
            if (exists) return current;
            const normalized: AppointmentCard = {
              id: newItem.id,
              name: newItem.name ?? newItem.patient,
              patient: newItem.patient,
              doctor: newItem.doctor,
              service: newItem.service,
              column: newItem.column,
              contact: newItem.contact,
              slot: newItem.slot,
              note: newItem.note,
            };
            return [...current, normalized];
          });
          markTouched(newItem.id);
          return;
        }

        if (result.action === "move" && result.id && result.column) {
          if (!isAppointmentStage(result.column)) return;
          const nextColumn = result.column;
          setItems((current) =>
            current.map((card) =>
              card.id === result.id
                ? {
                    ...card,
                    column: nextColumn,
                    slot:
                      typeof result.slot === "string" &&
                      result.slot.trim().length > 0
                        ? result.slot
                        : card.slot,
                    note:
                      typeof result.note === "string" &&
                      result.note.trim().length > 0
                        ? result.note
                        : card.note,
                  }
                : card,
            ),
          );
          markTouched(result.id);
          return;
        }

        if (result.action === "note" && result.id && result.note) {
          setItems((current) =>
            current.map((card) =>
              card.id === result.id ? { ...card, note: result.note } : card,
            ),
          );
          markTouched(result.id);
        }
      });
    });
  }, [threadMessages, markTouched]);

  const columnSummaries = useMemo(() => {
    return COLUMNS.map((column) => ({
      ...column,
      count: items.filter((item) => item.column === column.id).length,
    }));
  }, [items]);

  const summaryByColumnId = useMemo(
    () =>
      columnSummaries.reduce(
        (acc, column) => {
          acc[column.id] = column;
          return acc;
        },
        {} as Record<AppointmentStage, (typeof columnSummaries)[number]>,
      ),
    [columnSummaries],
  );

  const nextUpcoming = useMemo(() => {
    const future = items
      .filter((item) => item.slot)
      .map((item) => ({
        id: item.id,
        name: item.name,
        slot: item.slot!,
        column: item.column,
      }));
    return future.length > 0 ? future[0] : null;
  }, [items]);

  const instructionSnapshot = useMemo(() => {
    const columnSummaryText = columnSummaries
      .map((column) => `- ${column.name}: ${column.count} заявок`)
      .join("\n");

    const appointments = items
      .slice(0, 12)
      .map(
        (card) =>
          `${card.id} • ${card.name} • этап ${card.column} • врач ${card.doctor}${card.slot ? ` • время ${card.slot}` : ""}${card.contact ? ` • контакт ${card.contact}` : ""}${card.note ? ` • заметка: ${card.note}` : ""}`,
      )
      .join("\n");

    return [
      "Ты работаешь с журналом пациентов медицинского центра. Для изменений используй инструменты create-appointment, update-appointment-stage, upsert-appointment-note — они мгновенно обновляют интерфейс.",
      "Если не хватает ФИО, врача, контакта или статуса — уточни перед применением инструментов.",
      "После каждого действия сообщай оператору, что именно изменилось и какой следующий шаг.",
      "Сводка по текущим этапам:",
      columnSummaryText,
      "Активные карточки (до 12 шт.):",
      appointments.length > 0 ? appointments : "- пока без заявок",
    ].join("\n");
  }, [columnSummaries, items]);

  useAssistantInstructions(instructionSnapshot);

  const lastTouchedItem = useMemo(
    () => items.find((item) => item.id === lastTouchedId) ?? null,
    [items, lastTouchedId],
  );

  return (
    <div className={cn("aui-sales-kanban flex h-full w-full flex-col", className)}>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Активных заявок
            </span>
            <p className="text-lg font-semibold text-foreground">
              {items.length}
            </p>
          </div>
          {nextUpcoming ? (
            <div className="rounded-xl bg-secondary/20 px-3 py-2 text-xs text-secondary-foreground">
              Ближайший визит: {nextUpcoming.slot} ({nextUpcoming.name})
            </div>
          ) : null}
          {lastTouchedItem ? (
            <div className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">
              Обновлена карточка{" "}
              <span className="font-semibold">{lastTouchedItem.name}</span>{" "}
              ({lastTouchedItem.column})
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
          {columnSummaries.map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
            >
              <span className="font-medium text-foreground">
                {column.name}
              </span>
              <span className="text-right">{column.count}</span>
            </div>
          ))}
        </div>
      </div>

      <KanbanProvider<AppointmentCard, ColumnDefinition>
        columns={COLUMNS}
        data={items}
        onDataChange={(data) => setItems(data)}
        className="auto-cols-[minmax(280px,1fr)] h-full gap-5"
      >
        {(column) => {
          const meta = COLUMNS.find((col) => col.id === column.id);
          return (
            <KanbanBoard
              key={column.id}
              id={column.id}
              className="border-border/60 bg-background/80 text-left backdrop-blur supports-[backdrop-filter]:bg-background/65"
            >
              <KanbanHeader className="border-b border-border/60 bg-muted/40 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {column.name}
                  </span>
                  {meta?.hint ? (
                    <span className="text-xs text-muted-foreground">
                      {meta.hint}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground/80">
                    {summaryByColumnId[column.id]?.count ?? 0} заявок
                  </span>
                </div>
              </KanbanHeader>
              <KanbanCards<AppointmentCard> id={column.id} className="flex-1">
                {(item) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    column={item.column}
                    className={cn(
                      "bg-background/95 text-left transition-all duration-200",
                      lastTouchedId === item.id
                        ? "ring-2 ring-primary/60"
                        : "ring-0",
                    )}
                  >
                    <ReadableAppointmentCard
                      item={item}
                      highlight={lastTouchedId === item.id}
                    />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          );
        }}
      </KanbanProvider>
    </div>
  );
};
