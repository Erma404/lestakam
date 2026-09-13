/** Utilitaires de date, en français et sur le fuseau horaire du foyer. */

export const HOME_TIMEZONE = "Europe/Paris";

/** Renvoie une date au format AAAA-MM-JJ dans le fuseau du foyer. */
export function toDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: HOME_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

/** Date du jour au format AAAA-MM-JJ. */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** Convertit AAAA-MM-JJ en objet Date à midi, pour éviter les décalages de fuseau. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/** Ajoute un nombre de jours à une date AAAA-MM-JJ. */
export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Les 7 prochains jours à partir d'aujourd'hui inclus. */
export function nextSevenDays(from: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(from, index));
}

/** Jour de la semaine pour une date AAAA-MM-JJ (0 = dimanche … 6 = samedi). */
export function weekdayNumber(key: string): number {
  return fromDateKey(key).getDay();
}

/** Premier jour (lundi) de la semaine contenant cette date. */
export function startOfWeek(date: string): string {
  const weekday = fromDateKey(date).getDay(); // 0 = dimanche
  const offsetFromMonday = (weekday + 6) % 7;
  return addDays(date, -offsetFromMonday);
}

/** Les 7 jours de la semaine (lundi à dimanche) contenant cette date. */
export function weekDays(date: string): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Premier jour du mois contenant cette date. */
export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/**
 * Décale une date d'un certain nombre de mois, sans dérive de jour — ex. en
 * partant du 31 janvier, un mois plus tard donne le dernier jour de février,
 * jamais mars.
 */
export function shiftMonth(date: string, months: number): string {
  const parsed = fromDateKey(date);
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + months);
  return toDateKey(parsed);
}

/**
 * Les jours affichés dans une vue mensuelle : 6 semaines complètes (lundi à
 * dimanche) couvrant le mois, avec quelques jours des mois voisins pour
 * remplir la grille.
 */
export function monthGridDays(date: string): string[] {
  const gridStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

/** Ex. « jeudi 11 septembre ». */
export function formatLongDate(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromDateKey(key));
}

/** Ex. « septembre 2026 ». */
export function formatMonthYear(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    fromDateKey(key),
  );
}

/** Ex. « sept. » — pour les libellés courts (grille mensuelle). */
export function formatMonthShort(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(fromDateKey(key));
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Le mois (et l'année) d'une fenêtre de jours, pour qu'on sache toujours
 * « on est en quel mois » même en ne regardant qu'une bande de jours.
 * Ex. « Septembre 2026 », ou « sept. – oct. 2026 » si la fenêtre chevauche
 * deux mois.
 */
export function formatDateRangeMonth(days: string[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const firstMonth = formatMonthYear(first);
  const lastMonth = formatMonthYear(last);
  if (firstMonth === lastMonth) return capitalizeFirst(firstMonth);
  return `${capitalizeFirst(formatMonthShort(first))} – ${capitalizeFirst(lastMonth)}`;
}

/** Ex. « JEU » pour la bande des 7 jours. */
export function formatWeekdayShort(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(fromDateKey(key))
    .replace(".", "")
    .toUpperCase();
}

/** Ex. « 11 ». */
export function formatDayNumber(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(fromDateKey(key));
}

/** Libellé relatif : « Aujourd'hui », « Demain », sinon le jour de la semaine. */
export function formatRelativeDay(key: string, today: string): string {
  if (key === today) return "Aujourd'hui";
  if (key === addDays(today, 1)) return "Demain";
  const long = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric" }).format(
    fromDateKey(key),
  );
  return long.charAt(0).toUpperCase() + long.slice(1);
}

/** Heure courante au format HH:MM dans le fuseau du foyer. */
export function currentTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: HOME_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

/** Heure de la journée (0-23) dans le fuseau du foyer. */
function hourInHomeTimezone(now: Date): number {
  // `formatToParts` isole le nombre : en français, `format` ajoute un suffixe « h ».
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: HOME_TIMEZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hourPart = parts.find((part) => part.type === "hour")?.value ?? "0";
  return Number(hourPart);
}

/** Moment de la journée déduit de l'heure, pour mettre en avant les bons rituels. */
export function currentMoment(now: Date = new Date()): "matin" | "apres-midi" | "soir" {
  const hour = hourInHomeTimezone(now);
  if (hour < 12) return "matin";
  if (hour < 17) return "apres-midi";
  return "soir";
}
