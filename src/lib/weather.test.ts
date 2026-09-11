import { afterEach, describe, expect, it, vi } from "vitest";
import { describeWeather, fetchForecast, isWet } from "./weather";

const SAMPLE_RESPONSE = {
  current: {
    temperature_2m: 18.6,
    apparent_temperature: 16.2,
    weather_code: 3,
    is_day: 1,
  },
  daily: {
    time: [
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ],
    temperature_2m_max: [22.4, 24.1, 19.8, 17.2, 15.6, 21.0, 23.3],
    temperature_2m_min: [13.2, 14.0, 12.5, 11.1, 9.8, 12.2, 14.4],
    precipitation_probability_max: [5, 20, 60, 80, null, 10, 0],
    weather_code: [0, 2, 61, 80, 3, 1, 0],
  },
};

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchForecast", () => {
  it("transforme la réponse Open-Meteo en prévision exploitable", async () => {
    mockFetchOnce(SAMPLE_RESPONSE);

    const forecast = await fetchForecast();

    expect(forecast.locationName).toBe("Le Blanc-Mesnil");
    expect(forecast.now.temperature).toBe(19);
    expect(forecast.now.feelsLike).toBe(16);
    expect(forecast.now.isDay).toBe(true);
    expect(forecast.days).toHaveLength(7);
    expect(forecast.days[0]).toMatchObject({
      date: "2026-09-11",
      minTemp: 13,
      maxTemp: 22,
      rainChance: 5,
    });
  });

  it("remplace une probabilité de pluie absente par 0", async () => {
    mockFetchOnce(SAMPLE_RESPONSE);
    const forecast = await fetchForecast();
    expect(forecast.days[4].rainChance).toBe(0);
  });

  it("signale une erreur quand le service ne répond pas", async () => {
    mockFetchOnce(null, false, 503);
    await expect(fetchForecast()).rejects.toThrow("Météo indisponible");
  });

  it("signale une erreur quand la réponse est incomplète", async () => {
    mockFetchOnce({ current: SAMPLE_RESPONSE.current });
    await expect(fetchForecast()).rejects.toThrow("incomplète");
  });
});

describe("describeWeather", () => {
  it("donne un libellé français pour les codes courants", () => {
    expect(describeWeather(0).label).toBe("Grand soleil");
    expect(describeWeather(61).label).toBe("Pluie");
    expect(describeWeather(95).label).toBe("Orage");
  });

  it("utilise la lune quand il fait nuit", () => {
    expect(describeWeather(0, false).emoji).toBe("🌙");
  });
});

describe("isWet", () => {
  it("reconnaît les codes de précipitations", () => {
    expect(isWet(0)).toBe(false);
    expect(isWet(3)).toBe(false);
    expect(isWet(61)).toBe(true);
    expect(isWet(80)).toBe(true);
    expect(isWet(95)).toBe(true);
  });
});
