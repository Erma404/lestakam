"use client";

import { useCallback, useMemo } from "react";
import { useStoredState } from "./localStore";
import { totalStars, type StarEntry } from "./rewards";

const STORAGE_KEY = "etoiles";
const EMPTY: StarEntry[] = [];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `star-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Le journal des étoiles gagnées par Khloé, toutes dates confondues.
 *
 * Une ligne par rituel validé et par jour : c'est ce journal qui permet de
 * calculer les compteurs de la semaine et du mois, et de savoir quand un
 * objectif de récompense est débloqué.
 */
export function useStars() {
  const [entries, setEntries] = useStoredState<StarEntry[]>(STORAGE_KEY, EMPTY);

  const logStar = useCallback(
    (ritualId: string, date: string, stars: number) => {
      setEntries((current) => {
        if (current.some((entry) => entry.ritualId === ritualId && entry.date === date)) {
          return current;
        }
        return [...current, { id: newId(), ritualId, date, stars }];
      });
    },
    [setEntries],
  );

  const unlogStar = useCallback(
    (ritualId: string, date: string) => {
      setEntries((current) =>
        current.filter((entry) => !(entry.ritualId === ritualId && entry.date === date)),
      );
    },
    [setEntries],
  );

  const resetToDemo = useCallback(() => setEntries(EMPTY), [setEntries]);

  const total = useMemo(() => totalStars(entries), [entries]);

  return { entries, total, logStar, unlogStar, resetToDemo };
}
