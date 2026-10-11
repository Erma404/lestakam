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
  horsVacancesScolaires: z.boolean().optional(),
  joursSemaine: z.array(z.number()).optional(),
  note: z.string().optional(),
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
  addShoppingItemSchema,
  completeRitualSchema,
  findRecipeSchema,
  unknownSchema,
]);

export type TakAction = z.infer<typeof takActionSchema>;

/**
 * Une action telle que demandée au modèle : un seul objet plat, tous les
 * champs présents. Certains modèles (OpenAI en sortie structurée stricte)
 * refusent purement et simplement un "oneOf"/union, même imbriqué —
 * `takActionSchema` reste le seul type utilisé ailleurs dans le code ;
 * `toTakAction` fait la conversion juste après l'appel au modèle.
 */
export const takModelActionSchema = z.object({
  action: z.enum([
    "ajouter_evenement",
    "ajouter_article",
    "valider_rituel",
    "chercher_recette",
  ]),
  // OpenAI en sortie structurée stricte exige que chaque propriété figure dans
  // "required" : un champ non pertinent pour l'action choisie doit être rendu
  // nullable (et donc valoir explicitement `null`), jamais simplement omis.
  titre: z.string().nullable().describe("Titre, pour un événement"),
  date: z.string().nullable().describe("Date au format AAAA-MM-JJ, pour un événement"),
  heureDebut: z.string().nullable().describe("Heure de début HH:MM, pour un événement"),
  heureFin: z.string().nullable().describe("Heure de fin HH:MM, pour un événement"),
  lieu: z.string().nullable().describe("Lieu, pour un événement"),
  categorie: z.enum(categoryValues).nullable().describe("Catégorie, pour un événement"),
  personnes: z.array(z.enum(memberIds)).nullable().describe("Personnes concernées, pour un événement"),
  repeteChaqueSemaine: z.boolean().nullable(),
  horsVacancesScolaires: z
    .boolean()
    .nullable()
    .describe("Avec repeteChaqueSemaine : sauter les vacances scolaires et jours fériés"),
  joursSemaine: z
    .array(z.number())
    .nullable()
    .describe("Avec repeteChaqueSemaine : jours concernés, 0 = dimanche … 6 = samedi (ex. [1,2,3,4,5])"),
  note: z.string().nullable(),
  label: z.string().nullable().describe("Nom d'UN article, pour la liste de courses"),
  quantite: z.string().nullable(),
  rayon: z.string().nullable(),
  ritualId: z.string().nullable().describe("Identifiant exact du rituel, pour valider_rituel"),
  plat: z.string().nullable().describe("Nom du plat, pour chercher_recette"),
});

/** Réponse complète du modèle : ce que Tak dit, et les actions à proposer. */
export const takModelSchema = z.object({
  reponse: z
    .string()
    .describe("Ce que Tak répond à la famille, en français, court et chaleureux. Jamais vide."),
  actions: z
    .array(takModelActionSchema)
    .describe("Actions à proposer dans l'application ; tableau vide pour une simple question."),
});

export type TakModelAction = z.infer<typeof takModelActionSchema>;
export type TakModelOutput = z.infer<typeof takModelSchema>;

/**
 * Convertit une action plate du modèle vers l'action typée utilisée par le
 * reste de l'application. Bascule sur "incompris" si un champ requis par
 * l'action choisie manque, plutôt que de laisser passer une donnée à moitié
 * remplie.
 */
export function toTakAction(raw: TakModelAction): TakAction {
  switch (raw.action) {
    case "ajouter_evenement": {
      if (!raw.titre || !raw.date || !raw.categorie || !raw.personnes?.length) {
        return {
          action: "incompris",
          raison: "Il manque des informations pour cet événement (titre, date, personnes concernées ou catégorie).",
        };
      }
      return {
        action: "ajouter_evenement",
        titre: raw.titre,
        date: raw.date,
        heureDebut: raw.heureDebut || undefined,
        heureFin: raw.heureFin || undefined,
        lieu: raw.lieu || undefined,
        categorie: raw.categorie,
        personnes: raw.personnes,
        repeteChaqueSemaine: raw.repeteChaqueSemaine || undefined,
        horsVacancesScolaires:
          (raw.repeteChaqueSemaine && raw.horsVacancesScolaires) || undefined,
        joursSemaine:
          raw.repeteChaqueSemaine && raw.joursSemaine?.length
            ? raw.joursSemaine.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
            : undefined,
        note: raw.note || undefined,
      };
    }
    case "ajouter_article": {
      if (!raw.label) {
        return { action: "incompris", raison: "Je n'ai pas compris quel article ajouter à la liste." };
      }
      return {
        action: "ajouter_article",
        label: raw.label,
        quantite: raw.quantite || undefined,
        rayon: raw.rayon || undefined,
      };
    }
    case "valider_rituel": {
      if (!raw.ritualId) {
        return { action: "incompris", raison: "Je n'ai pas retrouvé de quel rituel il s'agit." };
      }
      return { action: "valider_rituel", ritualId: raw.ritualId };
    }
    case "chercher_recette": {
      if (!raw.plat) {
        return { action: "incompris", raison: "Je n'ai pas compris quel plat tu cherches." };
      }
      return { action: "chercher_recette", plat: raw.plat };
    }
    default:
      return { action: "incompris", raison: "Je n'ai pas compris cette demande." };
  }
}

/** Un message de la conversation en cours, renvoyé au modèle pour qu'il suive le fil. */
export interface TakTurn {
  role: "user" | "assistant";
  content: string;
}

/** Un rituel du jour tel que Tak le voit, avec l'identifiant réel (local ou base). */
export interface TakRitual {
  id: string;
  label: string;
  moment: string;
  done: boolean;
}

const MEMBER_NAME: Record<string, string> = Object.fromEntries(
  MEMBERS.map((member) => [member.id, member.firstName]),
);

function joinNames(ids: string[]): string {
  const names = ids.map((id) => MEMBER_NAME[id] ?? id);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/** Résumé lisible d'une action, pour la confirmation affichée avant exécution. */
export function describeTakAction(action: TakAction, rituals: TakRitual[] = []): string {
  switch (action.action) {
    case "ajouter_evenement": {
      const heure = action.heureDebut ? ` à ${action.heureDebut}` : "";
      const repetition = action.repeteChaqueSemaine
        ? action.horsVacancesScolaires
          ? ", chaque semaine hors vacances scolaires"
          : ", chaque semaine"
        : "";
      return `Ajouter « ${action.titre} » le ${action.date}${heure}${repetition}, pour ${joinNames(action.personnes)}.`;
    }
    case "ajouter_article":
      return `Ajouter « ${action.label} »${action.quantite ? ` (${action.quantite})` : ""} à la liste de courses.`;
    case "valider_rituel": {
      const ritual =
        rituals.find((item) => item.id === action.ritualId) ??
        RITUALS.find((item) => item.id === action.ritualId);
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

/** Recette structurée, pour l'afficher avec des ingrédients et des étapes séparés. */
export const recipeSchema = z.object({
  portions: z.number().describe("Nombre de portions de la recette, ex. 3 pour la famille"),
  ingredients: z.array(z.string().min(1)).min(1),
  etapes: z.array(z.string().min(1)).min(1),
  nutrition: z
    .object({
      calories: z.number().describe("kcal par portion adulte"),
      proteines: z.number().describe("grammes de protéines par portion"),
      glucides: z.number().describe("grammes de glucides par portion"),
      lipides: z.number().describe("grammes de lipides par portion"),
      fibres: z.number().describe("grammes de fibres par portion"),
    })
    .describe("Valeurs nutritionnelles estimées par portion, cohérentes avec les quantités"),
});

export type Recipe = z.infer<typeof recipeSchema>;

const WIKI_USER_AGENT = "LesTakam/1.0 (application familiale, usage non commercial)";

/**
 * Image de tête d'un article Wikipédia correspondant au plat — beaucoup
 * plus fiable qu'une recherche libre sur Commons, car c'est l'image choisie
 * par l'article pour illustrer précisément ce sujet.
 */
async function wikipediaThumbnail(plat: string, lang: "fr" | "en"): Promise<string | null> {
  const searchUrl =
    `https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json` +
    `&search=${encodeURIComponent(plat)}&limit=1&namespace=0`;
  const searchResponse = await fetch(searchUrl, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });
  if (!searchResponse.ok) return null;

  const searchData = (await searchResponse.json()) as [string, string[], string[], string[]];
  const pageTitle = searchData?.[1]?.[0];
  if (!pageTitle) return null;

  const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    pageTitle.replace(/ /g, "_"),
  )}`;
  const summaryResponse = await fetch(summaryUrl, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });
  if (!summaryResponse.ok) return null;

  const summaryData = (await summaryResponse.json()) as {
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
  };
  return summaryData.thumbnail?.source ?? summaryData.originalimage?.source ?? null;
}

/**
 * Repli : recherche libre sur Wikimedia Commons. Moins fiable — un même mot
 * peut faire remonter un scan de vieux livre de cuisine ou une photo sans
 * rapport — donc on exige que le FICHIER lui-même (pas sa vignette dérivée,
 * qui se termine toujours en .jpg même pour un PDF) soit une vraie image.
 */
async function searchDishImage(searchTerm: string): Promise<string | null> {
  const query = encodeURIComponent(searchTerm);
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${query}` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=800`;

  const response = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    query?: {
      pages?: Record<string, { title?: string; imageinfo?: { thumburl?: string; url?: string }[] }>;
    };
  };
  const pages = data.query?.pages;
  if (!pages) return null;

  for (const page of Object.values(pages)) {
    const title = page.title ?? "";
    // Le titre du fichier doit lui-même être une image — écarte les scans
    // de livres (souvent suffixés « (IA xxxxx).pdf ») et autres documents.
    if (!/\.(jpe?g|png)$/i.test(title)) continue;
    const info = page.imageinfo?.[0];
    const src = info?.thumburl ?? info?.url;
    if (src) return src;
  }
  return null;
}

export async function findDishImage(plat: string): Promise<string | null> {
  try {
    return (
      (await wikipediaThumbnail(plat, "fr")) ??
      (await wikipediaThumbnail(plat, "en")) ??
      (await searchDishImage(plat)) ??
      (await searchDishImage(`${plat} food`))
    );
  } catch {
    return null;
  }
}

/**
 * Consignes de Tak. `context` est l'état réel de l'application au moment de
 * la question (calendrier, courses, rituels, étoiles, météo), construit
 * par l'appareil : Tak répond à partir de ce que la famille voit à l'écran.
 */
export function buildTakSystemPrompt(input: {
  today: string;
  weekday: string;
  time: string;
  context: string;
  rituals: TakRitual[];
}): string {
  const membersList = MEMBERS.map((member) => `- ${member.id} : ${member.firstName} (${member.role})`).join(
    "\n",
  );
  const ritualsList =
    input.rituals.length > 0
      ? input.rituals
          .map((ritual) => `- ${ritual.id} : "${ritual.label}" (${ritual.moment}, ${ritual.done ? "fait" : "pas encore fait"})`)
          .join("\n")
      : "(aucun rituel aujourd'hui)";
  const categoriesList = Object.entries(CATEGORY_LABEL)
    .map(([value, label]) => `- ${value} : ${label}`)
    .join("\n");

  return `Tu es Tak, le renard assistant de la famille Takam : Stéphane (papa), Ernestine (maman) et
leur fille Khloé (5 ans). Ils habitent au Blanc-Mesnil. Tu es leur assistant IA du quotidien.

Ce que tu sais faire :
1. Répondre à TOUTE question, dans "reponse" : sur leur planning, leurs courses, les
   rituels et étoiles de Khloé, la météo — en t'appuyant sur l'état de l'application ci-dessous —
   mais aussi les questions générales : idées de sorties ou d'activités avec une enfant de 5 ans,
   idées de menus, conseils d'éducation, organisation, culture générale, devoirs, histoires à
   raconter… Tu réponds comme un assistant compétent, jamais « je ne peux pas ».
2. Proposer des actions dans l'application, dans "actions" (la famille confirme avant qu'elles
   s'exécutent) :
   - "ajouter_evenement" : rendez-vous, activité, tout ce qui va au calendrier ;
   - "ajouter_article" : UN article à acheter (une action par article : « lait, œufs et pain » =
     trois actions) ;
   - "valider_rituel" : un rituel de Khloé vient d'être fait (reprends exactement l'identifiant) ;
   - "chercher_recette" : on demande une recette ou comment préparer un plat.
   Tu peux combiner : ex. « on fait des lasagnes demain, ajoute ce qu'il faut » = un article par
   ingrédient manquant.

Pour une activité régulière « hors vacances scolaires » (natation, danse…), mets
repeteChaqueSemaine et horsVacancesScolaires à true : l'application connaît les vacances de la
zone C et les jours fériés. "date" est alors la première séance à venir. Pour plusieurs jours
par semaine (« l'école du lundi au vendredi »), remplis joursSemaine (0 = dimanche … 6 = samedi).

Ne propose une action que si la phrase la demande ou l'implique clairement : pour une simple
question ou une demande d'idée, réponds sans action, et propose d'ajouter si c'est utile.

Tu ne peux pas supprimer ni modifier ce qui existe : dis-le gentiment et indique où le faire dans
l'application (Calendrier, Listes, Rituels, Récompenses).

Règles de "reponse" :
- Français, tutoiement, ton chaleureux et simple ; 1 à 4 phrases, ou une courte liste si utile.
- Si tu proposes des actions, résume-les en une phrase (« Je te propose d'ajouter… »).
- N'invente jamais un événement ou un chiffre absent du contexte : si l'info n'y est
  pas, dis-le.
- Pas de markdown lourd (pas de titres, pas de gras) : le texte s'affiche tel quel.

Nous sommes le ${input.today} (${input.weekday}), il est ${input.time}. Calcule toute date relative
("demain", "vendredi prochain", "ce week-end") à partir d'aujourd'hui, au format AAAA-MM-JJ. Sans
heure précisée pour un événement, laisse les heures vides.

Membres du foyer (identifiants à utiliser dans "personnes") :
${membersList}

Catégories d'événement possibles :
${categoriesList}

Rituels de Khloé aujourd'hui :
${ritualsList}

État actuel de l'application :
${input.context || "(non disponible)"}`;
}
