import type { Meal } from "./types";

/** Ordre d'affichage des moments de la journée. */
export const MEAL_MOMENTS: Meal["moment"][] = ["midi", "soir"];

export const MEAL_MOMENT_LABEL: Record<Meal["moment"], string> = {
  midi: "Midi",
  soir: "Soir",
};

/** Repas d'un jour donné, triés midi puis soir. */
export function mealsForDay(meals: Meal[], date: string): Meal[] {
  return meals
    .filter((meal) => meal.date === date)
    .sort((a, b) => MEAL_MOMENTS.indexOf(a.moment) - MEAL_MOMENTS.indexOf(b.moment));
}

/** Le repas prévu à un moment donné d'un jour donné, s'il existe. */
export function mealFor(meals: Meal[], date: string, moment: Meal["moment"]): Meal | undefined {
  return meals.find((meal) => meal.date === date && meal.moment === moment);
}

/** Jours de la fenêtre qui ont au moins un repas planifié. */
export function daysWithMeals(meals: Meal[], window: string[]): string[] {
  return window.filter((date) => meals.some((meal) => meal.date === date));
}
