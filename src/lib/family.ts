/** Le foyer et ses données de départ. */

import type {
  CalendarEvent,
  Meal,
  Member,
  Reminder,
  Ritual,
  RewardGoal,
  ShoppingItem,
} from "./types";
import { addDays, fromDateKey, todayKey } from "./dates";

/** Le prochain samedi, aujourd'hui compris. */
function nextSaturday(from: string): string {
  const weekday = fromDateKey(from).getDay();
  return addDays(from, (6 - weekday + 7) % 7);
}

export const MEMBERS: Member[] = [
  {
    id: "stephane",
    firstName: "Stéphane",
    role: "parent",
    avatarEmoji: "👨🏾",
    photoUrl: "/avatars/stephane.jpg",
    accent: "sky",
    warmthPreference: "chaud",
  },
  {
    id: "ernestine",
    firstName: "Ernestine",
    role: "parent",
    avatarEmoji: "👩🏾",
    photoUrl: "/avatars/ernestine.jpg",
    accent: "rose",
    warmthPreference: "frileux",
  },
  {
    id: "khloe",
    firstName: "Khloé",
    role: "enfant",
    avatarEmoji: "👧🏾",
    photoUrl: "/avatars/khloe.jpg",
    accent: "sun",
    warmthPreference: "frileux",
  },
];

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((member) => member.id === id);
}

export const PARENTS = MEMBERS.filter((member) => member.role === "parent");
export const CHILDREN = MEMBERS.filter((member) => member.role === "enfant");

/** Rituels quotidiens de Khloé, répartis par moment de la journée. */
export const RITUALS: Ritual[] = [
  {
    id: "matin-dents",
    memberId: "khloe",
    label: "Brosser les dents",
    emoji: "🪥",
    moment: "matin",
    time: "07:30",
    stars: 1,
    needsParentApproval: true,
  },
  {
    id: "matin-visage",
    memberId: "khloe",
    label: "Nettoyer le visage",
    emoji: "🧼",
    moment: "matin",
    time: "07:35",
    stars: 1,
    needsParentApproval: true,
  },
  {
    id: "matin-habiller",
    memberId: "khloe",
    label: "S'habiller toute seule",
    emoji: "👗",
    moment: "matin",
    time: "07:45",
    stars: 1,
    needsParentApproval: false,
  },
  {
    id: "matin-cartable",
    memberId: "khloe",
    label: "Préparer le cartable",
    emoji: "🎒",
    moment: "matin",
    time: "08:00",
    stars: 1,
    needsParentApproval: false,
  },
  {
    id: "aprem-gouter",
    memberId: "khloe",
    label: "Goûter et ranger l'assiette",
    emoji: "🍎",
    moment: "apres-midi",
    time: "16:30",
    stars: 1,
    needsParentApproval: false,
  },
  {
    id: "aprem-jouets",
    memberId: "khloe",
    label: "Ranger les jouets",
    emoji: "🧸",
    moment: "apres-midi",
    time: "17:30",
    stars: 1,
    needsParentApproval: true,
  },
  {
    id: "aprem-sans-ecran",
    memberId: "khloe",
    label: "3 heures sans écran",
    emoji: "📵",
    moment: "apres-midi",
    time: "17:00",
    stars: 5,
    needsParentApproval: true,
  },
  {
    id: "soir-douche",
    memberId: "khloe",
    label: "Prendre sa douche",
    emoji: "🚿",
    moment: "soir",
    time: "19:30",
    stars: 1,
    needsParentApproval: true,
  },
  {
    id: "soir-dents",
    memberId: "khloe",
    label: "Brosser les dents",
    emoji: "🪥",
    moment: "soir",
    time: "20:30",
    stars: 1,
    needsParentApproval: true,
  },
  {
    id: "soir-histoire",
    memberId: "khloe",
    label: "Histoire du soir",
    emoji: "📖",
    moment: "soir",
    time: "20:45",
    stars: 1,
    needsParentApproval: false,
  },
  {
    id: "soir-dodo",
    memberId: "khloe",
    label: "Dodo",
    emoji: "🌙",
    moment: "soir",
    time: "21:00",
    stars: 3,
    needsParentApproval: true,
  },
];

/** Objectifs de récompense de Khloé. */
export const REWARD_GOALS: RewardGoal[] = [
  {
    id: "goal-parc",
    memberId: "khloe",
    label: "Après-midi au parc",
    emoji: "🛝",
    starsRequired: 20,
  },
  {
    id: "goal-restaurant",
    memberId: "khloe",
    label: "Repas au restaurant",
    emoji: "🍽️",
    starsRequired: 20,
  },
  {
    id: "goal-cinema",
    memberId: "khloe",
    label: "Séance de cinéma",
    emoji: "🍿",
    starsRequired: 40,
  },
  {
    id: "goal-surprise",
    memberId: "khloe",
    label: "Surprise mystère",
    emoji: "🎁",
    starsRequired: 60,
  },
];

/** Quelques exemples pour visualiser le tableau de bord avant la mise en service. */
export function demoEvents(today = todayKey()): CalendarEvent[] {
  return [
    {
      id: "demo-ecole",
      title: "École",
      date: today,
      startTime: "08:30",
      endTime: "16:30",
      category: "ecole",
      memberIds: ["khloe"],
      repeatsWeekly: true,
    },
    {
      id: "demo-natation",
      title: "Cours de natation",
      date: nextSaturday(today),
      startTime: "10:00",
      endTime: "11:00",
      location: "Piscine municipale",
      category: "activite",
      memberIds: ["khloe"],
      repeatsWeekly: true,
    },
    {
      id: "demo-courses",
      title: "Courses de la semaine",
      date: addDays(today, 2),
      startTime: "14:00",
      category: "famille",
      memberIds: ["stephane", "ernestine"],
    },
    {
      id: "demo-medecin",
      title: "Rendez-vous pédiatre",
      date: addDays(today, 4),
      startTime: "09:15",
      category: "sante",
      memberIds: ["khloe", "ernestine"],
    },
  ];
}

export function demoReminders(today = todayKey()): Reminder[] {
  return [
    {
      id: "demo-rappel-sac",
      label: "Préparer le sac de piscine de Khloé",
      dueDate: addDays(today, 1),
      memberIds: ["stephane"],
      done: false,
    },
    {
      id: "demo-rappel-cantine",
      label: "Régler la cantine du mois",
      dueDate: addDays(today, 3),
      memberIds: ["ernestine"],
      done: false,
    },
  ];
}

export function demoMeals(today = todayKey()): Meal[] {
  return [
    { id: "demo-repas-1", date: today, moment: "soir", title: "Poulet et légumes rôtis", emoji: "🍗" },
    { id: "demo-repas-2", date: addDays(today, 1), moment: "soir", title: "Gratin de pâtes", emoji: "🧀" },
    { id: "demo-repas-3", date: addDays(today, 2), moment: "midi", title: "Riz, poisson, salade", emoji: "🐟" },
  ];
}

export function demoShoppingList(): ShoppingItem[] {
  return [
    { id: "demo-course-1", label: "Lait", quantity: "2 L", aisle: "Frais", checked: false },
    { id: "demo-course-2", label: "Pommes", quantity: "1 kg", aisle: "Fruits et légumes", checked: false },
    { id: "demo-course-3", label: "Pâtes", aisle: "Épicerie", checked: true },
  ];
}
