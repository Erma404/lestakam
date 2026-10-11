import { generateObject, NoObjectGeneratedError } from "ai";
import {
  buildTakSystemPrompt,
  describeTakAction,
  takModelSchema,
  toTakAction,
  type TakRitual,
  type TakTurn,
} from "@/lib/tak";
import { buildRecipe, RECIPE_MODEL } from "@/lib/recipes";

export const runtime = "nodejs";

const MODEL = RECIPE_MODEL;

/** Au-delà, le fil est tronqué : Tak n'a besoin que des derniers échanges. */
const MAX_HISTORY = 10;
const MAX_CONTEXT_LENGTH = 12_000;

function parseHistory(value: unknown): TakTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (turn): turn is TakTurn =>
        typeof turn === "object" &&
        turn !== null &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 2000) }));
}

function parseRituals(value: unknown): TakRitual[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (ritual): ritual is TakRitual =>
        typeof ritual === "object" &&
        ritual !== null &&
        typeof ritual.id === "string" &&
        typeof ritual.label === "string",
    )
    .map((ritual) => ({
      id: ritual.id,
      label: ritual.label,
      moment: String(ritual.moment ?? ""),
      done: Boolean(ritual.done),
    }));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const { text, today, weekday, time, context } = body;

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ ok: false, error: "Je n'ai rien entendu." }, { status: 400 });
  }
  if (typeof today !== "string" || typeof weekday !== "string") {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const rituals = parseRituals(body.rituals);
  const history = parseHistory(body.history);

  try {
    const { object: raw } = await generateObject({
      model: MODEL,
      schema: takModelSchema,
      system: buildTakSystemPrompt({
        today,
        weekday,
        time: typeof time === "string" ? time : "",
        context: typeof context === "string" ? context.slice(0, MAX_CONTEXT_LENGTH) : "",
        rituals,
      }),
      messages: [...history, { role: "user" as const, content: text.trim() }],
    });

    // Une action incomplète est écartée plutôt que proposée à moitié remplie.
    const actions = raw.actions
      .map(toTakAction)
      .filter((action) => action.action !== "incompris")
      .map((action) => ({ action, summary: describeTakAction(action, rituals) }));

    const recipeAction = actions.find((item) => item.action.action === "chercher_recette")?.action;
    if (recipeAction && recipeAction.action === "chercher_recette") {
      const recipe = await buildRecipe(recipeAction.plat);

      return Response.json({
        ok: true,
        reponse: raw.reponse,
        // La recette s'affiche directement : rien à confirmer pour elle.
        actions: actions.filter((item) => item.action.action !== "chercher_recette"),
        recipe,
      });
    }

    return Response.json({ ok: true, reponse: raw.reponse, actions });
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
