"use client";

import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { EventForm } from "./EventForm";
import { MEMBERS, memberById } from "@/lib/family";
import { baseEventId, eventsForDay, expandEvents } from "@/lib/events";
import { useEvents, type NewEvent } from "@/lib/useEvents";
import { useNow } from "@/lib/useNow";
import { CATEGORY_ACCENT, CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import { addDays, formatLongDate, formatRelativeDay, todayKey } from "@/lib/dates";
import type { CalendarEvent, MemberId } from "@/lib/types";

/** Nombre de jours affichés dans l'agenda. */
const HORIZON = 28;

interface CalendarViewProps {
  initialIso: string;
}

export function CalendarView({ initialIso }: CalendarViewProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [filterMember, setFilterMember] = useState<MemberId | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creatingOn, setCreatingOn] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const horizon = useMemo(
    () => Array.from({ length: HORIZON }, (_, index) => addDays(today, index)),
    [today],
  );

  const expanded = useMemo(() => expandEvents(events, horizon), [events, horizon]);

  /** Seuls les jours qui ont quelque chose de prévu sont affichés. */
  const daysWithEvents = horizon
    .map((date) => ({ date, items: eventsForDay(expanded, date, filterMember) }))
    .filter((day) => day.items.length > 0);

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
    setCreatingOn(null);
  }

  function handleDelete() {
    if (!editing) return;
    deleteEvent(baseEventId(editing.id));
    announce(`« ${editing.title} » a été supprimé.`);
    setEditing(null);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Les 4 prochaines semaines
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Calendrier
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreatingOn(today)}
          className="inline-flex min-h-14 items-center gap-2 rounded-pill bg-sage px-6 text-base font-extrabold text-white hover:brightness-95"
        >
          <span aria-hidden>＋</span> Ajouter
        </button>
      </header>

      {confirmation ? (
        <p
          role="status"
          className="rounded-card bg-sage-soft px-5 py-3 text-sm font-bold text-ink"
        >
          {confirmation}
        </p>
      ) : null}

      <Card>
        <fieldset>
          <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Afficher
          </legend>
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
        </fieldset>
      </Card>

      {daysWithEvents.length === 0 ? (
        <Card>
          <p className="px-2 py-8 text-center text-base font-semibold text-ink-soft">
            Rien de prévu sur les 4 prochaines semaines. 🌿
          </p>
        </Card>
      ) : (
        daysWithEvents.map(({ date, items }) => (
          <Card key={date}>
            <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">
                {formatRelativeDay(date, today)}
              </h2>
              <p className="text-xs font-semibold text-ink-faint">{formatLongDate(date)}</p>
            </header>

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id}>
                  <EventButton event={item} onEdit={() => setEditing(item)} />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setCreatingOn(date)}
              className="mt-3 min-h-11 w-full rounded-pill border-2 border-dashed border-line text-sm font-bold text-ink-soft hover:bg-cream-deep/60"
            >
              ＋ Ajouter ce jour-là
            </button>
          </Card>
        ))
      )}

      {editing || creatingOn ? (
        <EventForm
          event={editing ?? undefined}
          defaultDate={editing?.date ?? creatingOn ?? today}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => {
            setEditing(null);
            setCreatingOn(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EventButton({ event, onEdit }: { event: CalendarEvent; onEdit: () => void }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const people = event.memberIds
    .map((id) => memberById(id))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`flex w-full items-center gap-3 rounded-3xl ${accent.soft} px-4 py-3 text-left hover:brightness-97`}
    >
      <span className="w-16 shrink-0 text-center">
        <span className="block text-base font-extrabold text-ink">
          {event.startTime ?? "Journée"}
        </span>
        {event.endTime ? (
          <span className="block text-[11px] font-semibold text-ink-faint">
            jusqu&apos;à {event.endTime}
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold break-words text-ink">{event.title}</span>
        <span className="block text-xs font-semibold break-words text-ink-soft">
          {CATEGORY_LABEL[event.category]}
          {event.location ? ` · ${event.location}` : ""}
          {event.repeatsWeekly ? " · chaque semaine" : ""}
        </span>
        {event.notes ? (
          <span className="mt-1 block text-xs font-semibold break-words text-ink-faint">
            {event.notes}
          </span>
        ) : null}
      </span>

      <span className="flex -space-x-2">
        {people.map((member) => (
          <Avatar key={member.id} member={member} size="sm" />
        ))}
      </span>
    </button>
  );
}
