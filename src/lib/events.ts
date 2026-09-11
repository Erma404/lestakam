import type { CalendarEvent, MemberId } from "./types";
import { addDays, fromDateKey } from "./dates";

/**
 * Développe les événements récurrents sur une fenêtre de dates.
 * Un événement hebdomadaire réapparaît chaque semaine le même jour,
 * à partir de sa date d'origine.
 */
export function expandEvents(events: CalendarEvent[], windowDays: string[]): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.repeatsWeekly) {
      if (windowDays.includes(event.date)) expanded.push(event);
      continue;
    }

    const origin = fromDateKey(event.date).getTime();
    for (const day of windowDays) {
      const target = fromDateKey(day).getTime();
      if (target < origin) continue;
      const daysApart = Math.round((target - origin) / 86_400_000);
      if (daysApart % 7 === 0) {
        expanded.push({ ...event, id: `${event.id}@${day}`, date: day });
      }
    }
  }

  return expanded;
}

/** Événements d'un jour donné, triés par heure, éventuellement filtrés par membre. */
export function eventsForDay(
  events: CalendarEvent[],
  date: string,
  memberId?: MemberId | null,
): CalendarEvent[] {
  return events
    .filter((event) => event.date === date)
    .filter((event) => !memberId || event.memberIds.includes(memberId))
    .sort((a, b) => (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00"));
}

/** Prochain événement à venir pour un membre, sur la fenêtre fournie. */
export function nextEventForMember(
  events: CalendarEvent[],
  memberId: MemberId,
  fromDate: string,
): CalendarEvent | undefined {
  return events
    .filter((event) => event.memberIds.includes(memberId) && event.date >= fromDate)
    .sort((a, b) => {
      const dateOrder = a.date.localeCompare(b.date);
      if (dateOrder !== 0) return dateOrder;
      return (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00");
    })[0];
}

/**
 * Retrouve l'événement d'origine à partir d'une occurrence répétée.
 * `expandEvents` numérote les répétitions sous la forme « identifiant@date ».
 */
export function baseEventId(id: string): string {
  return id.split("@")[0];
}

/** Fenêtre glissante de 7 jours à partir d'une date. */
export function sevenDayWindow(from: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(from, index));
}

/** Convertit "HH:MM" en minutes depuis minuit. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

/** Durée par défaut affichée dans la grille quand aucune heure de fin n'est donnée. */
const DEFAULT_DURATION_MIN = 60;

export interface TimeSpan {
  startMin: number;
  endMin: number;
}

/** Bornes d'un événement dans la grille horaire, en minutes depuis minuit. */
export function eventTimeSpan(event: CalendarEvent): TimeSpan {
  const startMin = event.startTime ? timeToMinutes(event.startTime) : 0;
  const endMin = event.endTime
    ? Math.max(timeToMinutes(event.endTime), startMin + 15)
    : startMin + DEFAULT_DURATION_MIN;
  return { startMin, endMin };
}

export interface PositionedEvent<T> {
  event: T;
  /** Colonne attribuée, 0 = la plus à gauche. */
  column: number;
  /** Nombre de colonnes du groupe d'événements qui se chevauchent avec celui-ci. */
  columns: number;
}

/**
 * Répartit des événements qui peuvent se chevaucher en colonnes côte à côte,
 * comme dans un calendrier classique (Gmail, iCal…). Les événements doivent
 * déjà être ceux d'un seul et même jour.
 */
export function layoutOverlapping<T extends TimeSpan>(events: T[]): PositionedEvent<T>[] {
  const sorted = [...events].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin,
  );
  const result: PositionedEvent<T>[] = [];
  const active: { event: T; column: number }[] = [];
  let cluster: { event: T; column: number }[] = [];

  function flushCluster() {
    if (cluster.length === 0) return;
    const columns = Math.max(...cluster.map((entry) => entry.column)) + 1;
    for (const entry of cluster) result.push({ event: entry.event, column: entry.column, columns });
    cluster = [];
  }

  for (const event of sorted) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].event.endMin <= event.startMin) active.splice(i, 1);
    }
    if (active.length === 0) flushCluster();

    const usedColumns = new Set(active.map((entry) => entry.column));
    let column = 0;
    while (usedColumns.has(column)) column += 1;

    const entry = { event, column };
    active.push(entry);
    cluster.push(entry);
  }
  flushCluster();

  return result;
}
