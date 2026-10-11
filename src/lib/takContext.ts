/**
 * L'état de l'application résumé en texte, pour que Tak réponde à partir de
 * ce que la famille voit réellement à l'écran (et non de suppositions).
 */

import { MEMBERS } from "./family";
import { CATEGORY_LABEL } from "./accents";
import { addDays, formatLongDate } from "./dates";
import { expandEvents } from "./events";
import { describeWeather } from "./weather";
import { nextGoal, starsThisWeek, type StarEntry } from "./rewards";
import type { CalendarEvent, RewardGoal, ShoppingItem, WeatherForecast } from "./types";

/** Fenêtre du calendrier transmise à Tak : assez pour « ce week-end » ou « la semaine prochaine ». */
const EVENT_WINDOW_DAYS = 14;

export interface TakContextInput {
  today: string;
  events: CalendarEvent[];
  shoppingItems: ShoppingItem[];
  starEntries: StarEntry[];
  goals: RewardGoal[];
  forecast: WeatherForecast | null;
}

const FIRST_NAME: Record<string, string> = Object.fromEntries(
  MEMBERS.map((member) => [member.id, member.firstName]),
);

function windowFrom(today: string, length: number): string[] {
  return Array.from({ length }, (_, index) => addDays(today, index));
}

export function buildTakContext(input: TakContextInput): string {
  const sections: string[] = [];

  if (input.forecast) {
    const { now, days, locationName } = input.forecast;
    const lines = [
      `Maintenant à ${locationName} : ${Math.round(now.temperature)}° (ressenti ${Math.round(now.feelsLike)}°), ${describeWeather(now.weatherCode, now.isDay).label.toLowerCase()}.`,
      ...days.map(
        (day) =>
          `- ${formatLongDate(day.date)} : ${Math.round(day.minTemp)}° à ${Math.round(day.maxTemp)}°, ${describeWeather(day.weatherCode).label.toLowerCase()}, pluie ${day.rainChance} %`,
      ),
    ];
    sections.push(`MÉTÉO\n${lines.join("\n")}`);
  }

  const eventWindow = windowFrom(input.today, EVENT_WINDOW_DAYS);
  const events = expandEvents(input.events, eventWindow).sort(
    (a, b) =>
      a.date.localeCompare(b.date) || (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00"),
  );
  sections.push(
    `CALENDRIER (${EVENT_WINDOW_DAYS} prochains jours)\n` +
      (events.length > 0
        ? events
            .map((event) => {
              const hours = event.startTime
                ? ` ${event.startTime}${event.endTime ? `-${event.endTime}` : ""}`
                : " (journée)";
              const who = event.memberIds.map((id) => FIRST_NAME[id] ?? id).join(", ");
              const where = event.location ? `, à ${event.location}` : "";
              const category = CATEGORY_LABEL[event.category] ?? event.category;
              return `- ${formatLongDate(event.date)}${hours} : ${event.title} (${category}, ${who}${where})`;
            })
            .join("\n")
        : "Rien de prévu."),
  );

  const toBuy = input.shoppingItems.filter((item) => !item.checked);
  sections.push(
    "LISTE DE COURSES (à acheter)\n" +
      (toBuy.length > 0
        ? toBuy.map((item) => `- ${item.label}${item.quantity ? ` (${item.quantity})` : ""}`).join("\n")
        : "Liste vide."),
  );

  const total = input.starEntries.reduce((sum, entry) => sum + entry.stars, 0);
  const upcoming = nextGoal(input.goals);
  const achieved = input.goals.filter((goal) => goal.achievedOn).map((goal) => goal.label);
  sections.push(
    [
      "ÉTOILES DE KHLOÉ",
      `Total : ${total} étoiles, dont ${starsThisWeek(input.starEntries, input.today)} cette semaine.`,
      upcoming
        ? `Prochain objectif : ${upcoming.label} à ${upcoming.starsRequired} étoiles (encore ${Math.max(upcoming.starsRequired - total, 0)}).`
        : "Aucun objectif en cours.",
      achieved.length > 0 ? `Récompenses déjà gagnées : ${achieved.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return sections.join("\n\n");
}
