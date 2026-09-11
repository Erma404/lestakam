import type { ShoppingItem } from "./types";

const NO_AISLE = "Autres";

export interface AisleGroup {
  aisle: string;
  items: ShoppingItem[];
}

/**
 * Articles regroupés par rayon, rayons triés alphabétiquement et « Autres »
 * toujours en dernier. Dans chaque rayon, les articles cochés descendent
 * en bas de liste.
 */
export function groupByAisle(items: ShoppingItem[]): AisleGroup[] {
  const groups = new Map<string, ShoppingItem[]>();

  for (const item of items) {
    const aisle = item.aisle?.trim() || NO_AISLE;
    const list = groups.get(aisle) ?? [];
    list.push(item);
    groups.set(aisle, list);
  }

  const aisles = Array.from(groups.keys()).sort((a, b) => {
    if (a === NO_AISLE) return 1;
    if (b === NO_AISLE) return -1;
    return a.localeCompare(b, "fr");
  });

  return aisles.map((aisle) => ({
    aisle,
    items: [...(groups.get(aisle) ?? [])].sort(
      (a, b) => Number(a.checked) - Number(b.checked),
    ),
  }));
}

/** Nombre d'articles restant à acheter. */
export function remainingCount(items: ShoppingItem[]): number {
  return items.filter((item) => !item.checked).length;
}
