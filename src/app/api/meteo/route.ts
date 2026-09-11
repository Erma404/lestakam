import { NextResponse } from "next/server";
import { HOME_LOCATION, fetchForecast } from "@/lib/weather";

/**
 * La tablette de la cuisine interroge cette adresse au chargement puis
 * toutes les 15 minutes. Le service météo n'est donc appelé que depuis
 * le serveur, jamais depuis l'appareil lui-même.
 */
export const revalidate = 900;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));
  const name = searchParams.get("nom");

  const location =
    Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0
      ? { latitude, longitude, name: name ?? "Position actuelle" }
      : HOME_LOCATION;

  try {
    const forecast = await fetchForecast(location);
    return NextResponse.json(forecast, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=900" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Météo indisponible.";
    // 200 volontaire : le tableau de bord affiche un message calme
    // plutôt qu'une erreur, et reste entièrement utilisable.
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
