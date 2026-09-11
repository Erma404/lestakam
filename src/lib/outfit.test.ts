import { describe, expect, it } from "vitest";
import { suggestOutfit } from "./outfit";
import { MEMBERS } from "./family";
import type { Member, WeatherDay } from "./types";

function day(partial: Partial<WeatherDay>): WeatherDay {
  return {
    date: "2026-09-11",
    minTemp: 14,
    maxTemp: 20,
    rainChance: 10,
    weatherCode: 0,
    ...partial,
  };
}

const khloe = MEMBERS.find((member) => member.id === "khloe") as Member;
const ernestine = MEMBERS.find((member) => member.id === "ernestine") as Member;
const stephane = MEMBERS.find((member) => member.id === "stephane") as Member;

function labels(member: Member, weather: WeatherDay): string[] {
  return suggestOutfit(member, weather).layers.map((layer) => layer.label);
}

describe("suggestOutfit", () => {
  it("propose une tenue légère quand il fait chaud", () => {
    const outfit = suggestOutfit(khloe, day({ maxTemp: 30, minTemp: 20 }));
    expect(outfit.headline).toContain("chaude");
    expect(outfit.layers.map((l) => l.label)).toContain("Short ou robe légère");
  });

  it("propose un manteau quand il fait froid", () => {
    expect(labels(khloe, day({ maxTemp: 4, minTemp: 0 }))).toContain(
      "Manteau chaud sur un pull",
    );
  });

  it("ajoute un imperméable quand la pluie est probable", () => {
    const outfit = suggestOutfit(khloe, day({ rainChance: 70 }));
    expect(outfit.layers.map((l) => l.label)).toContain("Imperméable ou parapluie");
    expect(outfit.headline).toContain("pluie");
  });

  it("ajoute une couche amovible quand la matinée est fraîche", () => {
    expect(labels(khloe, day({ minTemp: 9, maxTemp: 20 }))).toContain(
      "Couche facile à enlever dans la journée",
    );
  });

  it("couvre davantage une personne frileuse qu'une personne qui a chaud", () => {
    const weather = day({ maxTemp: 15, minTemp: 15 });
    const frileuse = suggestOutfit(ernestine, weather);
    const chaud = suggestOutfit(stephane, weather);

    expect(frileuse.layers.map((l) => l.label)).toContain("Pull et veste");
    expect(chaud.layers.map((l) => l.label)).toContain("T-shirt avec un gilet fin");
    expect(frileuse.personalNote).toBe("Préfère avoir un peu plus chaud.");
    expect(chaud.personalNote).toBe("N'aime pas être trop couvert.");
  });

  it("propose toujours un haut, un bas et des chaussures", () => {
    for (const member of MEMBERS) {
      for (const temperature of [-2, 6, 12, 18, 24, 32]) {
        const slots = suggestOutfit(member, day({ maxTemp: temperature })).layers.map(
          (layer) => layer.slot,
        );
        expect(slots).toContain("haut");
        expect(slots).toContain("bas");
        expect(slots).toContain("pieds");
      }
    }
  });
});
