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

/**
 * Température à habiller, décalée selon la préférence du membre.
 *
 * On s'habille pour le moment le plus frais de la sortie — le matin, le
 * plus souvent — jamais pour la chaleur de l'après-midi : mieux vaut une
 * couche à enlever qu'un enfant qui a froid en sortant.
 */
function perceivedTemperature(day: WeatherDay, member: Member): number {
  const base = day.minTemp;
  if (member.warmthPreference === "frileux") return base - 3;
  if (member.warmthPreference === "chaud") return base + 2;
  return base;
}

function personalNote(member: Member): string | undefined {
  if (member.warmthPreference === "frileux") return "Préfère avoir un peu plus chaud.";
  if (member.warmthPreference === "chaud") return "N'aime pas être trop couvert.";
  return undefined;
}

export function suggestOutfit(member: Member, day: WeatherDay): OutfitSuggestion {
  const temperature = perceivedTemperature(day, member);
  const wet = isWet(day.weatherCode) || day.rainChance >= 40;
  // Écart marqué entre le matin et l'après-midi : la tenue du matin
  // pourrait devenir trop chaude une fois le soleil monté.
  const bigSwing = day.maxTemp - day.minTemp >= 7;
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
    layers.push({ slot: "haut", emoji: "🧥", label: "Sweat et veste" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon chaud" });
    layers.push({ slot: "pieds", emoji: "👟", label: "Baskets fermées" });
  } else {
    layers.push({ slot: "haut", emoji: "🧥", label: "Manteau chaud sur un pull" });
    layers.push({ slot: "bas", emoji: "👖", label: "Pantalon doublé" });
    layers.push({ slot: "pieds", emoji: "🥾", label: "Chaussures chaudes" });
    layers.push({ slot: "accessoire", emoji: "🧣", label: "Bonnet, écharpe et gants" });
  }

  if (wet) {
    layers.push({ slot: "accessoire", emoji: "☔", label: "Imperméable ou parapluie" });
  }
  if (bigSwing && temperature < 26) {
    layers.push({
      slot: "accessoire",
      emoji: "🧥",
      label: "Couche facile à enlever une fois qu'il fera plus chaud",
    });
  }

  let headline: string;
  if (temperature >= 26) headline = "Chaud dès le matin, on reste léger";
  else if (temperature >= 20) headline = "Doux dès le matin";
  else if (temperature >= 14) headline = "Frais le matin, une petite couche en plus";
  else if (temperature >= 8) headline = "Fraîcheur le matin, on couvre bien";
  else headline = "Froid le matin, on sort bien couvert";

  if (wet) headline += " · pensez à la pluie";

  return {
    memberId: member.id,
    headline,
    layers,
    personalNote: personalNote(member),
  };
}
