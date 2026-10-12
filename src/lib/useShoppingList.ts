"use client";

import { useCallback } from "react";
import { useSharedList } from "./useSharedList";
import { demoShoppingList } from "./family";
import type { ShoppingItem } from "./types";

const STORAGE_KEY = "courses";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NewShoppingItem = Omit<ShoppingItem, "id" | "checked"> & { checked?: boolean };

/**
 * La liste de courses partagée.
 *
 * Même principe que le calendrier : partagée entre les appareils une fois
 * la base connectée, mémorisée sur l'appareil sinon.
 */
export function useShoppingList() {
  const { items, setItems: setStored, resetToDemo, shared } = useSharedList<ShoppingItem>(
    "course",
    STORAGE_KEY,
    demoShoppingList,
  );
  const currentList = useCallback(() => items, [items]);

  const addItem = useCallback(
    (item: NewShoppingItem): ShoppingItem => {
      const created: ShoppingItem = { checked: false, ...item, id: newId() };
      setStored([...currentList(), created]);
      return created;
    },
    [currentList, setStored],
  );

  /**
   * Ajoute plusieurs articles d'un coup (ex. les ingrédients sélectionnés
   * d'une recette). Un seul appel à `setStored` : appeler `addItem` en
   * boucle perdrait les premiers ajouts, chaque appel repartant de la même
   * liste lue avant que le précédent ne soit pris en compte.
   */
  const addItems = useCallback(
    (items: NewShoppingItem[]): ShoppingItem[] => {
      const created = items.map((item) => ({ checked: false, ...item, id: newId() }));
      setStored([...currentList(), ...created]);
      return created;
    },
    [currentList, setStored],
  );

  const updateItem = useCallback(
    (id: string, changes: Partial<NewShoppingItem>) => {
      setStored(currentList().map((item) => (item.id === id ? { ...item, ...changes } : item)));
    },
    [currentList, setStored],
  );

  const toggleItem = useCallback(
    (id: string) => {
      setStored(
        currentList().map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
      );
    },
    [currentList, setStored],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setStored(currentList().filter((item) => item.id !== id));
    },
    [currentList, setStored],
  );

  /** Retire d'un coup les articles déjà cochés, une fois les courses faites. */
  const clearChecked = useCallback(() => {
    setStored(currentList().filter((item) => !item.checked));
  }, [currentList, setStored]);

  return { items, addItem, addItems, updateItem, toggleItem, deleteItem, clearChecked, resetToDemo, shared };
}
