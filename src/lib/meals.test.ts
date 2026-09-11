import { describe, expect, it } from "vitest";
import { daysWithMeals, mealFor, mealsForDay } from "./meals";
import type { Meal } from "./types";

const soir: Meal = {
  id: "soir",
  date: "2026-09-11",
  moment: "soir",
  title: "Gratin de pâtes",
  emoji: "🧀",
};

const midi: Meal = {
  id: "midi",
  date: "2026-09-11",
  moment: "midi",
  title: "Riz, poisson, salade",
  emoji: "🐟",
};

const autreJour: Meal = {
  id: "autre-jour",
  date: "2026-09-12",
  moment: "soir",
  title: "Poulet rôti",
  emoji: "🍗",
};

describe("mealsForDay", () => {
  it("ne garde que les repas du jour demandé", () => {
    expect(mealsForDay([soir, midi, autreJour], "2026-09-11")).toHaveLength(2);
  });

  it("trie midi avant soir", () => {
    const result = mealsForDay([soir, midi], "2026-09-11");
    expect(result.map((meal) => meal.moment)).toEqual(["midi", "soir"]);
  });
});

describe("mealFor", () => {
  it("retrouve le repas d'un moment précis", () => {
    expect(mealFor([soir, midi], "2026-09-11", "soir")?.title).toBe("Gratin de pâtes");
  });

  it("ne renvoie rien quand aucun repas n'est prévu", () => {
    expect(mealFor([midi], "2026-09-11", "soir")).toBeUndefined();
  });
});

describe("daysWithMeals", () => {
  it("ne garde que les jours ayant au moins un repas prévu", () => {
    const window = ["2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"];
    expect(daysWithMeals([soir, midi, autreJour], window)).toEqual([
      "2026-09-11",
      "2026-09-12",
    ]);
  });
});
