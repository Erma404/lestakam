"use client";

import { useCallback, useMemo } from "react";
import { useStoredState } from "./localStore";
import { REWARD_GOALS } from "./family";
import type { RewardGoal } from "./types";

const STORAGE_KEY = "objectifs";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NewRewardGoal = Omit<RewardGoal, "id" | "achievedOn">;

/**
 * Les objectifs de récompense, personnalisables par les parents.
 *
 * Comme le calendrier et les repas : mémorisés sur l'appareil, avec les
 * trois objectifs de départ tant qu'aucun n'a été modifié.
 */
export function useRewardGoals() {
  const [stored, setStored] = useStoredState<RewardGoal[] | null>(STORAGE_KEY, null);

  const goals = useMemo(() => stored ?? REWARD_GOALS, [stored]);
  const currentList = useCallback(() => stored ?? REWARD_GOALS, [stored]);

  const addGoal = useCallback(
    (goal: NewRewardGoal): RewardGoal => {
      const created: RewardGoal = { ...goal, id: newId() };
      setStored([...currentList(), created]);
      return created;
    },
    [currentList, setStored],
  );

  const updateGoal = useCallback(
    (id: string, changes: Partial<NewRewardGoal>) => {
      setStored(currentList().map((goal) => (goal.id === id ? { ...goal, ...changes } : goal)));
    },
    [currentList, setStored],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setStored(currentList().filter((goal) => goal.id !== id));
    },
    [currentList, setStored],
  );

  /** Marque un objectif comme débloqué, sans écraser une date déjà posée. */
  const markAchieved = useCallback(
    (id: string, date: string) => {
      setStored(
        currentList().map((goal) =>
          goal.id === id && !goal.achievedOn ? { ...goal, achievedOn: date } : goal,
        ),
      );
    },
    [currentList, setStored],
  );

  const resetToDemo = useCallback(() => setStored(null), [setStored]);

  return { goals, addGoal, updateGoal, deleteGoal, markAchieved, resetToDemo };
}
