/**
 * Météo via Open-Meteo : service public, gratuit et sans clé API.
 * Documentation officielle : https://open-meteo.com/en/docs
 */

import type { WeatherDay, WeatherForecast } from "./types";
import { HOME_TIMEZONE } from "./dates";

export interface Coordinates {
  latitude: number;
  longitude: number;
  name: string;
}

/** Localisation du foyer, utilisée par défaut sur la tablette de la cuisine. */
export const HOME_LOCATION: Coordinates = {
  latitude: 48.9362,
  longitude: 2.4636,
  name: "Le Blanc-Mesnil",
};

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    weather_code: number[];
  };
}

/** Récupère la météo actuelle et les 7 prochains jours. */
export async function fetchForecast(
  location: Coordinates = HOME_LOCATION,
): Promise<WeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,is_day",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  url.searchParams.set("timezone", HOME_TIMEZONE);
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    throw new Error(`Météo indisponible (code ${response.status})`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  if (!data.current || !data.daily) {
    throw new Error("Réponse météo incomplète");
  }

  const days: WeatherDay[] = data.daily.time.map((date, index) => ({
    date,
    minTemp: Math.round(data.daily!.temperature_2m_min[index]),
    maxTemp: Math.round(data.daily!.temperature_2m_max[index]),
    rainChance: data.daily!.precipitation_probability_max[index] ?? 0,
    weatherCode: data.daily!.weather_code[index],
  }));

  return {
    locationName: location.name,
    now: {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    days,
    fetchedAt: new Date().toISOString(),
  };
}

/** Recherche une ville par son nom, pour changer de localisation depuis les réglages. */
export async function searchLocation(query: string): Promise<Coordinates[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "fr");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: { latitude: number; longitude: number; name: string; admin2?: string }[];
  };

  return (data.results ?? []).map((result) => ({
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
  }));
}

interface WeatherLook {
  emoji: string;
  label: string;
}

/** Traduit un code météo WMO en emoji et libellé simple. */
export function describeWeather(code: number, isDay = true): WeatherLook {
  if (code === 0) return { emoji: isDay ? "☀️" : "🌙", label: "Grand soleil" };
  if (code === 1) return { emoji: isDay ? "🌤️" : "🌙", label: "Plutôt dégagé" };
  if (code === 2) return { emoji: "⛅", label: "Quelques nuages" };
  if (code === 3) return { emoji: "☁️", label: "Ciel couvert" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "Brouillard" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Bruine" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Pluie" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", label: "Neige" };
  if (code >= 80 && code <= 82) return { emoji: "🌧️", label: "Averses" };
  if (code >= 85 && code <= 86) return { emoji: "🌨️", label: "Averses de neige" };
  if (code >= 95) return { emoji: "⛈️", label: "Orage" };
  return { emoji: "🌡️", label: "Variable" };
}

/** Vrai si le code météo correspond à des précipitations. */
export function isWet(code: number): boolean {
  return (code >= 51 && code <= 86) || code >= 95;
}
