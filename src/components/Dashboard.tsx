"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Card, CardTitle } from "./Card";
import { EventForm } from "./EventForm";
import { ReminderForm } from "./ReminderForm";
import { MEMBERS, memberById } from "@/lib/family";
import { baseEventId, eventsForDay, expandEvents, sevenDayWindow } from "@/lib/events";
import { suggestOutfit } from "@/lib/outfit";
import { describeWeather } from "@/lib/weather";
import { CATEGORY_ACCENT, CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import {
  currentTime as formatClock,
  formatDateRangeMonth,
  formatDayNumber,
  formatLongDate,
  formatRelativeDay,
  formatWeekdayShort,
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
  const { reminders, addReminder, updateReminder, toggleDone, deleteReminder } = useReminders();
  const { items: shoppingItems, toggleItem: toggleShoppingItem } = useShoppingList();
  const week = useMemo(() => sevenDayWindow(today), [today]);
  const events = useMemo(() => expandEvents(allEvents, week), [allEvents, week]);

  // Au passage de minuit, la sélection revient d'elle-même sur le jour courant.
  const activeDate = selectedDate && week.includes(selectedDate) ? selectedDate : today;

  const dayEvents = eventsForDay(events, activeDate, selectedMember);
  const selectedWeather = forecast?.days.find((day) => day.date === activeDate);
  const focusedMember = selectedMember ? memberById(selectedMember) : undefined;

  function handleSaveEvent(values: NewEvent) {
    if (editingEvent) {
      updateEvent(baseEventId(editingEvent.id), values);
    } else {
      addEvent(values);
    }
    setEditingEvent(null);
    setCreatingEventOn(null);
  }

  function handleDeleteEvent() {
    if (!editingEvent) return;
    deleteEvent(baseEventId(editingEvent.id));
    setEditingEvent(null);
  }

  function handleSaveReminder(values: NewReminder) {
    if (editingReminder) {
      updateReminder(editingReminder.id, values);
    } else {
      addReminder(values);
    }
    setEditingReminder(null);
    setCreatingReminder(false);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <DashboardHeader today={today} currentTime={clock} />

      <FamilyStrip
        selectedMember={selectedMember}
        onSelect={(id) => setSelectedMember((current) => (current === id ? null : id))}
      />

      <WeatherSection
        forecast={forecast}
        error={weatherError}
        loading={weatherLoading}
        today={today}
      />

      <WeekSection
        week={week}
        today={today}
        selectedDate={activeDate}
        events={events}
        forecast={forecast}
        onSelect={setSelectedDate}
      />

      <DaySection
        date={activeDate}
        today={today}
        events={dayEvents}
        focusedMemberName={focusedMember?.firstName}
        onClearFilter={() => setSelectedMember(null)}
        onEditEvent={setEditingEvent}
        onAddEvent={() => setCreatingEventOn(activeDate)}
      />

      <RemindersSection
        reminders={reminders}
        today={today}
        onAdd={() => setCreatingReminder(true)}
        onEdit={setEditingReminder}
        onToggleDone={toggleDone}
      />

      <ShoppingSection items={shoppingItems} onToggle={toggleShoppingItem} />

      {forecast ? (
        <OutfitSection
          date={activeDate}
          today={today}
          day={selectedWeather ?? forecast.days[0]}
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
    </div>
  );
}

function DashboardHeader({ today, currentTime }: { today: string; currentTime: string }) {
  const longDate = formatLongDate(today);
  return (
    <header className="relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-sun-soft via-cream to-sage-soft/70 p-5 shadow-[0_3px_0_var(--color-line)] sm:p-6">
      {/* Touches décoratives, pour casser la carte plate — de simples ronds de couleur flous */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-sky-soft/60 blur-xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-rose-soft/50 blur-xl"
      />

      <Link href="/" className="relative flex flex-wrap items-center gap-4 sm:gap-5">
        <Image
          src="/famille-takam.jpg"
          alt="La famille Takam : Stéphane, Ernestine et Khloé"
          width={200}
          height={221}
          priority
          className="h-16 w-16 shrink-0 rounded-full border-4 border-white object-cover shadow-md sm:h-24 sm:w-24"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            Bienvenue à la maison
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Hello les Takam !
          </h1>
        </div>
      </Link>

      <div className="relative mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/70 pt-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Aujourd&apos;hui
          </p>
          <p className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
          </p>
        </div>
        <p
          data-testid="horloge"
          className="rounded-pill bg-white/80 px-4 py-1.5 text-lg font-extrabold text-ink-soft"
        >
          {currentTime}
        </p>
      </div>
    </header>
  );
}

function FamilyStrip({
  selectedMember,
  onSelect,
}: {
  selectedMember: MemberId | null;
  onSelect: (id: MemberId) => void;
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="La famille"
        title={selectedMember ? "Voir toute la famille" : "Qui regarde ?"}
        action={
          selectedMember ? (
            <span className="rounded-pill bg-cream-deep px-3 py-1 text-xs font-bold text-ink-soft">
              Touchez à nouveau pour tout afficher
            </span>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-3 sm:gap-5">
        {MEMBERS.map((member) => {
          const selected = selectedMember === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              aria-pressed={selected}
              className={`flex min-w-24 flex-1 flex-col items-center gap-2 rounded-card px-3 py-4 transition-colors sm:min-w-32 sm:flex-none ${
                selected ? "bg-cream-deep" : "hover:bg-cream-deep/60"
              }`}
            >
              <Avatar member={member} size="lg" selected={selected} />
              <span className="text-base font-extrabold text-ink">{member.firstName}</span>
              <span className="text-xs font-semibold text-ink-faint">
                {member.role === "parent" ? "Parent" : "5 ans"}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeatherSection({
  forecast,
  error,
  loading,
  today,
}: {
  forecast: WeatherForecast | null;
  error?: string;
  loading: boolean;
  today: string;
}) {
  if (!forecast) {
    return (
      <Card>
        <CardTitle
          eyebrow="Météo"
          title={loading ? "Météo en cours de chargement…" : "Météo momentanément indisponible"}
        />
        {loading ? null : (
          <p className="text-sm font-semibold text-ink-soft">
            {error ?? "Le service météo ne répond pas."} Le reste du tableau de bord fonctionne
            normalement.
          </p>
        )}
      </Card>
    );
  }

  const todayWeather = forecast.days.find((day) => day.date === today) ?? forecast.days[0];
  const now = describeWeather(forecast.now.weatherCode, forecast.now.isDay);

  return (
    <Card className="bg-gradient-to-br from-sky-soft/80 to-white/80">
      <CardTitle eyebrow={`Météo · ${forecast.locationName}`} title="La météo du jour" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-6xl leading-none" aria-hidden>
          {now.emoji}
        </span>
        <div>
          <p className="text-4xl font-extrabold tracking-tight text-ink">
            {forecast.now.temperature}°
          </p>
          <p className="text-sm font-semibold text-ink-soft">
            {now.label} · ressenti {forecast.now.feelsLike}°
          </p>
        </div>
        <dl className="flex gap-3">
          <WeatherStat label="Basse" value={`${todayWeather.minTemp}°`} tone="bg-sky-soft" />
          <WeatherStat label="Haute" value={`${todayWeather.maxTemp}°`} tone="bg-sun-soft" />
          <WeatherStat
            label="Pluie"
            value={`${todayWeather.rainChance} %`}
            tone="bg-lilac-soft"
          />
        </dl>
      </div>
    </Card>
  );
}

function WeatherStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-3xl ${tone} px-4 py-2 text-center`}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-xl font-extrabold text-ink">{value}</dd>
    </div>
  );
}

function WeekSection({
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
    <Card>
      <CardTitle
        eyebrow="7 prochains jours"
        title={formatDateRangeMonth(week)}
        action={
          <Link
            href="/calendrier"
            className="inline-flex min-h-11 items-center rounded-pill bg-cream-deep px-4 text-xs font-bold text-ink-soft hover:bg-line"
          >
            Tout le calendrier
          </Link>
        }
      />
      <ul className="scrollbar-soft -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
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
                className={`flex w-full min-w-24 flex-col items-center gap-1 rounded-3xl border px-2 py-3 transition-colors ${
                  isSelected
                    ? "border-sage bg-sage-soft"
                    : "border-line bg-white hover:bg-cream-deep/60"
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
                    isToday ? "text-sage" : "text-ink-faint"
                  }`}
                >
                  {isToday ? "AUJ." : formatWeekdayShort(date)}
                </span>
                <span className="text-2xl font-extrabold text-ink">{formatDayNumber(date)}</span>
                {look ? (
                  <span className="text-lg" aria-hidden>
                    {look.emoji}
                  </span>
                ) : null}
                {weather ? (
                  <span className="text-xs font-bold text-ink-soft">
                    {weather.maxTemp}° / {weather.minTemp}°
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-ink-faint">
                  {count === 0 ? "Rien de prévu" : `${count} rendez-vous`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
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
  return (
    <Card>
      <CardTitle
        eyebrow={formatRelativeDay(date, today)}
        title={
          focusedMemberName
            ? `Le programme de ${focusedMemberName}`
            : "Le programme de la journée"
        }
        action={
          <div className="flex items-center gap-2">
            {focusedMemberName ? (
              <button
                type="button"
                onClick={onClearFilter}
                className="inline-flex min-h-11 items-center rounded-pill bg-cream-deep px-4 text-xs font-bold text-ink-soft hover:bg-line"
              >
                Toute la famille
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAddEvent}
              className="inline-flex min-h-11 items-center gap-1 btn-pop btn-pop-sage px-4 text-xs font-extrabold "
            >
              <span aria-hidden>＋</span> Ajouter
            </button>
          </div>
        }
      />

      {events.length === 0 ? (
        <p className="rounded-3xl bg-cream-deep/60 px-4 py-6 text-center text-sm font-semibold text-ink-soft">
          Rien de prévu ce jour-là. 🌿
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} onEdit={() => onEditEvent(event)} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function EventRow({ event, onEdit }: { event: CalendarEvent; onEdit: () => void }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const people = event.memberIds
    .map((id) => memberById(id))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className={`flex w-full items-center gap-3 rounded-3xl ${accent.soft} px-4 py-3 text-left hover:brightness-97`}
      >
        <div className="w-16 shrink-0 text-center">
          <p className="text-base font-extrabold text-ink">{event.startTime ?? "Journée"}</p>
          {event.endTime ? (
            <p className="text-[11px] font-semibold text-ink-faint">jusqu&apos;à {event.endTime}</p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold break-words text-ink">{event.title}</p>
          <p className="text-xs font-semibold break-words text-ink-soft">
            {CATEGORY_LABEL[event.category]}
            {event.location ? ` · ${event.location}` : ""}
            {event.repeatsWeekly ? " · chaque semaine" : ""}
          </p>
        </div>
        <div className="flex -space-x-2">
          {people.map((member) => (
            <Avatar key={member.id} member={member} size="sm" />
          ))}
        </div>
      </button>
    </li>
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
    <Card className="bg-sun-soft/60">
      <CardTitle
        eyebrow="À ne pas oublier"
        title="Les actions clés de la semaine"
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-11 items-center gap-1 rounded-pill bg-white px-4 text-xs font-extrabold text-ink-soft hover:bg-cream-deep"
          >
            <span aria-hidden>＋</span> Ajouter
          </button>
        }
      />
      {reminders.length === 0 ? (
        <p className="text-sm font-semibold text-ink-soft">Rien d&apos;urgent cette semaine. 🎉</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reminders.map((reminder) => {
            const people = reminder.memberIds
              .map((id) => memberById(id))
              .filter((member): member is NonNullable<typeof member> => Boolean(member));
            return (
              <li
                key={reminder.id}
                className="flex items-center gap-3 rounded-3xl bg-white/80 px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => onToggleDone(reminder.id)}
                  aria-pressed={reminder.done}
                  aria-label={reminder.done ? "Marquer non fait" : "Marquer fait"}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg ${
                    reminder.done
                      ? "border-sage bg-sage text-white"
                      : "border-line bg-white text-transparent"
                  }`}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(reminder)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`text-base font-extrabold break-words ${
                      reminder.done ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    {reminder.label}
                  </p>
                  {reminder.dueDate ? (
                    <p className="text-xs font-semibold text-ink-soft">
                      {formatRelativeDay(reminder.dueDate, today)}
                    </p>
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
        eyebrow="Courses"
        title={
          left === 0 && items.length > 0
            ? "Tout est dans le caddie 🎉"
            : `${left} article${left > 1 ? "s" : ""} à prendre`
        }
        action={
          <Link
            href="/listes"
            className="inline-flex min-h-11 items-center rounded-pill bg-cream-deep px-4 text-xs font-bold text-ink-soft hover:bg-line"
          >
            Toute la liste
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="rounded-3xl bg-cream-deep/60 px-4 py-6 text-center text-sm font-semibold text-ink-soft">
          La liste est vide. 🌿
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {preview.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-3xl bg-white/80 px-4 py-2.5">
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={item.checked}
                aria-label={item.checked ? "Décocher cet article" : "Cocher cet article"}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base ${
                  item.checked
                    ? "border-sage bg-sage text-white"
                    : "border-line bg-white text-transparent"
                }`}
              >
                ✓
              </button>
              <span
                className={`min-w-0 flex-1 truncate text-sm font-extrabold ${
                  item.checked ? "text-ink-faint line-through" : "text-ink"
                }`}
              >
                {item.label}
                {item.quantity ? (
                  <span className="ml-2 text-xs font-semibold text-ink-faint">
                    {item.quantity}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
          {hiddenCount > 0 ? (
            <li className="px-2 text-xs font-bold text-ink-faint">
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
  return (
    <Card>
      <CardTitle
        eyebrow={`Tenue · ${formatRelativeDay(date, today)}`}
        title="Ce que chacun devrait porter"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MEMBERS.map((member) => {
          const outfit = suggestOutfit(member, day);
          const accent = accentClasses(member.accent);
          return (
            <article key={member.id} className={`rounded-card ${accent.soft} p-4`}>
              <header className="mb-3 flex items-center gap-3">
                <Avatar member={member} size="md" />
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-ink">{member.firstName}</p>
                  <p className="truncate text-xs font-semibold text-ink-soft">
                    {outfit.headline}
                  </p>
                </div>
              </header>
              <ul className="flex flex-col gap-1.5">
                {outfit.layers.map((layer, index) => (
                  <li
                    key={`${layer.slot}-${index}`}
                    className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2"
                  >
                    <span className="text-lg" aria-hidden>
                      {layer.emoji}
                    </span>
                    <span className="text-sm font-bold text-ink">{layer.label}</span>
                  </li>
                ))}
              </ul>
              {outfit.personalNote ? (
                <p className="mt-2 text-[11px] font-semibold text-ink-faint">
                  {outfit.personalNote}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </Card>
  );
}
