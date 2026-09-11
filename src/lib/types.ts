/** Types partagés de LesTakam. */

export type MemberId = string;

/** Couleurs d'accent disponibles pour identifier chaque membre d'un coup d'œil. */
export type AccentColor = "sky" | "rose" | "sage" | "terracotta" | "lilac" | "sun";

export type MemberRole = "parent" | "enfant";

export interface Member {
  id: MemberId;
  firstName: string;
  role: MemberRole;
  /** Emoji utilisé tant qu'aucune photo n'est importée. */
  avatarEmoji: string;
  /** Chemin d'une vraie photo de profil, une fois importée. */
  photoUrl?: string;
  accent: AccentColor;
  /** Ressenti thermique : influence la tenue proposée. */
  warmthPreference: "frileux" | "normal" | "chaud";
}

export type MomentOfDay = "matin" | "apres-midi" | "soir";

export interface Ritual {
  id: string;
  memberId: MemberId;
  label: string;
  emoji: string;
  moment: MomentOfDay;
  /** Heure indicative affichée à côté du rituel, ex. "21:00". */
  time?: string;
  /** Étoiles gagnées quand le rituel est validé par un parent. */
  stars: number;
  /** Un parent doit confirmer avant que les étoiles comptent. */
  needsParentApproval: boolean;
}

export type RitualState = "a-faire" | "coche" | "valide";

export interface RitualStatus {
  ritualId: string;
  /** Date au format AAAA-MM-JJ. */
  date: string;
  state: RitualState;
}

export type EventCategory =
  | "activite"
  | "ecole"
  | "sante"
  | "travail"
  | "famille"
  | "repas"
  | "autre";

export interface CalendarEvent {
  id: string;
  title: string;
  /** Date au format AAAA-MM-JJ. */
  date: string;
  /** Heure de début au format HH:MM, absente si l'événement dure toute la journée. */
  startTime?: string;
  endTime?: string;
  location?: string;
  category: EventCategory;
  /** Membres concernés par l'événement. */
  memberIds: MemberId[];
  /** Répétition hebdomadaire : l'événement réapparaît chaque semaine le même jour. */
  repeatsWeekly?: boolean;
  notes?: string;
}

export interface Reminder {
  id: string;
  label: string;
  /** Date d'échéance au format AAAA-MM-JJ, absente si le rappel concerne la semaine entière. */
  dueDate?: string;
  memberIds: MemberId[];
  done: boolean;
}

export interface Meal {
  id: string;
  /** Date au format AAAA-MM-JJ. */
  date: string;
  moment: "midi" | "soir";
  title: string;
  emoji: string;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  label: string;
  quantity?: string;
  /** Rayon du magasin, pour regrouper la liste. */
  aisle?: string;
  checked: boolean;
  /** Ajouté automatiquement depuis un repas planifié. */
  fromMealId?: string;
}

export interface RewardGoal {
  id: string;
  memberId: MemberId;
  label: string;
  emoji: string;
  /** Nombre d'étoiles nécessaires pour débloquer la récompense. */
  starsRequired: number;
  achievedOn?: string;
}

export interface WeatherDay {
  /** Date au format AAAA-MM-JJ. */
  date: string;
  minTemp: number;
  maxTemp: number;
  rainChance: number;
  /** Code météo Open-Meteo (WMO). */
  weatherCode: number;
}

export interface WeatherNow {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherForecast {
  locationName: string;
  now: WeatherNow;
  days: WeatherDay[];
  /** Heure de la dernière actualisation, en ISO. */
  fetchedAt: string;
}
