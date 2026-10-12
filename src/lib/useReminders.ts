"use client";

import { useCallback } from "react";
import { useSharedList } from "./useSharedList";
import { demoReminders } from "./family";
import { todayKey } from "./dates";
import type { Reminder } from "./types";

const STORAGE_KEY = "rappels";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rappel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const demo = () => demoReminders(todayKey());

export type NewReminder = Omit<Reminder, "id" | "done"> & { done?: boolean };

/**
 * Les rappels de la semaine, affichés sur le tableau de bord.
 *
 * Même principe que le calendrier : partagés entre les appareils une fois
 * la base connectée, mémorisés sur l'appareil sinon.
 */
export function useReminders() {
  const { items: reminders, setItems: setStored, resetToDemo, shared } = useSharedList<Reminder>(
    "rappel",
    STORAGE_KEY,
    demo,
  );
  const currentList = useCallback(() => reminders, [reminders]);

  const addReminder = useCallback(
    (reminder: NewReminder): Reminder => {
      const created: Reminder = { done: false, ...reminder, id: newId() };
      setStored([...currentList(), created]);
      return created;
    },
    [currentList, setStored],
  );

  const updateReminder = useCallback(
    (id: string, changes: Partial<NewReminder>) => {
      setStored(
        currentList().map((reminder) => (reminder.id === id ? { ...reminder, ...changes } : reminder)),
      );
    },
    [currentList, setStored],
  );

  const toggleDone = useCallback(
    (id: string) => {
      setStored(
        currentList().map((reminder) =>
          reminder.id === id ? { ...reminder, done: !reminder.done } : reminder,
        ),
      );
    },
    [currentList, setStored],
  );

  const deleteReminder = useCallback(
    (id: string) => {
      setStored(currentList().filter((reminder) => reminder.id !== id));
    },
    [currentList, setStored],
  );

  return { reminders, addReminder, updateReminder, toggleDone, deleteReminder, resetToDemo, shared };
}
