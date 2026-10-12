"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useStoredState } from "./localStore";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import { RITUALS as LOCAL_RITUALS } from "./family";
import { weekdayNumber } from "./dates";
import type { Ritual } from "./types";
import type { RitualRow } from "./supabase/database.types";

const LOCAL_KHLOE_RITUALS = LOCAL_RITUALS.filter((ritual) => ritual.memberId === "khloe");

/** Rituels modifiés depuis les réglages, en mode local (base non connectée). */
const LOCAL_STORAGE_KEY = "rituels:liste";

export type NewRitual = Omit<Ritual, "id" | "memberId">;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rituel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Colonnes de la table `rituals` correspondant aux champs modifiables. */
function toRow(ritual: NewRitual) {
  return {
    label: ritual.label,
    emoji: ritual.emoji,
    moment: ritual.moment,
    scheduled_time: ritual.time ?? null,
    stars: ritual.stars,
    needs_parent_approval: ritual.needsParentApproval,
    days: ritual.days?.length ? ritual.days : null,
  };
}

function rowToRitual(row: RitualRow): Ritual {
  return {
    id: row.id,
    memberId: "khloe",
    label: row.label,
    emoji: row.emoji,
    moment: row.moment,
    time: row.scheduled_time?.slice(0, 5) ?? undefined,
    stars: row.stars,
    needsParentApproval: row.needs_parent_approval,
    days: row.days ?? undefined,
  };
}

/** Un rituel sans jours précisés s'applique tous les jours. */
function appliesOn(ritual: Ritual, weekday: number): boolean {
  return !ritual.days || ritual.days.includes(weekday);
}

/**
 * Les rituels de Khloé prévus pour le jour donné (AAAA-MM-JJ) — certains,
 * comme le cartable, ne s'appliquent qu'en semaine ou qu'au week-end.
 *
 * Une fois la base connectée et le foyer créé, ils viennent de la table
 * `rituals` — partagés entre tous les appareils — plutôt que de la liste
 * figée du code, qui ne sert plus qu'en mode local.
 */
export function useRituals(today: string) {
  const { shared, khloe } = useHouseholdShared();
  const [rows, setRows] = useState<RitualRow[] | null>(null);
  // Plusieurs composants (Tak, la page Rituels…) peuvent utiliser ce hook
  // en même temps : un identifiant propre à chaque appel évite que leurs
  // canaux Supabase ne portent le même nom et ne se marchent dessus.
  const instanceId = useId();

  useEffect(() => {
    if (!shared || !khloe) return;
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function load() {
      if (!supabase || !khloe) return;
      const { data, error } = await supabase
        .from("rituals")
        .select("*")
        .eq("member_id", khloe.id)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (!cancelled && !error) setRows(data ?? []);
    }

    load();
    const channel = supabase
      .channel(`rituals-${khloe.household_id}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rituals",
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

  const [localStored, setLocalStored] = useStoredState<Ritual[] | null>(LOCAL_STORAGE_KEY, null);
  const localRituals = localStored ?? LOCAL_KHLOE_RITUALS;

  const allRituals = shared ? (rows ? rows.map(rowToRitual) : []) : localRituals;
  const weekday = weekdayNumber(today);
  const rituals = allRituals.filter((ritual) => appliesOn(ritual, weekday));

  const addRitual = useCallback(
    (ritual: NewRitual) => {
      if (shared && khloe) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const nextOrder = (rows ?? []).reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;
        supabase
          .from("rituals")
          .insert({ household_id: khloe.household_id, member_id: khloe.id, ...toRow(ritual), sort_order: nextOrder })
          .then(({ error }) => {
            if (error) console.error("Ajout du rituel impossible :", error);
          });
        return;
      }
      setLocalStored([...localRituals, { ...ritual, id: newId(), memberId: "khloe" }]);
    },
    [shared, khloe, rows, localRituals, setLocalStored],
  );

  const updateRitual = useCallback(
    (id: string, ritual: NewRitual) => {
      if (shared) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        supabase
          .from("rituals")
          .update(toRow(ritual))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Modification du rituel impossible :", error);
          });
        return;
      }
      setLocalStored(localRituals.map((item) => (item.id === id ? { ...item, ...ritual } : item)));
    },
    [shared, localRituals, setLocalStored],
  );

  /**
   * Retire un rituel de la journée de Khloé. En base, il est désactivé plutôt
   * qu'effacé : les étoiles déjà gagnées avec lui restent comptées.
   */
  const removeRitual = useCallback(
    (id: string) => {
      if (shared) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        supabase
          .from("rituals")
          .update({ active: false })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Retrait du rituel impossible :", error);
          });
        return;
      }
      setLocalStored(localRituals.filter((item) => item.id !== id));
    },
    [shared, localRituals, setLocalStored],
  );

  return {
    rituals,
    /** Tous les rituels, quel que soit le jour — pour les réglages. */
    allRituals,
    addRitual,
    updateRitual,
    removeRitual,
    shared: shared && rows !== null,
  };
}
