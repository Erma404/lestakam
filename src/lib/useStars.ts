"use client";

import { useCallback, useEffect, useState } from "react";
import { useStoredState } from "./localStore";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import { totalStars, type StarEntry } from "./rewards";

const STORAGE_KEY = "etoiles";
const EMPTY: StarEntry[] = [];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `star-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ValidatedRitualRow {
  ritual_id: string;
  status_date: string;
  rituals: { stars: number } | { stars: number }[] | null;
}

/** Une étoile par ligne, y compris quand Supabase renvoie la jointure sous forme de tableau. */
function rowToEntry(row: ValidatedRitualRow): StarEntry {
  const ritual = Array.isArray(row.rituals) ? row.rituals[0] : row.rituals;
  return {
    id: `${row.ritual_id}-${row.status_date}`,
    ritualId: row.ritual_id,
    date: row.status_date,
    stars: ritual?.stars ?? 0,
  };
}

/**
 * Le journal des étoiles gagnées par Khloé, toutes dates confondues.
 *
 * Une fois la base connectée, ce journal est déduit des rituels validés
 * (table `ritual_status`) : le même pour Stéphane, Ernestine et la
 * tablette de la cuisine. Avant cela, il reste propre à l'appareil.
 */
export function useStars() {
  const { shared, khloe } = useHouseholdShared();
  const [localEntries, setLocalEntries] = useStoredState<StarEntry[]>(STORAGE_KEY, EMPTY);
  const [sharedEntries, setSharedEntries] = useState<StarEntry[] | null>(null);

  useEffect(() => {
    if (!shared || !khloe) return;
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function load() {
      if (!supabase || !khloe) return;
      const { data, error } = await supabase
        .from("ritual_status")
        .select("ritual_id, status_date, rituals(stars)")
        .eq("household_id", khloe.household_id)
        .eq("state", "valide");
      if (!cancelled && !error) {
        setSharedEntries(((data ?? []) as ValidatedRitualRow[]).map(rowToEntry));
      }
    }

    load();
    const channel = supabase
      .channel(`ritual-status-stars-${khloe.household_id}`)
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
  }, [shared, khloe]);

  const entries = shared ? (sharedEntries ?? EMPTY) : localEntries;

  // En mode partagé, une étoile n'est jamais posée directement : elle
  // découle d'un rituel validé (voir useRitualStatus), qui écrit dans
  // `ritual_status` et déclenche le rechargement ci-dessus.
  const logStar = useCallback(
    (ritualId: string, date: string, stars: number) => {
      if (shared) return;
      setLocalEntries((current) => {
        if (current.some((entry) => entry.ritualId === ritualId && entry.date === date)) {
          return current;
        }
        return [...current, { id: newId(), ritualId, date, stars }];
      });
    },
    [shared, setLocalEntries],
  );

  const unlogStar = useCallback(
    (ritualId: string, date: string) => {
      if (shared) return;
      setLocalEntries((current) =>
        current.filter((entry) => !(entry.ritualId === ritualId && entry.date === date)),
      );
    },
    [shared, setLocalEntries],
  );

  const resetToDemo = useCallback(() => {
    if (shared) return;
    setLocalEntries(EMPTY);
  }, [shared, setLocalEntries]);

  const total = totalStars(entries);

  return { entries, total, logStar, unlogStar, resetToDemo, shared };
}
