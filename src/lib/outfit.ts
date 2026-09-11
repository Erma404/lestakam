/**
 * Suggestion de tenue pour chaque membre, à partir de la météo du jour
 * et de son ressenti thermique.
 */

import type { Member, WeatherDay } from "./types";
import { isWet } from "./weather";

export interface OutfitLayer {
  /** Ordre d'affichage : haut, bas, pieds, accessoire. */
  slot: "haut" | "bas" | "pieds" | "accessoire";
  emoji: string;
  label: string;
}

export interface OutfitSuggestion {
  memberId: string;
  headline: string;
  layers: OutfitLayer[];
  /** Note personnalisée, ex. « préfère avoir un peu plus chaud ». */
  personalNote?: string;
}

/** Décale la température ressentie selon la préférence du membre. */
function perceivedTemperature(maxTemp: number, member: Member): number {
  if (member.warmthPreference === "frileux") return maxTemp - 3;
  if (member.warmthPreference === "chaud") return maxTemp + 2;
  return maxTemp;
}

function personalNote(member: Member): string | undefined {
  if (member.warmthPreference === "frileux") return "Préfère avoir un peu plus chaud.";
  if (member.warmthPreference === "chaud") return "N'aime pas être trop couvert.";
  return undefined;
}

export function suggestOutfit(member: Member, day: WeatherDay): OutfitSuggestion {
  const temperature = perceivedTemperature(day.maxTemp, member);
  const wet = isWet(day.weatherCode) || day.rainChance >= 40;
  const chillyMorning = day.minTemp <= 12 && day.maxTemp - day.minTemp >= 7;
  const layers: OutfitLayer[] = [];

  if (temperature >= 26) {
    layers.push({ slot: "haut", emoji: "👕", label: "T-shirt léger" });
    layers.push({ slot: "bas", emoji: "🩳", label: "Short ou robe légère" });
    layers.push({ slot: "pieds", emoji: "🩴", label: "Sandales" });
    layers.push({ slot: "accessoire", emoji: "🧢", label: "Casquette et gourde d'eau" });
  } else if (temperature >= 20) {
    layers.push({ slot: "haut", emoji: "👕", label: "T-shirt" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon léger" });
    layers.push({ slot: "pieds", emoji: "👟", label: "Baskets" });
  } else if (temperature >= 14) {
    layers.push({ slot: "haut", emoji: "👕", label: "T-shirt avec un gilet fin" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon" });
    layers.push({ slot: "pieds", emoji: "👟", label: "Baskets" });
  } else if (temperature >= 8) {
    layers.push({ slot: "haut", emoji: "🧥", label: "Pull et veste" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon chaud" });
    layers.push({ slot: "pieds", emoji: "👟", label: "Chaussures fermées" });
  } else {
    layers.push({ slot: "haut", emoji: "🧥", label: "Manteau chaud sur un pull" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon doublé" });
    layers.push({ slot: "pieds", emoji: "🥾", label: "Chaussures chaudes" });
    layers.push({ slot: "accessoire", emoji: "🧣", label: "Bonnet, écharpe et gants" });
  }

  if (wet) {
    layers.push({ slot: "accessoire", emoji: "☔", label: "Imperméable ou parapluie" });
  }
  if (chillyMorning && temperature < 26) {
    layers.push({ slot: "accessoire", emoji: "🧥", label: "Couche facile à enlever dans la journée" });
  }

  let headline: string;
  if (temperature >= 26) headline = "Journée chaude, on reste léger";
  else if (temperature >= 20) headline = "Journée douce et agréable";
  else if (temperature >= 14) headline = "Doux, mais une petite couche en plus";
  else if (temperature >= 8) headline = "Journée fraîche, on se couvre";
  else headline = "Il fait froid, on sort bien couvert";

  if (wet) headline += " · pensez à la pluie";

  return {
    memberId: member.id,
    headline,
    layers,
    personalNote: personalNote(member),
  };
}
