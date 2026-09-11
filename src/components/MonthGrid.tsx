"use client";

import { memberById } from "@/lib/family";
import { eventsForDay } from "@/lib/events";
import { CATEGORY_ACCENT, accentClasses } from "@/lib/accents";
import { formatDayNumber, formatMonthShort } from "@/lib/dates";
import type { CalendarEvent, MemberId } from "@/lib/types";

const WEEKDAY_LABELS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

/** Nombre d'événements affichés dans une case avant de résumer le reste en « +N ». */
const MAX_VISIBLE = 3;

interface MonthGridProps {
  days: string[];
  currentMonth: string;
  today: string;
  events: CalendarEvent[];
  filterMember: MemberId | null;
  onSelectDay: (date: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function MonthGrid({
  days,
  currentMonth,
  today,
  events,
  filterMember,
  onSelectDay,
  onEditEvent,
}: MonthGridProps) {
  const monthPrefix = currentMonth.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="grid grid-cols-7 border-b border-line bg-cream-deep/40">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const inMonth = date.startsWith(monthPrefix);
          const isToday = date === today;
          const dayEvents = eventsForDay(events, date, filterMember);
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const hiddenCount = dayEvents.length - visible.length;
          const showMonthLabel = date.endsWith("-01");

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDay(date)}
              className={`flex min-h-[92px] flex-col items-stretch gap-1 border-b border-r border-line/70 p-1.5 text-left last:border-r-0 sm:min-h-[112px] ${
                inMonth ? "bg-white" : "bg-cream-deep/20"
              } hover:bg-cream-deep/40`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center self-start rounded-full text-sm font-extrabold ${
                  isToday
                    ? "bg-sage text-white"
                    : inMonth
                      ? "text-ink"
                      : "text-ink-faint"
                }`}
              >
                {formatDayNumber(date)}
                {showMonthLabel ? (
                  <span className="sr-only">{` ${formatMonthShort(date)}`}</span>
                ) : null}
              </span>
              {showMonthLabel && !isToday ? (
                <span className="-mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  {formatMonthShort(date)}
                </span>
              ) : null}

              <div className="flex min-w-0 flex-col gap-0.5">
                {visible.map((event) => (
                  <MonthEventChip key={event.id} event={event} onClick={() => onEditEvent(event)} />
                ))}
                {hiddenCount > 0 ? (
                  <span className="px-1 text-[10px] font-bold text-ink-faint">
                    +{hiddenCount} de plus
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthEventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const person = event.memberIds[0] ? memberById(event.memberIds[0]) : undefined;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick();
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          keyEvent.stopPropagation();
          keyEvent.preventDefault();
          onClick();
        }
      }}
      className={`truncate rounded-md ${accent.soft} px-1 py-0.5 text-[10px] font-bold text-ink hover:brightness-97`}
    >
      {event.startTime ? `${event.startTime} ` : ""}
      {event.title}
      {person ? ` · ${person.firstName}` : ""}
    </span>
  );
}
