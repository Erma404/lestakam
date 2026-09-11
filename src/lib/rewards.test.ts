import { describe, expect, it } from "vitest";
import {
  achievedGoals,
  goalsToUnlock,
  nextGoal,
  startOfMonth,
  starsSince,
  starsThisMonth,
  starsThisWeek,
  totalStars,
  type StarEntry,
} from "./rewards";
import type { RewardGoal } from "./types";

const entries: StarEntry[] = [
  { id: "1", ritualId: "dents", date: "2026-09-01", stars: 1 },
  { id: "2", ritualId: "douche", date: "2026-09-10", stars: 1 },
  { id: "3", ritualId: "dodo", date: "2026-09-11", stars: 2 },
];

describe("totalStars", () => {
  it("additionne toutes les étoiles", () => {
    expect(totalStars(entries)).toBe(4);
  });

  it("renvoie zéro pour un journal vide", () => {
    expect(totalStars([])).toBe(0);
  });
});

describe("startOfMonth", () => {
  it("renvoie le premier jour du mois", () => {
    expect(startOfMonth("2026-09-11")).toBe("2026-09-01");
  });
});

describe("starsSince / starsThisWeek / starsThisMonth", () => {
  it("ne compte que les étoiles à partir d'une date incluse", () => {
    expect(starsSince(entries, "2026-09-10")).toBe(3);
  });

  it("calcule le total de la semaine en cours", () => {
    // Semaine du 7 au 13 septembre 2026 : douche (10) + dodo (11).
    expect(starsThisWeek(entries, "2026-09-11")).toBe(3);
  });

  it("calcule le total du mois en cours", () => {
    expect(starsThisMonth(entries, "2026-09-11")).toBe(4);
  });
});

const parc: RewardGoal = { id: "parc", memberId: "khloe", label: "Parc", emoji: "🛝", starsRequired: 20 };
const cinema: RewardGoal = {
  id: "cinema",
  memberId: "khloe",
  label: "Cinéma",
  emoji: "🍿",
  starsRequired: 40,
  achievedOn: "2026-08-01",
};
const surprise: RewardGoal = {
  id: "surprise",
  memberId: "khloe",
  label: "Surprise",
  emoji: "🎁",
  starsRequired: 60,
};

describe("nextGoal", () => {
  it("renvoie l'objectif non débloqué le moins coûteux", () => {
    expect(nextGoal([surprise, parc, cinema])?.id).toBe("parc");
  });

  it("ne renvoie rien quand tout est débloqué", () => {
    expect(nextGoal([cinema])).toBeUndefined();
  });
});

describe("achievedGoals", () => {
  it("ne garde que les objectifs débloqués, du plus récent au plus ancien", () => {
    const older = { ...cinema, id: "ancien", achievedOn: "2026-01-01" };
    expect(achievedGoals([parc, cinema, older]).map((goal) => goal.id)).toEqual([
      "cinema",
      "ancien",
    ]);
  });
});

describe("goalsToUnlock", () => {
  it("trouve les objectifs atteints mais pas encore marqués débloqués", () => {
    expect(goalsToUnlock([parc, cinema, surprise], 25).map((goal) => goal.id)).toEqual(["parc"]);
  });

  it("ne renvoie rien si aucun seuil n'est atteint", () => {
    expect(goalsToUnlock([parc, surprise], 5)).toEqual([]);
  });
});
