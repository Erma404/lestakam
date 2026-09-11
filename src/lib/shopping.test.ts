import { describe, expect, it } from "vitest";
import { groupByAisle, remainingCount } from "./shopping";
import type { ShoppingItem } from "./types";

const lait: ShoppingItem = { id: "lait", label: "Lait", aisle: "Frais", checked: false };
const pommes: ShoppingItem = {
  id: "pommes",
  label: "Pommes",
  aisle: "Fruits et légumes",
  checked: false,
};
const cremeFraiche: ShoppingItem = {
  id: "creme",
  label: "Crème fraîche",
  aisle: "Frais",
  checked: true,
};
const sansRayon: ShoppingItem = { id: "sans-rayon", label: "Piles", checked: false };

describe("groupByAisle", () => {
  it("regroupe les articles par rayon", () => {
    const groups = groupByAisle([lait, pommes, cremeFraiche]);
    expect(groups.map((group) => group.aisle)).toEqual(["Frais", "Fruits et légumes"]);
  });

  it("place les articles sans rayon dans « Autres », toujours en dernier", () => {
    const groups = groupByAisle([sansRayon, lait]);
    expect(groups.map((group) => group.aisle)).toEqual(["Frais", "Autres"]);
  });

  it("descend les articles cochés en bas de leur rayon", () => {
    const groups = groupByAisle([cremeFraiche, lait]);
    const frais = groups.find((group) => group.aisle === "Frais");
    expect(frais?.items.map((item) => item.id)).toEqual(["lait", "creme"]);
  });
});

describe("remainingCount", () => {
  it("compte uniquement les articles non cochés", () => {
    expect(remainingCount([lait, pommes, cremeFraiche])).toBe(2);
  });
});
