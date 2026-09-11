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

/** Fenêtre glissante de 7 jours à partir d'une date. */
export function sevenDayWindow(from: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(from, index));
}
