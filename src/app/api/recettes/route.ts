import { buildRecipe, CRAVINGS, suggestDishes, type Craving } from "@/lib/recipes";

export const runtime = "nodejs";

/**
 * Page Recettes :
 * - `{ mode: "idees", today, craving, ingredients?, exclude?, weather? }` → six idées de plats ;
 * - `{ mode: "recette", plat }` → la recette complète d'un plat.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  try {
    if (body.mode === "recette") {
      const plat = typeof body.plat === "string" ? body.plat.trim().slice(0, 120) : "";
      if (!plat) {
        return Response.json({ ok: false, error: "Quel plat cherches-tu ?" }, { status: 400 });
      }
      return Response.json({ ok: true, recipe: await buildRecipe(plat) });
    }

    if (body.mode === "idees") {
      const today = typeof body.today === "string" ? body.today : new Date().toISOString().slice(0, 10);
      const craving: Craving =
        typeof body.craving === "string" && body.craving in CRAVINGS ? (body.craving as Craving) : "surprise";
      const exclude = Array.isArray(body.exclude)
        ? body.exclude.filter((item): item is string => typeof item === "string").slice(0, 30)
        : [];
      const ideas = await suggestDishes({
        today,
        craving,
        ingredients: typeof body.ingredients === "string" ? body.ingredients.slice(0, 200) : undefined,
        weather: typeof body.weather === "string" ? body.weather.slice(0, 120) : undefined,
        exclude,
      });
      return Response.json({ ok: true, ideas });
    }

    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  } catch (error) {
    console.error("Erreur Recettes :", error);
    return Response.json(
      { ok: false, error: "Les idées sont indisponibles pour le moment. Réessaie dans un instant." },
      { status: 502 },
    );
  }
}
