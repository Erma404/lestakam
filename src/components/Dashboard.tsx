"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Card, CardTitle } from "./Card";
import { MEMBERS, demoReminders, memberById } from "@/lib/family";
import { eventsForDay, expandEvents, sevenDayWindow } from "@/lib/events";
import { suggestOutfit } from "@/lib/outfit";
import { describeWeather } from "@/lib/weather";
import { CATEGORY_ACCENT, CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import {
  currentTime as formatClock,
  formatDayNumber,
  formatLongDate,
  formatRelativeDay,
  formatWeekdayShort,
  todayKey,
} from "@/lib/dates";
import { useEvents } from "@/lib/useEvents";
import { useNow } from "@/lib/useNow";
import { useWeather } from "@/lib/useWeather";
import type { CalendarEvent, MemberId, WeatherForecast } from "@/lib/types";

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

  const { events: allEvents } = useEvents();
  const week = useMemo(() => sevenDayWindow(today), [today]);
  const events = useMemo(() => expandEvents(allEvents, week), [allEvents, week]);
  const reminders = useMemo(() => demoReminders(today), [today]);

  // Au passage de minuit, la sélection revient d'elle-même sur le jour courant.
  const activeDate = selectedDate && week.includes(selectedDate) ? selectedDate : today;

  const dayEvents = eventsForDay(events, activeDate, selectedMember);
  const selectedWeather = forecast?.days.find((day) => day.date === activeDate);
  const focusedMember = selectedMember ? memberById(selectedMember) : undefined;

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
      />

      <RemindersSection reminders={reminders} today={today} />

      {forecast ? (
        <OutfitSection
          date={activeDate}
          today={today}
          day={selectedWeather ?? forecast.days[0]}
        />
      ) : null}
    </div>
  );
}

function DashboardHeader({ today, currentTime }: { today: string; currentTime: string }) {
  const longDate = formatLongDate(today);
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          Aujourd&apos;hui
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
        </h1>
      </div>
      <p
        data-testid="horloge"
        className="rounded-pill bg-white/80 px-4 py-1.5 text-lg font-extrabold text-ink-soft"
      >
        {currentTime}
      </p>
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
        title="La semaine"
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
}: {
  date: string;
  today: string;
  events: CalendarEvent[];
  focusedMemberName?: string;
  onClearFilter: () => void;
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
          focusedMemberName ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex min-h-11 items-center rounded-pill bg-cream-deep px-4 text-xs font-bold text-ink-soft hover:bg-line"
            >
              Toute la famille
            </button>
          ) : null
        }
      />

      {events.length === 0 ? (
        <p className="rounded-3xl bg-cream-deep/60 px-4 py-6 text-center text-sm font-semibold text-ink-soft">
          Rien de prévu ce jour-là. 🌿
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const accent = accentClasses(CATEGORY_ACCENT[event.category]);
  const people = event.memberIds
    .map((id) => memberById(id))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  return (
    <li className={`flex items-center gap-3 rounded-3xl ${accent.soft} px-4 py-3`}>
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
    </li>
  );
}

function RemindersSection({
  reminders,
  today,
}: {
  reminders: ReturnType<typeof demoReminders>;
  today: string;
}) {
  return (
    <Card className="bg-sun-soft/60">
      <CardTitle eyebrow="À ne pas oublier" title="Les actions clés de la semaine" />
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
                <span className="text-2xl" aria-hidden>
                  📌
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-extrabold break-words text-ink">
                    {reminder.label}
                  </p>
                  {reminder.dueDate ? (
                    <p className="text-xs font-semibold text-ink-soft">
                      {formatRelativeDay(reminder.dueDate, today)}
                    </p>
                  ) : null}
                </div>
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
