/**
 * Transforme une ligne d'ingrédient de recette (« 1 boîte de haricots rouges
 * (env. 240 g égouttés) ») en article de courses (« Haricots rouges », 1 boîte),
 * et repère ce qu'on a déjà au placard (sel, huile, épices…) pour ne pas le
 * cocher d'office.
 */

export interface ShoppingCandidate {
  /** Ligne d'origine, telle qu'affichée dans la recette. */
  source: string;
  label: string;
  quantity?: string;
  /** Sel, huile, épices, eau… : déjà à la maison la plupart du temps. */
  pantry: boolean;
  /** Marqué facultatif dans la recette. */
  optional: boolean;
}

const NUMBER = String.raw`(?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾]|(?:un|une|deux|trois|quatre)\b)`;
const UNIT = String.raw`(?:kg|g|mg|ml|cl|dl|l|c\.?\s*à\s*[sc]\.?|cuill[eè]res?\s*à\s*(?:soupe|café)|pinc[ée]es?|gousses?|tranches?|bo[iî]tes?|sachets?|brins?|bottes?|verres?|pots?|filets?|feuilles?|tasses?|poign[ée]es?|morceaux?|briques?|barquettes?)`;
const LEADING_QUANTITY = new RegExp(
  String.raw`^(?:(?:environ|env\.?)\s+)?(${NUMBER}(?:\s*(?:à|-|–)\s*${NUMBER})?)\s*(?:(?:petite?s?|grosse?s?|bonne?s?)\s+)?(${UNIT})?\.?\s*(?:de\s+|d['’]\s*)?`,
  "i",
);

/** Ce qu'on n'achète pas à chaque recette. */
const PANTRY =
  /^(sel|poivre|eau|huile|vinaigre|sucre|farine|levure|paprika|cumin|curry|curcuma|cannelle|muscade|herbes?|thym|laurier|origan|basilic séché|épices?|piment|gingembre moulu|bouillon|fond de|maïzena|moutarde)\b/i;

/** Quantités qui ne s'achètent pas (on ne prend pas « 1 c. à c. » au magasin). */
const TINY_UNIT = /^(c\.?\s*à|cuill|pinc)/i;

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
}

export function toShoppingCandidate(source: string): ShoppingCandidate {
  let text = source.trim();
  const optional = /facultatif|option/i.test(text);
  text = text.replace(/^(option|en option|facultatif)\s*:\s*/i, "");
  // Précisions entre parenthèses et préparation après la virgule : inutiles en magasin.
  text = text.replace(/\([^)]*\)?/g, " ").split(/,|;|\s+[-–]\s+/)[0];
  text = text.replace(/\s+(pour|si besoin|selon).*$/i, "").replace(/\s+/g, " ").trim();

  let quantity: string | undefined;
  let tinyUnit = false;
  const match = text.match(LEADING_QUANTITY);
  if (match && match[0].trim()) {
    const [whole, amount, unit] = match;
    tinyUnit = Boolean(unit && TINY_UNIT.test(unit));
    quantity = tinyUnit ? undefined : [amount, unit].filter(Boolean).join(" ").replace(/\s+/g, " ");
    text = text.slice(whole.length).trim();
  }

  const label = capitalize(text || source.trim());
  const pantry = PANTRY.test(text) || /^sel et poivre/i.test(text) || (tinyUnit && !/beurre|crème/i.test(text));
  return { source, label, quantity, pantry, optional };
}
