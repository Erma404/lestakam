"use client";

import { useCallback, useMemo } from "react";
import { useStoredState } from "./localStore";
import { demoMeals } from "./family";
import { todayKey } from "./dates";
import type { Meal } from "./types";

const STORAGE_KEY = "repas";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NewMeal = Omit<Meal, "id">;

/**
 * Les repas planifiés de la famille.
 *
 * Même principe que le calendrier : mémorisés sur l'appareil tant que la
 * base partagée n'est pas connectée, avec quelques exemples de départ qui
 * disparaissent dès la première modification.
 */
export function useMeals() {
  const [stored, setStored] = useStoredState<Meal[] | null>(STORAGE_KEY, null);

  const meals = useMemo(() => stored ?? demoMeals(todayKey()), [stored]);
  const currentList = useCallback(() => stored ?? demoMeals(todayKey()), [stored]);

  const addMeal = useCallback(
    (meal: NewMeal): Meal => {
      const created: Meal = { ...meal, id: newId() };
      setStored([...currentList(), created]);
      return created;
    },
    [currentList, setStored],
  );

  const updateMeal = useCallback(
    (id: string, changes: Partial<NewMeal>) => {
      setStored(currentList().map((meal) => (meal.id === id ? { ...meal, ...changes } : meal)));
    },
    [currentList, setStored],
  );

  const deleteMeal = useCallback(
    (id: string) => {
      setStored(currentList().filter((meal) => meal.id !== id));
    },
    [currentList, setStored],
  );

  const resetToDemo = useCallback(() => setStored(null), [setStored]);

  return { meals, addMeal, updateMeal, deleteMeal, resetToDemo };
}
