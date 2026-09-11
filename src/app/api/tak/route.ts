import { generateObject, NoObjectGeneratedError } from "ai";
import {
  buildTakSystemPrompt,
  describeTakAction,
  findDishImage,
  recipeSchema,
  takModelSchema,
  toTakAction,
  youtubeSearchUrl,
} from "@/lib/tak";

export const runtime = "nodejs";

// Modèle accessible au palier gratuit d'AI Gateway (les modèles Anthropic ne le
// sont pas). Rapide et largement suffisant pour reconnaître une commande courte.
const MODEL = "openai/gpt-5.4-nano";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  const today = (body as { today?: unknown })?.today;
  const weekday = (body as { weekday?: unknown })?.weekday;

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ ok: false, error: "Je n'ai rien entendu." }, { status: 400 });
  }
  if (typeof today !== "string" || typeof weekday !== "string") {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  try {
    const { object: raw } = await generateObject({
      model: MODEL,
      schema: takModelSchema,
      system: buildTakSystemPrompt(today, weekday),
      prompt: text.trim(),
    });
    const object = toTakAction(raw);

    if (object.action === "chercher_recette") {
      const [{ object: recipe }, imageUrl] = await Promise.all([
        generateObject({
          model: MODEL,
          schema: recipeSchema,
          system:
            "Tu donnes une recette simple et familiale, en français, pour une famille avec un " +
            "jeune enfant. Des ingrédients courants, une préparation qui reste accessible.",
          prompt: `Recette : ${object.plat}`,
        }),
        findDishImage(object.plat),
      ]);

      return Response.json({
        ok: true,
        action: object,
        summary: describeTakAction(object),
        ingredients: recipe.ingredients,
        etapes: recipe.etapes,
        imageUrl,
        youtubeUrl: youtubeSearchUrl(object.plat),
      });
    }

    return Response.json({ ok: true, action: object, summary: describeTakAction(object) });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return Response.json(
        { ok: false, error: "Je n'ai pas compris cette demande. Peux-tu la reformuler ?" },
        { status: 200 },
      );
    }

    console.error("Erreur Tak :", error);
    return Response.json(
      {
        ok: false,
        error:
          "Tak est indisponible pour le moment. Vérifie que l'AI Gateway est activé sur le projet Vercel.",
      },
      { status: 502 },
    );
  }
}
