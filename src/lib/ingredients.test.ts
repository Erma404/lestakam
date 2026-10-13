import { describe, expect, it } from "vitest";
import { toShoppingCandidate } from "./ingredients";

function pick(line: string) {
  const { label, quantity, pantry, optional } = toShoppingCandidate(line);
  return { label, quantity, pantry, optional };
}

describe("toShoppingCandidate", () => {
  it("garde le produit et la quantité à acheter", () => {
    expect(pick("1 oignon (environ 120 g), émincé")).toEqual({
      label: "Oignon",
      quantity: "1",
      pantry: false,
      optional: false,
    });
    expect(pick("1 boîte de haricots rouges (env. 240 g égouttés)")).toMatchObject({
      label: "Haricots rouges",
      quantity: "1 boîte",
    });
    expect(pick("1/2 boîte de maïs (env. 80–100 g, égoutté)")).toMatchObject({
      label: "Maïs",
      quantity: "1/2 boîte",
    });
    expect(pick("200 g de riz")).toMatchObject({ label: "Riz", quantity: "200 g" });
  });

  it("repère ce qui est déjà au placard", () => {
    expect(pick("Sel et poivre").pantry).toBe(true);
    expect(pick("1 c. à s. d’huile d’olive")).toMatchObject({ label: "Huile d’olive", pantry: true });
    expect(pick("1 c. à c. de paprika (doux)")).toMatchObject({
      label: "Paprika",
      quantity: undefined,
      pantry: true,
    });
    expect(pick("1 c. à c. de cumin moulu").pantry).toBe(true);
    expect(pick("Eau si besoin")).toMatchObject({ label: "Eau", pantry: true });
  });

  it("signale le facultatif", () => {
    expect(pick("1/2 poivron (facultatif, en dés)")).toMatchObject({
      label: "Poivron",
      quantity: "1/2",
      optional: true,
    });
    expect(pick("Option : 1 petite pincée de piment doux (facultatif, pour la version épicée)")).toMatchObject({
      optional: true,
      pantry: true,
    });
  });
});

describe("toShoppingCandidate, mots proches d'un nombre", () => {
  it("ne prend pas « Uniquement » pour une quantité", () => {
    expect(toShoppingCandidate("Uniquement du persil frais").label).toBe("Uniquement du persil frais");
  });
});
