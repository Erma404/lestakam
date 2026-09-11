"use client";

import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { EventForm } from "./EventForm";
import { MEMBERS, memberById } from "@/lib/family";
import {
  baseEventId,
  eventTimeSpan,
  eventsForDay,
  expandEvents,
  layoutOverlapping,
  type TimeSpan,
} from "@/lib/events";
import { useEvents, type NewEvent } from "@/lib/useEvents";
import { useNow } from "@/lib/useNow";
import { CATEGORY_ACCENT, CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import { addDays, formatDayNumber, formatWeekdayShort, todayKey, weekDays } from "@/lib/dates";
import type { CalendarEvent, MemberId } from "@/lib/types";

/** Fenêtre horaire affichée dans la grille : suffisant pour une journée de famille. */
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;
const GRID_START_MIN = GRID_START_HOUR * 60;
const GRID_END_MIN = GRID_END_HOUR * 60;
const HOUR_HEIGHT = 56;
const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;
const MIN_BLOCK_HEIGHT = 26;
const TIME_COLUMN_WIDTH = 52;
const DAY_COLUMN_MIN_WIDTH = 132;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function minutesToTop(min: number): number {
  return ((clamp(min, GRID_START_MIN, GRID_END_MIN) - GRID_START_MIN) / 60) * HOUR_HEIGHT;
}

interface CalendarViewProps {
  initialIso: string;
}

export function CalendarView({ initialIso }: CalendarViewProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [filterMember, setFilterMember] = useState<MemberId | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState<{ date: string; startTime?: string } | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const week = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const expanded = useMemo(() => expandEvents(events, week), [events, week]);

  function announce(message: string) {
    setConfirmation(message);
    window.setTimeout(() => setConfirmation(null), 4000);
  }

  function handleSave(values: NewEvent) {
    if (editing) {
      updateEvent(baseEventId(editing.id), values);
      announce(`« ${values.title} » a été modifié.`);
    } else {
      addEvent(values);
      announce(`« ${values.title} » a été ajouté au calendrier.`);
    }
    setEditing(null);
    setCreating(null);
  }

  function handleDelete() {
    if (!editing) return;
    deleteEvent(baseEventId(editing.id));
    announce(`« ${editing.title} » a été supprimé.`);
    setEditing(null);
  }

  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(`${week[0]}T12:00:00`),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Calendrier
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekAnchor((current) => addDays(current, -7))}
            aria-label="Semaine précédente"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-ink-soft hover:bg-cream-deep"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor(today)}
            className="min-h-11 rounded-pill bg-white px-4 text-sm font-extrabold text-ink-soft hover:bg-cream-deep"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor((current) => addDays(current, 7))}
            aria-label="Semaine suivante"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-ink-soft hover:bg-cream-deep"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setCreating({ date: today })}
            className="ml-1 inline-flex min-h-11 items-center gap-1 rounded-pill bg-sage px-5 text-sm font-extrabold text-white hover:brightness-95"
          >
            <span aria-hidden>＋</span> Ajouter
          </button>
        </div>
      </header>

      {confirmation ? (
        <p role="status" className="rounded-card bg-sage-soft px-5 py-3 text-sm font-bold text-ink">
          {confirmation}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterMember(null)}
          aria-pressed={filterMember === null}
          className={`min-h-11 rounded-pill border-2 px-4 text-sm font-extrabold ${
            filterMember === null
              ? "border-ink-faint bg-cream-deep text-ink"
              : "border-line bg-white text-ink-soft"
          }`}
        >
          Toute la famille
        </button>
        {MEMBERS.map((member) => {
          const selected = filterMember === member.id;
          const accent = accentClasses(member.accent);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setFilterMember(selected ? null : member.id)}
              aria-pressed={selected}
              className={`flex min-h-11 items-center gap-2 rounded-pill border-2 px-3 text-sm font-extrabold ${
                selected
                  ? `${accent.soft} border-ink-faint text-ink`
                  : "border-line bg-white text-ink-soft"
              }`}
            >
              <Avatar member={member} size="sm" />
              {member.firstName}
            </button>
          );
        })}
      </div>

      <WeekGrid
        week={week}
        today={today}
        events={expanded}
        filterMember={filterMember}
        now={now}
        onEditEvent={setEditing}
        onCreateAt={(date, startTime) => setCreating({ date, startTime })}
      />

      {editing || creating ? (
        <EventForm
          event={editing ?? undefined}
          defaultDate={editing?.date ?? creating?.date ?? today}
          defaultStartTime={editing ? undefined : creating?.startTime}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => {
            setEditing(null);
            setCreating(null);
          }}
        />
      ) : null}
    </div>
  );
}

interface WeekGridProps {
  week: string[];
  today: string;
  events: CalendarEvent[];
  filterMember: MemberId | null;
  now: Date;
  onEditEvent: (event: CalendarEvent) => void;
  onCreateAt: (date: string, startTime: string) => void;
}

function WeekGrid({ week, today, events, filterMember, now, onEditEvent, onCreateAt }: WeekGridProps) {
  const hours = useMemo(
    () => Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, index) => GRID_START_HOUR + index),
    [],
  );

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="max-h-[620px] overflow-auto rounded-card border border-line bg-white">
      <div style={{ minWidth: TIME_COLUMN_WIDTH + week.length * DAY_COLUMN_MIN_WIDTH }}>
        {/* En-têtes des jours */}
        <div className="sticky top-0 z-30 flex border-b border-line bg-white">
          <div
            className="sticky left-0 z-30 shrink-0 bg-white"
            style={{ width: TIME_COLUMN_WIDTH }}
          />
          {week.map((date) => {
            const isToday = date === today;
            return (
              <div
                key={date}
                className="flex flex-1 flex-col items-center gap-0.5 border-l border-line py-2"
                style={{ minWidth: DAY_COLUMN_MIN_WIDTH }}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
                    isToday ? "text-sage" : "text-ink-faint"
                  }`}
                >
                  {formatWeekdayShort(date)}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-extrabold ${
                    isToday ? "bg-sage text-white" : "text-ink"
                  }`}
                >
                  {formatDayNumber(date)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Événements toute la journée */}
        <AllDayRow week={week} events={events} filterMember={filterMember} onEditEvent={onEditEvent} />

        {/* Grille horaire */}
        <div className="flex">
          <div
            className="sticky left-0 z-10 shrink-0 bg-white"
            style={{ width: TIME_COLUMN_WIDTH }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-1.5 text-[10px] font-bold text-ink-faint">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {week.map((date) => (
            <DayColumn
              key={date}
              date={date}
              isToday={date === today}
              hours={hours}
              events={eventsForDay(events, date, filterMember).filter((event) => event.startTime)}
              nowMinutes={nowMinutes}
              onEditEvent={onEditEvent}
              onCreateAt={onCreateAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AllDayRow({
  week,
  events,
  filterMember,
  onEditEvent,
}: {
  week: string[];
  events: CalendarEvent[];
  filterMember: MemberId | null;
  onEditEvent: (event: CalendarEvent) => void;
}) {
  const hasAny = week.some(
    (date) => eventsForDay(events, date, filterMember).filter((event) => !event.startTime).length > 0,
  );
  if (!hasAny) return null;

  return (
    <div className="sticky top-[60px] z-20 flex border-b border-line bg-cream-deep/40">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center justify-end bg-cream-deep/40 pr-1.5"
        style={{ width: TIME_COLUMN_WIDTH }}
      >
        <span className="text-[9px] font-bold text-ink-faint">journée</span>
      </div>
      {week.map((date) => {
        const dayEvents = eventsForDay(events, date, filterMember).filter((event) => !event.startTime);
        return (
          <div
            key={date}
            className="flex flex-1 flex-col gap-1 border-l border-line px-1 py-1.5"
            style={{ minWidth: DAY_COLUMN_MIN_WIDTH }}
          >
            {dayEvents.map((event) => (
              <EventChip key={event.id} event={event} onClick={() => onEditEvent(event)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function DayColumn({
  date,
  isToday,
  hours,
  events,
  nowMinutes,
  onEditEvent,
  onCreateAt,
}: {
  date: string;
  isToday: boolean;
  hours: number[];
  events: CalendarEvent[];
  nowMinutes: number;
  onEditEvent: (event: CalendarEvent) => void;
  onCreateAt: (date: string, startTime: string) => void;
}) {
  const positioned = useMemo(() => {
    const spans = events.map((event) => ({ event, ...eventTimeSpan(event) }));
    return layoutOverlapping<TimeSpan & { event: CalendarEvent }>(spans);
  }, [events]);

  function handleClick(clickEvent: React.MouseEvent<HTMLDivElement>) {
    const rect = clickEvent.currentTarget.getBoundingClientRect();
    const offsetY = clickEvent.clientY - rect.top;
    const rawMinutes = GRID_START_MIN + (offsetY / HOUR_HEIGHT) * 60;
    const rounded = Math.round(rawMinutes / 15) * 15;
    const clamped = clamp(rounded, GRID_START_MIN, GRID_END_MIN - 15);
    const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
    const mm = String(clamped % 60).padStart(2, "0");
    onCreateAt(date, `${hh}:${mm}`);
  }

  return (
    <div
      className="relative border-l border-line"
      style={{ height: GRID_HEIGHT, minWidth: DAY_COLUMN_MIN_WIDTH }}
      onClick={handleClick}
    >
      {hours.map((hour, index) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-line/70"
          style={{ top: index * HOUR_HEIGHT }}
        />
      ))}

      {isToday && nowMinutes >= GRID_START_MIN && nowMinutes <= GRID_END_MIN ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-terracotta"
          style={{ top: minutesToTop(nowMinutes) }}
        >
          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-terracotta" />
        </div>
      ) : null}

      {positioned.map(({ event: span, column, columns }) => {
        const { event, startMin, endMin } = span;
        const top = minutesToTop(startMin);
        const height = Math.max(minutesToTop(endMin) - top, MIN_BLOCK_HEIGHT);
        const widthPercent = 100 / columns;
        return (
          <EventBlock
            key={event.id}
            event={event}
            style={{
              top,
              height,
              left: `calc(${widthPercent * column}% + 2px)`,
              width: `calc(${widthPercent}% - 4px)`,
            }}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onEditEvent(event);
            }}
          />
        );
      })}
    </div>
  );
}

function EventBlock({
  event,
  style,
  onClick,
}: {
  event: CalendarEvent;
  style: React.CSSProperties;
  onClick: (clickEvent: React.MouseEvent) => void;
}) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ position: "absolute", ...style }}
      className={`z-[1] overflow-hidden rounded-lg ${accent.soft} px-1.5 py-0.5 text-left shadow-sm hover:brightness-97`}
    >
      <span className="block truncate text-[11px] font-extrabold leading-tight text-ink">
        {event.title}
      </span>
      {event.startTime ? (
        <span className="block truncate text-[9px] font-semibold leading-tight text-ink-soft">
          {event.startTime}
        </span>
      ) : null}
    </button>
  );
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const people = event.memberIds
    .map((id) => memberById(id))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${event.title} · ${CATEGORY_LABEL[event.category]}`}
      className={`flex items-center gap-1 rounded-md ${accent.soft} px-1.5 py-0.5 text-left hover:brightness-97`}
    >
      <span className="truncate text-[11px] font-extrabold text-ink">{event.title}</span>
      {people.length > 0 ? (
        <span className="flex -space-x-1.5">
          {people.slice(0, 3).map((member) => (
            <Avatar key={member.id} member={member} size="sm" />
          ))}
        </span>
      ) : null}
    </button>
  );
}
