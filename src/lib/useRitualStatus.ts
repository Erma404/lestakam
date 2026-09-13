"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useStoredState } from "./localStore";
import { useStars } from "./useStars";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import type { Ritual, RitualState } from "./types";

export type RitualStatusMap = Record<string, RitualState>;

const EMPTY_STATUSES: RitualStatusMap = {};

/**
 * Le suivi des rituels de Khloé pour une journée donnée, et le journal
 * d'étoiles qui va avec. Utilisé à la fois par le tableau des rituels et
 * par Tak, pour qu'une validation dite à l'oral compte de la même façon
 * qu'une validation faite du bout du doigt.
 *
 * Une fois la base connectée, ce suivi est partagé : ce que Khloé coche
 * sur la tablette de la cuisine, ou qu'un parent valide depuis son
 * téléphone, apparaît chez tout le monde.
 */
export function useRitualStatus(today: string) {
  const { shared, khloe, actingMember } = useHouseholdShared();
  const [localStatuses, setLocalStatuses] = useStoredState<RitualStatusMap>(
    `rituels:${today}`,
    EMPTY_STATUSES,
  );
  const [sharedStatuses, setSharedStatuses] = useState<RitualStatusMap | null>(null);
  const { total: starsEarned, logStar, unlogStar } = useStars();
  // Tak (monté sur toutes les pages) et la page Rituels peuvent utiliser ce
  // hook en même temps : un identifiant propre à chaque appel évite que
  // leurs canaux Supabase ne portent le même nom.
  const instanceId = useId();

  useEffect(() => {
    if (!shared || !khloe) return;
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function load() {
      if (!supabase || !khloe) return;
      const { data, error } = await supabase
        .from("ritual_status")
        .select("ritual_id, state")
        .eq("household_id", khloe.household_id)
        .eq("status_date", today);
      if (!cancelled && !error) {
        const map: RitualStatusMap = {};
        for (const row of data ?? []) map[row.ritual_id] = row.state;
        setSharedStatuses(map);
      }
    }

    load();
    const channel = supabase
      .channel(`ritual-status-${khloe.household_id}-${today}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ritual_status",
          filter: `household_id=eq.${khloe.household_id}`,
        },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [shared, khloe, today, instanceId]);

  const statuses = shared ? (sharedStatuses ?? EMPTY_STATUSES) : localStatuses;

  const writeStatus = useCallback(
    (ritualId: string, state: "coche" | "valide") => {
      const supabase = getSupabaseClient();
      if (!supabase || !khloe) return;
      // Un constructeur de requête Supabase ne part sur le réseau que si on
      // consomme sa promesse (.then/.catch/await) : un simple `void` devant
      // construit l'objet sans jamais l'envoyer, et l'écriture disparaît en
      // silence (aucune erreur, aucune requête réseau, rien).
      supabase
        .from("ritual_status")
        .upsert(
          {
            household_id: khloe.household_id,
            ritual_id: ritualId,
            status_date: today,
            state,
            approved_by: state === "valide" ? (actingMember?.id ?? null) : null,
            approved_at: state === "valide" ? new Date().toISOString() : null,
          },
          { onConflict: "ritual_id,status_date" },
        )
        .then(({ error }) => {
          if (error) console.error("Écriture du rituel impossible :", error);
        });
    },
    [khloe, today, actingMember],
  );

  const clearStatus = useCallback(
    (ritualId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase || !khloe) return;
      supabase
        .from("ritual_status")
        .delete()
        .eq("household_id", khloe.household_id)
        .eq("ritual_id", ritualId)
        .eq("status_date", today)
        .then(({ error }) => {
          if (error) console.error("Suppression du rituel impossible :", error);
        });
    },
    [khloe, today],
  );

  /** Coche ou décoche un rituel ; passe par « à valider » s'il faut l'accord d'un parent. */
  const toggle = useCallback(
    (ritual: Ritual) => {
      const state = statuses[ritual.id];
      if (state === undefined) {
        const nextState: RitualState = ritual.needsParentApproval ? "coche" : "valide";
        if (shared) {
          writeStatus(ritual.id, nextState);
        } else {
          setLocalStatuses((current) => ({ ...current, [ritual.id]: nextState }));
          if (nextState === "valide") logStar(ritual.id, today, ritual.stars);
        }
      } else {
        if (shared) {
          clearStatus(ritual.id);
        } else {
          setLocalStatuses((current) => {
            const next = { ...current };
            delete next[ritual.id];
            return next;
          });
          if (state === "valide") unlogStar(ritual.id, today);
        }
      }
    },
    [statuses, shared, writeStatus, clearStatus, setLocalStatuses, logStar, unlogStar, today],
  );

  /** Un parent confirme un rituel déjà coché par Khloé. */
  const approve = useCallback(
    (ritual: Ritual) => {
      if (shared) {
        writeStatus(ritual.id, "valide");
      } else {
        setLocalStatuses((current) => ({ ...current, [ritual.id]: "valide" }));
        logStar(ritual.id, today, ritual.stars);
      }
    },
    [shared, writeStatus, setLocalStatuses, logStar, today],
  );

  /**
   * Valide directement un rituel par son identifiant, sans passer par l'état
   * intermédiaire « à valider ». Utilisé par Tak : dire qu'un rituel est fait
   * équivaut à ce qu'un parent le confirme lui-même. `ritualsList` doit venir
   * de `useRituals()`, pour retrouver le rituel qu'il vienne du code ou de
   * la base.
   * Ne fait rien si le rituel est introuvable ; ne compte pas deux fois une
   * étoile déjà gagnée aujourd'hui.
   */
  const markValidated = useCallback(
    (ritualId: string, ritualsList: Ritual[]): boolean => {
      const ritual = ritualsList.find((item) => item.id === ritualId);
      if (!ritual) return false;
      if (statuses[ritualId] === "valide") return true;
      if (shared) {
        writeStatus(ritualId, "valide");
      } else {
        setLocalStatuses((current) => ({ ...current, [ritualId]: "valide" }));
        logStar(ritual.id, today, ritual.stars);
      }
      return true;
    },
    [statuses, shared, writeStatus, setLocalStatuses, logStar, today],
  );

  return { statuses, starsEarned, toggle, approve, markValidated, shared };
}
