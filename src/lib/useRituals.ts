"use client";

import { useEffect, useId, useState } from "react";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import { RITUALS as LOCAL_RITUALS } from "./family";
import { weekdayNumber } from "./dates";
import type { Ritual } from "./types";
import type { RitualRow } from "./supabase/database.types";

const LOCAL_KHLOE_RITUALS = LOCAL_RITUALS.filter((ritual) => ritual.memberId === "khloe");

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

  const allRituals = shared ? (rows ? rows.map(rowToRitual) : []) : LOCAL_KHLOE_RITUALS;
  const weekday = weekdayNumber(today);
  const rituals = allRituals.filter((ritual) => appliesOn(ritual, weekday));

  return { rituals, shared: shared && rows !== null };
}
