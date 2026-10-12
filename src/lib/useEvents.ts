"use client";

import { useCallback, useMemo } from "react";
import { useSharedList } from "./useSharedList";
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

/** École de Khloé : du lundi au vendredi, hors vacances scolaires (octobre 2026). */
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

/**
 * L'événement « École » d'exemple ne revenait que le jour de sa création
 * (un vendredi) : il passe du lundi au vendredi, hors vacances, tant
 * qu'aucun jour n'a été choisi à la main.
 */
function migrate(events: CalendarEvent[]): CalendarEvent[] {
  return events.map((event) =>
    event.id === "demo-ecole" && event.repeatsWeekly && !event.repeatDays
      ? { ...event, repeatDays: SCHOOL_DAYS, skipSchoolHolidays: true }
      : event,
  );
}

const demo = () => demoEvents(todayKey());

/**
 * Les événements du calendrier familial, partagés entre les appareils une
 * fois la base connectée (mémorisés sur l'appareil sinon). Au premier usage,
 * quelques exemples sont affichés pour que le tableau de bord ne soit pas vide.
 */
export function useEvents() {
  const { items, setItems: setStored, resetToDemo, shared } = useSharedList<CalendarEvent>(
    "evenement",
    STORAGE_KEY,
    demo,
  );

  const events = useMemo(() => migrate(items), [items]);
  const currentList = useCallback(() => events, [events]);

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

  return { events, addEvent, updateEvent, deleteEvent, resetToDemo, shared };
}
