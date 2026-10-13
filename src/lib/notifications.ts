import { addDays } from "./dates";
import { expandEvents, timeToMinutes } from "./events";
import { memberById } from "./family";
import type { CalendarEvent, Reminder } from "./types";

/** Heure du récapitulatif du lendemain. */
export const EVENING_DIGEST_FROM = "19:00";
/** Rappel envoyé avant un événement à heure fixe. */
export const MINUTES_BEFORE_EVENT = 60;
/** Les « À ne pas oublier » du jour partent le matin, et plus après le soir. */
export const REMINDERS_FROM = "08:00";
export const REMINDERS_UNTIL = "21:00";

/** L'école revient chaque jour : la rappeler serait du bruit. */
const QUIET_CATEGORIES = new Set(["ecole"]);

export interface PlannedNotification {
  /** Clé unique : une notification n'est jamais envoyée deux fois. */
  key: string;
  title: string;
  body: string;
  /** Page ouverte au toucher. */
  url: string;
}

function who(event: CalendarEvent): string {
  const names = event.memberIds
    .map((id) => memberById(id)?.firstName)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 && names.length < 3 ? `${names.join(" et ")} : ` : "";
}

function describe(event: CalendarEvent): string {
  const time = event.startTime ? `${event.startTime.replace(":", "h")} ` : "";
  return `${time}${who(event)}${event.title}`;
}

/**
 * Ce qu'il faut envoyer maintenant (date AAAA-MM-JJ et heure HH:MM à Paris),
 * en écartant ce qui est déjà parti (`alreadySent`). Le planificateur passe
 * toutes les quelques minutes : chaque règle couvre une plage horaire, pour
 * qu'un passage en retard ne fasse rien manquer.
 */
export function planNotifications(
  events: CalendarEvent[],
  reminders: Reminder[],
  today: string,
  time: string,
  alreadySent: ReadonlySet<string>,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const now = timeToMinutes(time);
  const tomorrow = addDays(today, 1);
  const occurrences = expandEvents(events, [today, tomorrow]).filter(
    (event) => !QUIET_CATEGORIES.has(event.category),
  );

  // 1. Le soir, ce qui attend la famille demain.
  if (time >= EVENING_DIGEST_FROM) {
    const key = `veille:${tomorrow}`;
    const tomorrowEvents = occurrences
      .filter((event) => event.date === tomorrow)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    if (tomorrowEvents.length > 0 && !alreadySent.has(key)) {
      planned.push({
        key,
        title: tomorrowEvents.length === 1 ? "Demain" : `Demain, ${tomorrowEvents.length} rendez-vous`,
        body: tomorrowEvents.map(describe).join("\n"),
        url: "/calendrier",
      });
    }
  }

  // 2. Une heure avant chaque événement à heure fixe.
  for (const event of occurrences) {
    if (event.date !== today || !event.startTime) continue;
    const start = timeToMinutes(event.startTime);
    if (now < start - MINUTES_BEFORE_EVENT || now >= start) continue;
    const key = `avant:${event.id}:${today}`;
    if (alreadySent.has(key)) continue;
    const place = event.location ? `\n${event.location}` : "";
    planned.push({
      key,
      title: `À ${event.startTime.replace(":", "h")} : ${event.title}`,
      body: `${who(event).replace(/ : $/, "") || "Toute la famille"}${place}`,
      url: "/calendrier",
    });
  }

  // 3. Les « À ne pas oublier » du jour, le matin.
  if (time >= REMINDERS_FROM && time < REMINDERS_UNTIL) {
    for (const reminder of reminders) {
      if (reminder.done || reminder.dueDate !== today) continue;
      const key = `rappel:${reminder.id}:${today}`;
      if (alreadySent.has(key)) continue;
      planned.push({ key, title: "À ne pas oublier", body: reminder.label, url: "/" });
    }
  }

  return planned;
}
