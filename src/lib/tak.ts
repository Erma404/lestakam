import { z } from "zod";
import { MEMBERS, RITUALS } from "./family";
import { CATEGORY_LABEL } from "./accents";
import type { MemberId } from "./types";

const memberIds = MEMBERS.map((member) => member.id) as [MemberId, ...MemberId[]];
const categoryValues = Object.keys(CATEGORY_LABEL) as [
  keyof typeof CATEGORY_LABEL,
  ...(keyof typeof CATEGORY_LABEL)[],
];

/** Un événement à ajouter au calendrier. */
export const addEventSchema = z.object({
  action: z.literal("ajouter_evenement"),
  titre: z.string().min(1),
  date: z.string().describe("Date au format AAAA-MM-JJ"),
  heureDebut: z.string().optional().describe("Heure de début au format HH:MM"),
  heureFin: z.string().optional().describe("Heure de fin au format HH:MM"),
  lieu: z.string().optional(),
  categorie: z.enum(categoryValues),
  personnes: z.array(z.enum(memberIds)).min(1),
  repeteChaqueSemaine: z.boolean().optional(),
  note: z.string().optional(),
});

/** Un repas à planifier. */
export const addMealSchema = z.object({
  action: z.literal("planifier_repas"),
  titre: z.string().min(1),
  date: z.string().describe("Date au format AAAA-MM-JJ"),
  moment: z.enum(["midi", "soir"]),
});

/** Un article à ajouter à la liste de courses. */
export const addShoppingItemSchema = z.object({
  action: z.literal("ajouter_article"),
  label: z.string().min(1),
  quantite: z.string().optional(),
  rayon: z.string().optional(),
});

/** Un rituel de Khloé à marquer fait. */
export const completeRitualSchema = z.object({
  action: z.literal("valider_rituel"),
  ritualId: z.string().describe("Identifiant exact du rituel dans la liste fournie"),
});

/** Une recherche de recette, à afficher sans rien modifier dans l'application. */
export const findRecipeSchema = z.object({
  action: z.literal("chercher_recette"),
  plat: z.string().min(1).describe("Nom du plat, tel que demandé, ex. « gratin aux pommes »"),
});

/** La demande n'a pas été comprise, ou ne correspond à aucune action connue. */
export const unknownSchema = z.object({
  action: z.literal("incompris"),
  raison: z.string(),
});

export const takActionSchema = z.discriminatedUnion("action", [
  addEventSchema,
  addMealSchema,
  addShoppingItemSchema,
  completeRitualSchema,
  findRecipeSchema,
  unknownSchema,
]);

export type TakAction = z.infer<typeof takActionSchema>;

/**
 * Certains modèles (OpenAI en sortie structurée stricte) refusent qu'une union
 * soit à la racine du schéma demandé. On l'enveloppe donc dans un objet : seul
 * `takActionSchema` reste utilisé ailleurs dans le code.
 */
export const takResponseSchema = z.object({ resultat: takActionSchema });

const MEMBER_NAME: Record<string, string> = Object.fromEntries(
  MEMBERS.map((member) => [member.id, member.firstName]),
);

function joinNames(ids: string[]): string {
  const names = ids.map((id) => MEMBER_NAME[id] ?? id);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/** Résumé lisible d'une action, pour la confirmation affichée avant exécution. */
export function describeTakAction(action: TakAction): string {
  switch (action.action) {
    case "ajouter_evenement": {
      const heure = action.heureDebut ? ` à ${action.heureDebut}` : "";
      return `Ajouter « ${action.titre} » le ${action.date}${heure}, pour ${joinNames(action.personnes)}.`;
    }
    case "planifier_repas":
      return `Planifier « ${action.titre} » le ${action.date} (${action.moment}).`;
    case "ajouter_article":
      return `Ajouter « ${action.label} »${action.quantite ? ` (${action.quantite})` : ""} à la liste de courses.`;
    case "valider_rituel": {
      const ritual = RITUALS.find((item) => item.id === action.ritualId);
      return ritual ? `Valider le rituel « ${ritual.label} » de Khloé.` : "Valider un rituel de Khloé.";
    }
    case "chercher_recette":
      return `Chercher la recette de « ${action.plat} ».`;
    case "incompris":
      return action.raison;
  }
}

/** Lien de recherche YouTube pour un plat, sans clé d'accès ni vidéo devinée. */
export function youtubeSearchUrl(plat: string): string {
  const query = encodeURIComponent(`recette ${plat}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/** Contexte donné au modèle pour comprendre une commande de la famille. */
export function buildTakSystemPrompt(today: string, weekday: string): string {
  const membersList = MEMBERS.map((member) => `- ${member.id} : ${member.firstName} (${member.role})`).join(
    "\n",
  );
  const ritualsList = RITUALS.map((ritual) => `- ${ritual.id} : "${ritual.label}" (${ritual.moment})`).join(
    "\n",
  );
  const categoriesList = Object.entries(CATEGORY_LABEL)
    .map(([value, label]) => `- ${value} : ${label}`)
    .join("\n");

  return `Tu es Tak, l'assistant vocal de la famille LesTakam. Tu transformes une phrase dite à
l'oral en UNE seule action structurée. Tu n'exécutes rien toi-même : tu décris seulement ce
qu'il faudrait faire, l'application s'en charge ensuite après confirmation d'un parent.

Nous sommes le ${today} (${weekday}). Calcule toute date relative ("demain", "vendredi
prochain", "dans trois jours") à partir d'aujourd'hui, au format AAAA-MM-JJ.

Membres du foyer :
${membersList}

Catégories d'événement possibles :
${categoriesList}

Rituels de Khloé (pour "valider_rituel", reprends exactement l'identifiant qui correspond) :
${ritualsList}

Si la phrase concerne un rendez-vous, une activité ou tout ce qui va sur le calendrier :
choisis "ajouter_evenement". Si elle concerne un menu ou un plat prévu pour un repas : choisis
"planifier_repas". Si elle concerne un article à acheter : choisis "ajouter_article". Si elle dit
qu'un rituel de Khloé vient d'être fait : choisis "valider_rituel". Si elle demande une recette
ou comment préparer un plat : choisis "chercher_recette". Si la phrase ne correspond à aucune de
ces actions, si elle demande de supprimer ou modifier quelque chose, ou si elle est trop ambiguë
pour être sûr, choisis "incompris" et explique brièvement pourquoi dans "raison", en français,
avec un ton amical.`;
}
