import type { AccentColor } from "./types";

interface AccentClasses {
  /** Fond pastel, pour les cartes et pastilles. */
  soft: string;
  /** Fond soutenu, pour les puces et points de couleur. */
  solid: string;
  /** Bordure assortie, pour l'état sélectionné. */
  ring: string;
  /** Texte assorti. */
  text: string;
}

/**
 * Classes écrites en toutes lettres : Tailwind ne détecte pas
 * les noms de classes construits dynamiquement.
 */
const ACCENTS: Record<AccentColor, AccentClasses> = {
  sky: { soft: "bg-sky-soft", solid: "bg-sky", ring: "ring-sky", text: "text-sky" },
  rose: { soft: "bg-rose-soft", solid: "bg-rose", ring: "ring-rose", text: "text-rose" },
  sage: { soft: "bg-sage-soft", solid: "bg-sage", ring: "ring-sage", text: "text-sage" },
  terracotta: {
    soft: "bg-terracotta-soft",
    solid: "bg-terracotta",
    ring: "ring-terracotta",
    text: "text-terracotta",
  },
  lilac: { soft: "bg-lilac-soft", solid: "bg-lilac", ring: "ring-lilac", text: "text-lilac" },
  sun: { soft: "bg-sun-soft", solid: "bg-sun", ring: "ring-sun", text: "text-sun" },
};

export function accentClasses(accent: AccentColor): AccentClasses {
  return ACCENTS[accent];
}

/** Couleur de pastille associée à chaque type d'événement du calendrier. */
export const CATEGORY_ACCENT = {
  activite: "sage",
  ecole: "sky",
  sante: "rose",
  travail: "lilac",
  famille: "terracotta",
  repas: "sun",
  autre: "sage",
} as const;

export const CATEGORY_LABEL = {
  activite: "Activité",
  ecole: "École",
  sante: "Santé",
  travail: "Travail",
  famille: "Famille",
  repas: "Repas",
  autre: "Autre",
} as const;
