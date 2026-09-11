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

/** Ex. « jeudi 11 septembre ». */
export function formatLongDate(key: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromDateKey(key));
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
