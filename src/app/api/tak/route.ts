import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { buildTakSystemPrompt, describeTakAction, takActionSchema, youtubeSearchUrl } from "@/lib/tak";

export const runtime = "nodejs";

const MODEL = "anthropic/claude-haiku-4.5";

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
    const { object } = await generateObject({
      model: MODEL,
      schema: takActionSchema,
      system: buildTakSystemPrompt(today, weekday),
      prompt: text.trim(),
    });

    if (object.action === "chercher_recette") {
      const { text: recette } = await generateText({
        model: MODEL,
        system:
          "Tu donnes une recette simple et familiale, en français, pour une famille avec un " +
          "jeune enfant. Format court : une liste d'ingrédients puis les étapes numérotées. " +
          "Pas d'introduction ni de conclusion, va droit à la recette.",
        prompt: `Recette : ${object.plat}`,
      });

      return Response.json({
        ok: true,
        action: object,
        summary: describeTakAction(object),
        recette,
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
