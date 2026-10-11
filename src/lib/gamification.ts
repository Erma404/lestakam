/**
 * Niveaux et séries de Khloé : de quoi donner envie de revenir chaque jour,
 * calculé uniquement à partir du journal d'étoiles.
 */

import { addDays } from "./dates";
import type { StarEntry } from "./rewards";

/** Paliers de niveau, en étoiles cumulées depuis le début. */
const LEVELS = [
  { from: 0, name: "Petite graine" },
  { from: 15, name: "Jeune pousse" },
  { from: 40, name: "Étoile filante" },
  { from: 80, name: "Super étoile" },
  { from: 140, name: "Comète" },
  { from: 220, name: "Constellation" },
  { from: 320, name: "Galaxie" },
];

export interface Level {
  number: number;
  name: string;
  /** Étoiles gagnées dans le niveau en cours. */
  progress: number;
  /** Étoiles nécessaires pour passer au suivant, ou `null` au dernier niveau. */
  span: number | null;
  nextName: string | null;
}

export function levelFor(totalStars: number): Level {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (totalStars >= LEVELS[i].from) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  return {
    number: index + 1,
    name: current.name,
    progress: totalStars - current.from,
    span: next ? next.from - current.from : null,
    nextName: next?.name ?? null,
  };
}

/**
 * Jours d'affilée avec au moins un rituel validé. Aujourd'hui compte s'il
 * est déjà commencé, sans casser la série tant que la journée n'est pas finie.
 */
export function currentStreak(entries: StarEntry[], today: string): number {
  const days = new Set(entries.filter((entry) => entry.stars > 0).map((entry) => entry.date));
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
