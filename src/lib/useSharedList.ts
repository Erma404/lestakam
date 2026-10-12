"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useStoredState } from "./localStore";
import { useHouseholdShared } from "./supabase/household";
import { getSupabaseClient } from "./supabase/client";
import type { Json, SharedItemKind } from "./supabase/database.types";

/** Repère, par appareil, que sa liste locale a déjà été envoyée dans la base. */
const IMPORTED_PREFIX = "lestakam:partage-importe:";

function wasImported(kind: SharedItemKind): boolean {
  try {
    return window.localStorage.getItem(IMPORTED_PREFIX + kind) === "1";
  } catch {
    return true;
  }
}

function markImported(kind: SharedItemKind): void {
  try {
    window.localStorage.setItem(IMPORTED_PREFIX + kind, "1");
  } catch {
    // Navigation privée : l'import sera simplement retenté, sans doublon.
  }
}

/**
 * Une liste de la famille (calendrier, rappels, courses) partagée entre
 * tous les appareils une fois la base connectée, ou mémorisée sur
 * l'appareil sinon.
 *
 * Chaque élément est rangé tel quel, en JSON, dans la table `shared_items` :
 * l'interface ne change pas pour les écrans, qui continuent de fournir la
 * nouvelle liste complète ; seules les différences partent vers la base.
 *
 * La première fois qu'un appareil se connecte, ce qu'il avait enregistré
 * localement est versé dans la liste commune, sans écraser ce qu'un autre
 * appareil y a déjà mis.
 */
export function useSharedList<T extends { id: string }>(
  kind: SharedItemKind,
  storageKey: string,
  /** Exemples de départ ; fonction stable (définie hors du composant). */
  demo: () => T[],
) {
  const { shared, khloe } = useHouseholdShared();
  const householdId = shared ? (khloe?.household_id ?? null) : null;
  const [stored, setStored] = useStoredState<T[] | null>(storageKey, null);
  const [rows, setRows] = useState<T[] | null>(null);
  const instanceId = useId();

  useEffect(() => {
    if (!householdId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;

    async function load() {
      if (!supabase || !householdId) return;
      const { data, error } = await supabase
        .from("shared_items")
        .select("data")
        .eq("household_id", householdId)
        .eq("kind", kind)
        .order("created_at", { ascending: true });
      if (!cancelled && !error) setRows((data ?? []).map((row) => row.data as unknown as T));
      return error ? null : (data ?? []);
    }

    async function importLocalThenLoad() {
      if (!supabase || !householdId) return;
      const remote = await load();
      if (!remote || cancelled || wasImported(kind)) return;
      // Liste locale de cet appareil ; à défaut, les exemples de départ,
      // mais seulement si la liste commune est encore vide.
      const local = readLocal<T>(storageKey) ?? (remote.length === 0 ? demo() : []);
      if (local.length > 0) {
        const { error } = await supabase.from("shared_items").upsert(
          local.map((item) => ({ household_id: householdId, kind, id: item.id, data: item as unknown as Json })),
          { onConflict: "household_id,kind,id", ignoreDuplicates: true },
        );
        if (error) {
          console.error("Envoi de la liste locale impossible :", error);
          return;
        }
      }
      markImported(kind);
      await load();
    }

    void importLocalThenLoad();
    const channel = supabase
      .channel(`shared-${kind}-${householdId}-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_items" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [householdId, kind, storageKey, instanceId, demo]);

  const isShared = householdId !== null && rows !== null;
  const items = useMemo<T[]>(
    () => (isShared && rows ? rows : (stored ?? demo())),
    [isShared, rows, stored, demo],
  );

  /** Remplace la liste ; en mode partagé, n'envoie que ce qui a changé. */
  const setItems = useCallback(
    (next: T[]) => {
      if (!isShared || !householdId) {
        setStored(next);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const before = new Map(items.map((item) => [item.id, JSON.stringify(item)]));
      const nextIds = new Set(next.map((item) => item.id));
      const changed = next.filter((item) => before.get(item.id) !== JSON.stringify(item));
      const removed = items.filter((item) => !nextIds.has(item.id)).map((item) => item.id);

      // Affichage immédiat ; la base suit, et le canal temps réel recharge.
      setRows(next);
      if (changed.length > 0) {
        supabase
          .from("shared_items")
          .upsert(
            changed.map((item) => ({ household_id: householdId, kind, id: item.id, data: item as unknown as Json })),
            { onConflict: "household_id,kind,id" },
          )
          .then(({ error }) => {
            if (error) console.error("Enregistrement impossible :", error);
          });
      }
      if (removed.length > 0) {
        supabase
          .from("shared_items")
          .delete()
          .eq("household_id", householdId)
          .eq("kind", kind)
          .in("id", removed)
          .then(({ error }) => {
            if (error) console.error("Suppression impossible :", error);
          });
      }
    },
    [isShared, householdId, items, kind, setStored],
  );

  /** Remet les exemples de départ, en local seulement (jamais pour tout le foyer). */
  const resetToDemo = useCallback(() => setStored(null), [setStored]);

  return { items, setItems, resetToDemo, shared: isShared };
}

function readLocal<T>(storageKey: string): T[] | null {
  try {
    const raw = window.localStorage.getItem(`lestakam:${storageKey}`);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}
