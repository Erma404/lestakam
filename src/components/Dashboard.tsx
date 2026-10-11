"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSaveConfirmation } from "./SaveConfirmation";
import { Avatar } from "./Avatar";
import { Card, CardLink, CardTitle } from "./Card";
import { Icon } from "./Icon";
import { KhloeScore } from "./KhloeScore";
import { EventForm } from "./EventForm";
import { ReminderForm } from "./ReminderForm";
import { MEMBERS, memberById } from "@/lib/family";
import { baseEventId, eventsForDay, expandEvents, mapsUrl, sevenDayWindow } from "@/lib/events";
import { suggestOutfit } from "@/lib/outfit";
import { describeWeather } from "@/lib/weather";
import { CATEGORY_ACCENT, CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import {
  addDays,
  currentTime as formatClock,
  formatDateRangeMonth,
  formatDayNumber,
  formatLongDate,
  formatRelativeDay,
  formatWeekdayShort,
  outfitDay,
  todayKey,
} from "@/lib/dates";
import { remainingCount } from "@/lib/shopping";
import { useEvents, type NewEvent } from "@/lib/useEvents";
import { useNow } from "@/lib/useNow";
import { useReminders, type NewReminder } from "@/lib/useReminders";
import { useShoppingList } from "@/lib/useShoppingList";
import { useWeather } from "@/lib/useWeather";
import type { CalendarEvent, MemberId, Reminder, ShoppingItem, WeatherForecast } from "@/lib/types";

interface DashboardProps {
  /** Heure calculée par le serveur, utilisée pour le tout premier affichage. */
  initialIso: string;
}

export function Dashboard({ initialIso }: DashboardProps) {
  const now = useNow(initialIso);
  const today = todayKey(now);
  const clock = formatClock(now);

  const { forecast, error: weatherError, loading: weatherLoading } = useWeather();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberId | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [creatingEventOn, setCreatingEventOn] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [creatingReminder, setCreatingReminder] = useState(false);

  const { events: allEvents, addEvent, updateEvent, deleteEvent } = useEvents();
  const { confirm, dialog: confirmationDialog } = useSaveConfirmation();
  const { reminders, addReminder, updateReminder, toggleDone, deleteReminder } = useReminders();
  const { items: shoppingItems, toggleItem: toggleShoppingItem } = useShoppingList();
  const week = useMemo(() => sevenDayWindow(today), [today]);
  const events = useMemo(() => expandEvents(allEvents, week), [allEvents, week]);

  // Au passage de minuit, la sélection revient d'elle-même sur le jour courant.
  const activeDate = selectedDate && week.includes(selectedDate) ? selectedDate : today;

  const dayEvents = eventsForDay(events, activeDate, selectedMember);
  // Un jour choisi dans la semaine affiche aussi sa tenue ; sinon, celle de
  // demain dès 19 h (pour préparer les habits la veille), celle du jour dès minuit.
  const outfitDate = selectedDate && week.includes(selectedDate) ? selectedDate : outfitDay(now);
  const focusedMember = selectedMember ? memberById(selectedMember) : undefined;

  function handleSaveEvent(values: NewEvent) {
    if (editingEvent) {
      updateEvent(baseEventId(editingEvent.id), values);
      confirm({ title: "Événement modifié", detail: values.title });
    } else {
      addEvent(values);
      confirm({ title: "Ajouté au calendrier", detail: values.title });
    }
    setEditingEvent(null);
    setCreatingEventOn(null);
  }

  function handleDeleteEvent() {
    if (!editingEvent) return;
    deleteEvent(baseEventId(editingEvent.id));
    confirm({ kind: "deleted", title: "Événement supprimé", detail: editingEvent.title });
    setEditingEvent(null);
  }

  function handleSaveReminder(values: NewReminder) {
    if (editingReminder) {
      updateReminder(editingReminder.id, values);
      confirm({ title: "Rappel modifié", detail: values.label });
    } else {
      addReminder(values);
      confirm({ title: "Rappel ajouté", detail: values.label });
    }
    setEditingReminder(null);
    setCreatingReminder(false);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Hero
        today={today}
        clock={clock}
        forecast={forecast}
        weatherError={weatherError}
        weatherLoading={weatherLoading}
        selectedMember={selectedMember}
        onSelectMember={(id) => setSelectedMember((current) => (current === id ? null : id))}
      />

      <WeekStrip
        week={week}
        today={today}
        selectedDate={activeDate}
        events={events}
        forecast={forecast}
        onSelect={setSelectedDate}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-5">
          <DaySection
            date={activeDate}
            today={today}
            events={dayEvents}
            focusedMemberName={focusedMember?.firstName}
            onClearFilter={() => setSelectedMember(null)}
            onEditEvent={setEditingEvent}
            onAddEvent={() => setCreatingEventOn(activeDate)}
          />
          <KhloeScore today={today} now={now} />
        </div>
        <div className="flex flex-col gap-5">
          <RemindersSection
            reminders={reminders}
            today={today}
            onAdd={() => setCreatingReminder(true)}
            onEdit={setEditingReminder}
            onToggleDone={toggleDone}
          />
          <ShoppingSection items={shoppingItems} onToggle={toggleShoppingItem} />
        </div>
      </div>

      {forecast ? (
        <OutfitSection
          date={outfitDate}
          today={today}
          day={forecast.days.find((day) => day.date === outfitDate) ?? forecast.days[0]}
        />
      ) : null}

      {editingEvent || creatingEventOn ? (
        <EventForm
          event={editingEvent ?? undefined}
          defaultDate={editingEvent?.date ?? creatingEventOn ?? activeDate}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onClose={() => {
            setEditingEvent(null);
            setCreatingEventOn(null);
          }}
        />
      ) : null}

      {editingReminder || creatingReminder ? (
        <ReminderForm
          reminder={editingReminder ?? undefined}
          onSave={handleSaveReminder}
          onDelete={
            editingReminder
              ? () => {
                  deleteReminder(editingReminder.id);
                  confirm({ kind: "deleted", title: "Rappel supprimé", detail: editingReminder.label });
                  setEditingReminder(null);
                }
              : undefined
          }
          onClose={() => {
            setEditingReminder(null);
            setCreatingReminder(false);
          }}
        />
      ) : null}

      {confirmationDialog}
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Le salut du moment, selon l'heure affichée (HH:MM). */
function greeting(clock: string): string {
  const hour = Number(clock.slice(0, 2));
  if (hour < 5 || hour >= 18) return "Bonsoir les Takam";
  return "Bonjour les Takam";
}

/**
 * En-tête sans cadre, lisible depuis l'autre bout de la cuisine : la date
 * complète et l'heure en grand, la météo du moment, et la famille pour
 * filtrer le programme.
 */
function Hero({
  today,
  clock,
  forecast,
  weatherError,
  weatherLoading,
  selectedMember,
  onSelectMember,
}: {
  today: string;
  clock: string;
  forecast: WeatherForecast | null;
  weatherError?: string;
  weatherLoading: boolean;
  selectedMember: MemberId | null;
  onSelectMember: (id: MemberId) => void;
}) {
  const year = today.slice(0, 4);
  const todayWeather = forecast?.days.find((day) => day.date === today) ?? forecast?.days[0];
  const look = forecast ? describeWeather(forecast.now.weatherCode, forecast.now.isDay) : null;

  return (
    <header className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/famille-takam.jpg"
          alt="La famille Takam : Stéphane, Ernestine et Khloé"
          width={200}
          height={221}
          priority
          className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
        />
        <div className="min-w-0">
          <p className="text-base text-ink-soft">{greeting(clock)}</p>
          <h1 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            {capitalize(formatLongDate(today))} {year}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrer le programme">
            {MEMBERS.map((member) => {
              const selected = selectedMember === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectMember(member.id)}
                  aria-pressed={selected}
                  className={`flex min-h-11 items-center gap-2 rounded-pill py-1 pl-1 pr-4 text-sm font-medium transition-colors ${
                    selected ? "bg-forest text-white" : "bg-surface text-ink hover:bg-cream-deep"
                  }`}
                >
                  <Avatar member={member} size="xs" />
                  {member.firstName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-5 sm:gap-8">
        <p
          data-testid="horloge"
          className="font-display text-6xl font-medium leading-none tracking-tight text-ink tabular-nums sm:text-7xl"
        >
          {clock}
        </p>
        {forecast && look && todayWeather ? (
          <div className="flex items-center gap-3 rounded-card bg-surface px-4 py-3">
            <span className="text-4xl leading-none" aria-hidden>
              {look.emoji}
            </span>
            <div>
              <p className="text-2xl font-medium leading-tight text-ink">
                {Math.round(forecast.now.temperature)}°
                <span className="ml-1.5 text-sm text-ink-soft">{look.label}</span>
              </p>
              <p className="text-sm text-ink-soft">
                {Math.round(todayWeather.minTemp)}° / {Math.round(todayWeather.maxTemp)}° · pluie{" "}
                {todayWeather.rainChance} %
              </p>
            </div>
          </div>
        ) : (
          <p className="max-w-48 text-sm text-ink-soft">
            {weatherLoading ? "Météo en route…" : (weatherError ?? "Météo indisponible pour le moment.")}
          </p>
        )}
      </div>
    </header>
  );
}

function WeekStrip({
  week,
  today,
  selectedDate,
  events,
  forecast,
  onSelect,
}: {
  week: string[];
  today: string;
  selectedDate: string;
  events: CalendarEvent[];
  forecast: WeatherForecast | null;
  onSelect: (date: string) => void;
}) {
  return (
    <section aria-labelledby="semaine-titre">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="semaine-titre" className="font-display text-xl font-medium text-ink">
          {capitalize(formatDateRangeMonth(week))}
        </h2>
        <CardLink href="/calendrier">Tout le calendrier</CardLink>
      </div>
      <ul className="scrollbar-soft -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {week.map((date) => {
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const weather = forecast?.days.find((day) => day.date === date);
          const look = weather ? describeWeather(weather.weatherCode) : null;
          const count = events.filter((event) => event.date === date).length;

          return (
            <li key={date} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(date)}
                aria-pressed={isSelected}
                aria-label={`${formatLongDate(date)}, ${count === 0 ? "rien de prévu" : `${count} rendez-vous`}`}
                className={`tile-pop flex w-full min-w-20 flex-col items-center gap-1 rounded-card px-2 py-3 transition-colors ${
                  isSelected ? "bg-forest text-white" : "bg-surface text-ink hover:bg-cream-deep"
                }`}
              >
                <span className={`text-xs ${isSelected ? "text-white/80" : isToday ? "text-coral" : "text-ink-soft"}`}>
                  {isToday ? "Aujourd'hui" : capitalize(formatWeekdayShort(date).toLowerCase())}
                </span>
                <span className="text-2xl font-medium tabular-nums">{formatDayNumber(date)}</span>
                {look && weather ? (
                  <span className={`text-xs ${isSelected ? "text-white/80" : "text-ink-soft"}`}>
                    <span aria-hidden>{look.emoji}</span> {Math.round(weather.maxTemp)}°
                  </span>
                ) : null}
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-1.5 gap-1 ${count === 0 ? "opacity-0" : ""}`}
                >
                  {Array.from({ length: Math.min(count, 3) }, (_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-surface" : "bg-coral"}`}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DaySection({
  date,
  today,
  events,
  focusedMemberName,
  onClearFilter,
  onEditEvent,
  onAddEvent,
}: {
  date: string;
  today: string;
  events: CalendarEvent[];
  focusedMemberName?: string;
  onClearFilter: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}) {
  const dayLabel = date === today ? "Aujourd'hui" : capitalize(formatLongDate(date));
  return (
    <Card>
      <CardTitle
        eyebrow={focusedMemberName ? `Le programme de ${focusedMemberName}` : "Le programme"}
        title={dayLabel}
        action={
          <div className="flex items-center gap-2">
            {focusedMemberName ? (
              <button
                type="button"
                onClick={onClearFilter}
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-coral hover:underline"
              >
                Toute la famille
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAddEvent}
              className="btn-pop btn-pop-coral min-h-11 px-4 text-sm"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} /> Ajouter
            </button>
          </div>
        }
      />

      {events.length === 0 ? (
        <p className="py-2 text-base text-ink-soft">Rien de prévu, journée libre.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-dashed divide-line">
          {events.map((event) => (
            <EventRow key={event.id} event={event} onEdit={() => onEditEvent(event)} />
          ))}
        </ul>
      )}
    </Card>
  );
}

const SHORT_DAY = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** « du lun. au ven., hors vacances », « chaque semaine »… */
function repeatLabel(event: CalendarEvent): string {
  const days = event.repeatDays;
  let label = "chaque semaine";
  if (days && days.length > 0) {
    const sorted = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const consecutive = sorted.every((day, index) => index === 0 || (sorted[index - 1] + 1) % 7 === day);
    label =
      sorted.length >= 3 && consecutive
        ? `du ${SHORT_DAY[sorted[0]]} au ${SHORT_DAY[sorted[sorted.length - 1]]}`
        : sorted.map((day) => SHORT_DAY[day]).join(", ");
  }
  return event.skipSchoolHolidays ? `${label}, hors vacances` : label;
}

function EventRow({ event, onEdit }: { event: CalendarEvent; onEdit: () => void }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const people = event.memberIds
    .map((id) => memberById(id))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  return (
    <li className="flex items-center gap-2 py-1">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl py-3 pr-2 text-left hover:bg-cream/60"
      >
        <div className="w-14 shrink-0">
          <p className="text-base font-medium text-ink tabular-nums">{event.startTime ?? "Journée"}</p>
          {event.endTime ? <p className="text-xs text-ink-soft tabular-nums">{event.endTime}</p> : null}
        </div>
        <span aria-hidden className={`h-10 w-1.5 shrink-0 rounded-full ${accent.solid}`} />
        <div className="min-w-0 flex-1">
          <p className="break-words text-base font-medium text-ink">{event.title}</p>
          <p className="break-words text-sm text-ink-soft">
            {CATEGORY_LABEL[event.category]}
            {event.location ? ` · ${event.location}` : ""}
            {event.repeatsWeekly ? ` · ${repeatLabel(event)}` : ""}
          </p>
        </div>
        <div className="flex -space-x-2">
          {people.map((member) => (
            <Avatar key={member.id} member={member} size="sm" />
          ))}
        </div>
      </button>
      {event.location ? (
        <a
          href={mapsUrl(event.location)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ouvrir ${event.location} dans Google Maps`}
          title="Itinéraire"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral hover:brightness-95"
        >
          <Icon name="pin" className="h-5 w-5" />
        </a>
      ) : null}
    </li>
  );
}

function RoundCheck({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
        checked ? "bg-sage text-white" : "text-transparent"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
          checked ? "border-transparent" : "border-line"
        }`}
      >
        <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
      </span>
    </button>
  );
}

function RemindersSection({
  reminders,
  today,
  onAdd,
  onEdit,
  onToggleDone,
}: {
  reminders: Reminder[];
  today: string;
  onAdd: () => void;
  onEdit: (reminder: Reminder) => void;
  onToggleDone: (id: string) => void;
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Cette semaine"
        title="À ne pas oublier"
        action={
          <button
            type="button"
            onClick={onAdd}
            aria-label="Ajouter un rappel"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-coral text-white hover:brightness-105"
          >
            <Icon name="plus" className="h-5 w-5" strokeWidth={2.2} />
          </button>
        }
      />
      {reminders.length === 0 ? (
        <p className="text-base text-ink-soft">Rien d&apos;urgent cette semaine.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-dashed divide-line">
          {reminders.map((reminder) => {
            const people = reminder.memberIds
              .map((id) => memberById(id))
              .filter((member): member is NonNullable<typeof member> => Boolean(member));
            return (
              <li key={reminder.id} className="flex items-center gap-2 py-1.5">
                <RoundCheck
                  checked={reminder.done}
                  onToggle={() => onToggleDone(reminder.id)}
                  label={reminder.done ? "Marquer non fait" : "Marquer fait"}
                />
                <button type="button" onClick={() => onEdit(reminder)} className="min-w-0 flex-1 text-left">
                  <p
                    className={`break-words text-base font-medium ${
                      reminder.done ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    {reminder.label}
                  </p>
                  {reminder.dueDate ? (
                    <p className="text-sm text-ink-soft">{formatRelativeDay(reminder.dueDate, today)}</p>
                  ) : null}
                </button>
                <div className="flex -space-x-2">
                  {people.map((member) => (
                    <Avatar key={member.id} member={member} size="sm" />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Nombre d'articles affichés avant de renvoyer vers la liste complète. */
const SHOPPING_PREVIEW_COUNT = 6;

function ShoppingSection({
  items,
  onToggle,
}: {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
}) {
  const left = remainingCount(items);
  const preview = [...items]
    .sort((a, b) => Number(a.checked) - Number(b.checked))
    .slice(0, SHOPPING_PREVIEW_COUNT);
  const hiddenCount = items.length - preview.length;

  return (
    <Card>
      <CardTitle
        eyebrow={
          left === 0 && items.length > 0
            ? "Tout est dans le caddie"
            : `${left} article${left > 1 ? "s" : ""} à prendre`
        }
        title="Courses"
        action={<CardLink href="/listes">Toute la liste</CardLink>}
      />
      {items.length === 0 ? (
        <p className="text-base text-ink-soft">La liste est vide.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-dashed divide-line">
          {preview.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-0.5">
              <RoundCheck
                checked={item.checked}
                onToggle={() => onToggle(item.id)}
                label={item.checked ? "Décocher cet article" : "Cocher cet article"}
              />
              <span
                className={`min-w-0 flex-1 truncate text-base ${
                  item.checked ? "text-ink-faint line-through" : "text-ink"
                }`}
              >
                {item.label}
                {item.quantity ? <span className="ml-2 text-sm text-ink-soft">{item.quantity}</span> : null}
              </span>
            </li>
          ))}
          {hiddenCount > 0 ? (
            <li className="pt-3 text-sm text-ink-soft">
              +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} article{hiddenCount > 1 ? "s" : ""}
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  );
}

function OutfitSection({
  date,
  today,
  day,
}: {
  date: string;
  today: string;
  day: NonNullable<WeatherForecast["days"][number]>;
}) {
  const when =
    date === today
      ? "aujourd'hui"
      : date === addDays(today, 1)
        ? "demain"
        : formatRelativeDay(date, today).toLowerCase();
  return (
    <section aria-labelledby="tenues-titre">
      <div className="mb-3">
        <h2 id="tenues-titre" className="font-display text-xl font-medium text-ink">
          Ce que chacun devrait porter {when}
        </h2>
        <p className="text-sm text-ink-soft">
          {Math.round(day.minTemp)}° à {Math.round(day.maxTemp)}°, pluie {day.rainChance} %
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MEMBERS.map((member) => {
          const outfit = suggestOutfit(member, day);
          const accent = accentClasses(member.accent);
          return (
            <article key={member.id} className="rounded-card bg-surface p-5">
              <header className="mb-3 flex items-center gap-3">
                <Avatar member={member} size="md" />
                <div className="min-w-0">
                  <p className="text-base font-medium text-ink">{member.firstName}</p>
                  <p className="text-sm text-ink-soft">{outfit.headline}</p>
                </div>
              </header>
              <ul className="flex flex-wrap gap-2">
                {outfit.layers.map((layer, index) => (
                  <li
                    key={`${layer.slot}-${index}`}
                    className={`flex items-center gap-2 rounded-pill ${accent.soft} px-3 py-1.5`}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {layer.emoji}
                    </span>
                    <span className="text-sm text-ink">{layer.label}</span>
                  </li>
                ))}
              </ul>
              {outfit.personalNote ? (
                <p className="mt-3 text-sm text-ink-soft">{outfit.personalNote}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
