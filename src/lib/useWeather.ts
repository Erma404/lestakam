"use client";

import { useEffect, useState } from "react";
import type { WeatherForecast } from "./types";

export interface WeatherState {
  forecast: WeatherForecast | null;
  error?: string;
  loading: boolean;
}

/** Rafraîchissement de la météo, par défaut toutes les 15 minutes. */
export function useWeather(intervalMs = 900_000): WeatherState {
  const [state, setState] = useState<WeatherState>({ forecast: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/meteo");
        const data = (await response.json()) as WeatherForecast | { error: string };
        if (cancelled) return;

        if ("error" in data) {
          setState({ forecast: null, error: data.error, loading: false });
        } else {
          setState({ forecast: data, loading: false });
        }
      } catch {
        if (!cancelled) {
          setState({
            forecast: null,
            error: "Impossible de joindre le service météo.",
            loading: false,
          });
        }
      }
    }

    load();
    const timer = setInterval(load, intervalMs);

    // La tablette peut passer en veille : on recharge dès son réveil.
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return state;
}
