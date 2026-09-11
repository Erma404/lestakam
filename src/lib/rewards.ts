import type { RewardGoal } from "./types";
import { startOfMonth, startOfWeek } from "./dates";

export { startOfMonth };

export interface StarEntry {
  id: string;
  ritualId: string;
  /** Date au format AAAA-MM-JJ à laquelle l'étoile a été gagnée. */
  date: string;
  stars: number;
}

/** Total d'étoiles jamais gagnées, toutes dates confondues. */
export function totalStars(entries: StarEntry[]): number {
  return entries.reduce((total, entry) => total + entry.stars, 0);
}

/** Étoiles gagnées depuis une date donnée, incluse. */
export function starsSince(entries: StarEntry[], since: string): number {
  return entries.filter((entry) => entry.date >= since).reduce((total, entry) => total + entry.stars, 0);
}

export function starsThisWeek(entries: StarEntry[], today: string): number {
  return starsSince(entries, startOfWeek(today));
}

export function starsThisMonth(entries: StarEntry[], today: string): number {
  return starsSince(entries, startOfMonth(today));
}

/** Le prochain objectif non débloqué, le moins coûteux en premier. */
export function nextGoal(goals: RewardGoal[]): RewardGoal | undefined {
  return [...goals]
    .filter((goal) => !goal.achievedOn)
    .sort((a, b) => a.starsRequired - b.starsRequired)[0];
}

/** Objectifs débloqués, du plus récent au plus ancien. */
export function achievedGoals(goals: RewardGoal[]): RewardGoal[] {
  return [...goals]
    .filter((goal): goal is RewardGoal & { achievedOn: string } => Boolean(goal.achievedOn))
    .sort((a, b) => b.achievedOn.localeCompare(a.achievedOn));
}

/** Objectifs qui viennent d'être atteints et qui restent à marquer débloqués. */
export function goalsToUnlock(goals: RewardGoal[], total: number): RewardGoal[] {
  return goals.filter((goal) => !goal.achievedOn && goal.starsRequired <= total);
}
