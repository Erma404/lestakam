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

/**
 * Les récompenses fonctionnent par tours : une fois l'objectif le plus élevé
 * atteint (ex. 60 étoiles), le compteur de progression repart à 0 et tous
 * les objectifs peuvent être regagnés. Le total « depuis le début » et le
 * niveau, eux, ne repartent jamais à zéro.
 */
export interface RewardCycle {
  /** Numéro du tour en cours, à partir de 1. */
  round: number;
  /** Étoiles comptées dans le tour en cours (60 tant que le dernier objectif vient d'être atteint). */
  stars: number;
  /** Étoiles nécessaires pour boucler le tour. */
  size: number;
}

export function rewardCycle(goals: RewardGoal[], total: number): RewardCycle {
  const size = goals.reduce((max, goal) => Math.max(max, goal.starsRequired), 0);
  if (size <= 0 || total <= 0) return { round: 1, stars: Math.max(total, 0), size };
  // 60 reste dans le 1er tour (objectif final atteint) ; 61 ouvre le 2e tour avec 1 étoile.
  const completed = Math.floor((total - 1) / size);
  return { round: completed + 1, stars: total - completed * size, size };
}

/**
 * Vrai quand un nouveau tour a commencé mais que des objectifs portent
 * encore la date du tour précédent : il faut les remettre en jeu.
 */
export function needsNewRound(goals: RewardGoal[], cycleStars: number): boolean {
  return goals.some((goal) => goal.achievedOn && goal.starsRequired > cycleStars);
}
