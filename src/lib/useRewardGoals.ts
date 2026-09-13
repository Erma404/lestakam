"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useStoredState } from "./localStore";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import { REWARD_GOALS } from "./family";
import type { RewardGoal } from "./types";
import type { RewardGoalRow } from "./supabase/database.types";

const STORAGE_KEY = "objectifs";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NewRewardGoal = Omit<RewardGoal, "id" | "achievedOn">;

function rowToGoal(row: RewardGoalRow): RewardGoal {
  return {
    id: row.id,
    memberId: "khloe",
    label: row.label,
    emoji: row.emoji,
    starsRequired: row.stars_required,
    achievedOn: row.achieved_on ?? undefined,
  };
}

/**
 * Les objectifs de récompense de Khloé, personnalisables par les parents.
 *
 * Une fois la base connectée, ils viennent de la table `reward_goals` —
 * les mêmes pour Stéphane et Ernestine — plutôt que d'être propres à
 * chaque appareil.
 */
export function useRewardGoals() {
  const { shared, khloe } = useHouseholdShared();
  const [localStored, setLocalStored] = useStoredState<RewardGoal[] | null>(STORAGE_KEY, null);
  const [rows, setRows] = useState<RewardGoalRow[] | null>(null);
  // Un identifiant propre à chaque appel de ce hook, pour que deux
  // composants montés en même temps n'ouvrent pas un canal Supabase du
  // même nom (voir useRituals / useStars / useRitualStatus).
  const instanceId = useId();

  useEffect(() => {
    if (!shared || !khloe) return;
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function load() {
      if (!supabase || !khloe) return;
      const { data, error } = await supabase
        .from("reward_goals")
        .select("*")
        .eq("member_id", khloe.id)
        .order("sort_order", { ascending: true });
      if (!cancelled && !error) setRows(data ?? []);
    }

    load();
    const channel = supabase
      .channel(`reward-goals-${khloe.household_id}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reward_goals",
          filter: `household_id=eq.${khloe.household_id}`,
        },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [shared, khloe, instanceId]);

  const localGoals = localStored ?? REWARD_GOALS;
  const goals = shared ? (rows ? rows.map(rowToGoal) : []) : localGoals;

  const addGoal = useCallback(
    (goal: NewRewardGoal) => {
      if (shared && khloe) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        // Un constructeur de requête Supabase ne part sur le réseau que si on
        // consomme sa promesse (.then/.catch/await) : un simple `void` devant
        // construit l'objet sans jamais l'envoyer, et l'écriture disparaît en
        // silence (aucune erreur, aucune requête réseau, rien).
        supabase
          .from("reward_goals")
          .insert({
            household_id: khloe.household_id,
            member_id: khloe.id,
            label: goal.label,
            emoji: goal.emoji,
            stars_required: goal.starsRequired,
            sort_order: rows?.length ?? 0,
          })
          .then(({ error }) => {
            if (error) console.error("Ajout de l'objectif impossible :", error);
          });
        return;
      }
      const created: RewardGoal = { ...goal, id: newId() };
      setLocalStored([...localGoals, created]);
    },
    [shared, khloe, rows, localGoals, setLocalStored],
  );

  const updateGoal = useCallback(
    (id: string, changes: Partial<NewRewardGoal>) => {
      if (shared) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const patch: Partial<RewardGoalRow> = {};
        if (changes.label !== undefined) patch.label = changes.label;
        if (changes.emoji !== undefined) patch.emoji = changes.emoji;
        if (changes.starsRequired !== undefined) patch.stars_required = changes.starsRequired;
        supabase
          .from("reward_goals")
          .update(patch)
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Modification de l'objectif impossible :", error);
          });
        return;
      }
      setLocalStored(localGoals.map((goal) => (goal.id === id ? { ...goal, ...changes } : goal)));
    },
    [shared, localGoals, setLocalStored],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      if (shared) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        supabase
          .from("reward_goals")
          .delete()
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Suppression de l'objectif impossible :", error);
          });
        return;
      }
      setLocalStored(localGoals.filter((goal) => goal.id !== id));
    },
    [shared, localGoals, setLocalStored],
  );

  /** Marque un objectif comme débloqué, sans écraser une date déjà posée. */
  const markAchieved = useCallback(
    (id: string, date: string) => {
      if (shared) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        // `is` plutôt que d'écraser : si deux appareils le détectent au même
        // moment, seul le premier passage compte.
        supabase
          .from("reward_goals")
          .update({ achieved_on: date })
          .eq("id", id)
          .is("achieved_on", null)
          .then(({ error }) => {
            if (error) console.error("Enregistrement de l'objectif débloqué impossible :", error);
          });
        return;
      }
      setLocalStored(
        localGoals.map((goal) => (goal.id === id && !goal.achievedOn ? { ...goal, achievedOn: date } : goal)),
      );
    },
    [shared, localGoals, setLocalStored],
  );

  const resetToDemo = useCallback(() => {
    if (shared) return;
    setLocalStored(null);
  }, [shared, setLocalStored]);

  return { goals, addGoal, updateGoal, deleteGoal, markAchieved, resetToDemo, shared };
}
