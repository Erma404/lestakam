"use client";

import { useCallback, useMemo } from "react";
import { useStoredState } from "./localStore";
import { demoEvents } from "./family";
import { todayKey } from "./dates";
import type { CalendarEvent } from "./types";

const STORAGE_KEY = "evenements";

/** Identifiant unique, avec une solution de repli sur les navigateurs anciens. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NewEvent = Omit<CalendarEvent, "id">;

/**
 * Les événements du calendrier familial.
 *
 * Tant que la base de données partagée n'est pas connectée, ils sont mémorisés
 * sur l'appareil. Au premier usage, quelques exemples sont affichés pour que le
 * tableau de bord ne soit pas vide ; ils disparaissent dès la première
 * modification.
 */
export function useEvents() {
  const [stored, setStored] = useStoredState<CalendarEvent[] | null>(STORAGE_KEY, null);

  const events = useMemo(() => stored ?? demoEvents(todayKey()), [stored]);

  /** Les exemples deviennent de vrais événements dès la première modification. */
  const currentList = useCallback(() => stored ?? demoEvents(todayKey()), [stored]);

  const addEvent = useCallback(
    (event: NewEvent): CalendarEvent => {
      const created: CalendarEvent = { ...event, id: newId() };
      setStored([...currentList(), created]);
      return created;
    },
    [currentList, setStored],
  );

  const updateEvent = useCallback(
    (id: string, changes: Partial<NewEvent>) => {
      setStored(
        currentList().map((event) => (event.id === id ? { ...event, ...changes } : event)),
      );
    },
    [currentList, setStored],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setStored(currentList().filter((event) => event.id !== id));
    },
    [currentList, setStored],
  );

  /** Remet les exemples de départ, depuis les réglages. */
  const resetToDemo = useCallback(() => setStored(null), [setStored]);

  return { events, addEvent, updateEvent, deleteEvent, resetToDemo };
}
