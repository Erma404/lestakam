"use client";

/**
 * Stockage temporaire dans le navigateur, le temps que la base de données
 * Supabase soit connectée. Les données restent sur l'appareil : ce module
 * sera remplacé par les appels Supabase, sans changer son interface.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";

const PREFIX = "lestakam:";

const listeners = new Map<string, Set<() => void>>();

/** Dernière valeur analysée, pour renvoyer la même référence tant que rien ne change. */
const parsedCache = new Map<string, { raw: string | null; value: unknown }>();

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);

  // Garde les onglets et fenêtres du même appareil synchronisés.
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREFIX + key) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set?.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readSnapshot<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIX + key);
  } catch {
    return fallback;
  }

  const cached = parsedCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    value = fallback;
  }
  parsedCache.set(key, { raw, value });
  return value;
}

/**
 * État persistant sur l'appareil. Au premier rendu, la valeur initiale est
 * utilisée : cela évite tout écart entre le rendu serveur et le navigateur.
 */
export function useStoredState<T>(key: string, initial: T) {
  // Référence figée : React exige une valeur stable entre les rendus.
  const initialRef = useRef(initial);

  const value = useSyncExternalStore(
    useCallback((listener: () => void) => subscribe(key, listener), [key]),
    () => readSnapshot(key, initialRef.current),
    () => initialRef.current,
  );

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = readSnapshot(key, initialRef.current);
      const resolved = typeof next === "function" ? (next as (c: T) => T)(current) : next;
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(resolved));
      } catch {
        // Stockage plein ou navigation privée : l'application reste utilisable.
      }
      parsedCache.delete(key);
      notify(key);
    },
    [key],
  );

  return [value, update] as const;
}
