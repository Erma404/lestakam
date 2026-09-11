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
  it("propose une tenue légère quand il fait chaud dès le matin", () => {
    // Khloé est frileuse : sa température ressentie est décalée de -3°.
    const outfit = suggestOutfit(khloe, day({ maxTemp: 32, minTemp: 29 }));
    expect(outfit.headline).toContain("Chaud");
    expect(outfit.layers.map((l) => l.label)).toContain("Short ou robe légère");
  });

  it("propose un manteau quand il fait froid le matin", () => {
    expect(labels(khloe, day({ maxTemp: 8, minTemp: 0 }))).toContain(
      "Manteau chaud sur un pull",
    );
  });

  it("s'habille pour la fraîcheur du matin même si l'après-midi est doux", () => {
    // Exactement le cas signalé : 13° le matin, une après-midi bien plus douce.
    // Un t-shirt ne suffit pas, même si la journée se réchauffe.
    const outfit = suggestOutfit(khloe, day({ minTemp: 13, maxTemp: 24 }));
    const labelsList = outfit.layers.map((l) => l.label);
    expect(labelsList).toContain("Sweat et veste");
    expect(labelsList).toContain("Pantalon chaud");
    expect(labelsList).not.toContain("T-shirt");
  });

  it("ajoute un imperméable quand la pluie est probable", () => {
    const outfit = suggestOutfit(khloe, day({ rainChance: 70 }));
    expect(outfit.layers.map((l) => l.label)).toContain("Imperméable ou parapluie");
    expect(outfit.headline).toContain("pluie");
  });

  it("ajoute une couche amovible quand l'écart avec l'après-midi est marqué", () => {
    expect(labels(khloe, day({ minTemp: 9, maxTemp: 20 }))).toContain(
      "Couche facile à enlever une fois qu'il fera plus chaud",
    );
  });

  it("couvre davantage une personne frileuse qu'une personne qui a chaud", () => {
    const weather = day({ maxTemp: 15, minTemp: 15 });
    const frileuse = suggestOutfit(ernestine, weather);
    const chaud = suggestOutfit(stephane, weather);

    expect(frileuse.layers.map((l) => l.label)).toContain("Sweat et veste");
    expect(chaud.layers.map((l) => l.label)).toContain("T-shirt avec un gilet fin");
    expect(frileuse.personalNote).toBe("Préfère avoir un peu plus chaud.");
    expect(chaud.personalNote).toBe("N'aime pas être trop couvert.");
  });

  it("propose toujours un haut, un bas et des chaussures", () => {
    for (const member of MEMBERS) {
      for (const temperature of [-2, 6, 12, 18, 24, 32]) {
        const slots = suggestOutfit(
          member,
          day({ minTemp: temperature, maxTemp: temperature + 4 }),
        ).layers.map((layer) => layer.slot);
        expect(slots).toContain("haut");
        expect(slots).toContain("bas");
        expect(slots).toContain("pieds");
      }
    }
  });
});
