/**
 * Vacances scolaires de la zone C (académie de Créteil, dont Le Blanc-Mesnil)
 * et jours fériés, pour les activités qui n'ont lieu qu'en période scolaire
 * (natation, danse…).
 *
 * Source : arrêté du 22 octobre 2025 (Journal officiel du 23 octobre 2025),
 * repris sur service-public.gouv.fr. À compléter chaque année scolaire.
 */

/** Périodes sans école, bornes incluses, du premier jour de vacances à la veille de la reprise. */
const ZONE_C_HOLIDAYS: { label: string; from: string; to: string }[] = [
  { label: "Vacances de la Toussaint", from: "2026-10-17", to: "2026-11-01" },
  { label: "Vacances de Noël", from: "2026-12-19", to: "2027-01-03" },
  { label: "Vacances d'hiver", from: "2027-02-06", to: "2027-02-21" },
  { label: "Vacances de printemps", from: "2027-04-03", to: "2027-04-18" },
  { label: "Pont de l'Ascension", from: "2027-05-06", to: "2027-05-09" },
  { label: "Vacances d'été", from: "2027-07-03", to: "2027-08-31" },
];

/** Jours fériés, où les activités régulières sont aussi suspendues. */
const PUBLIC_HOLIDAYS: Record<string, string> = {
  "2026-11-01": "Toussaint",
  "2026-11-11": "Armistice",
  "2026-12-25": "Noël",
  "2027-01-01": "Jour de l'an",
  "2027-03-29": "Lundi de Pâques",
  "2027-05-01": "Fête du travail",
  "2027-05-06": "Ascension",
  "2027-05-08": "Victoire 1945",
  "2027-05-17": "Lundi de Pentecôte",
  "2027-07-14": "Fête nationale",
  "2027-08-15": "Assomption",
};

/** Nom de la période sans école qui couvre ce jour (AAAA-MM-JJ), ou `undefined`. */
export function schoolBreakOn(date: string): string | undefined {
  if (PUBLIC_HOLIDAYS[date]) return PUBLIC_HOLIDAYS[date];
  return ZONE_C_HOLIDAYS.find((period) => date >= period.from && date <= period.to)?.label;
}

/** Vrai si ce jour tombe pendant des vacances scolaires (zone C) ou un jour férié. */
export function isSchoolBreak(date: string): boolean {
  return schoolBreakOn(date) !== undefined;
}
