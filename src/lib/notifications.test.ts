import { describe, expect, it } from "vitest";
import { planNotifications } from "./notifications";
import type { CalendarEvent, Reminder } from "./types";

// Samedi 10 octobre 2026 : natation à 19h, hors vacances scolaires.
const natation: CalendarEvent = {
  id: "natation",
  title: "Natation",
  date: "2026-10-03",
  startTime: "19:00",
  location: "Centre aquatique olympique",
  category: "activite",
  memberIds: ["khloe"],
  repeatsWeekly: true,
  skipSchoolHolidays: true,
};

const ecole: CalendarEvent = {
  id: "ecole",
  title: "École",
  date: "2026-10-05",
  startTime: "08:30",
  category: "ecole",
  memberIds: ["khloe"],
  repeatsWeekly: true,
  repeatDays: [1, 2, 3, 4, 5],
};

const none = new Set<string>();

describe("planNotifications", () => {
  it("annonce la veille au soir les rendez-vous du lendemain", () => {
    const planned = planNotifications([natation], [], "2026-10-09", "19:05", none);
    expect(planned).toHaveLength(1);
    expect(planned[0].key).toBe("veille:2026-10-10");
    expect(planned[0].body).toBe("19h00 Khloé : Natation");
  });

  it("n'annonce rien avant 19h, ni deux fois", () => {
    expect(planNotifications([natation], [], "2026-10-09", "18:55", none)).toEqual([]);
    const sent = new Set(["veille:2026-10-10"]);
    expect(planNotifications([natation], [], "2026-10-09", "21:00", sent)).toEqual([]);
  });

  it("rappelle un événement dans l'heure qui précède", () => {
    expect(planNotifications([natation], [], "2026-10-10", "17:55", none)).toEqual([]);
    const planned = planNotifications([natation], [], "2026-10-10", "18:05", none);
    expect(planned.map((item) => item.title)).toEqual(["À 19h00 : Natation"]);
    expect(planned[0].body).toBe("Khloé\nCentre aquatique olympique");
    expect(planNotifications([natation], [], "2026-10-10", "19:00", none)).toEqual([]);
  });

  it("se tait pendant les vacances scolaires", () => {
    // Samedi 24 octobre 2026 : vacances de la Toussaint.
    expect(planNotifications([natation], [], "2026-10-24", "18:30", none)).toEqual([]);
  });

  it("ne rappelle pas l'école tous les jours", () => {
    expect(planNotifications([ecole], [], "2026-10-13", "08:00", none)).toEqual([]);
    expect(planNotifications([ecole], [], "2026-10-12", "19:30", none)).toEqual([]);
  });

  it("envoie les « À ne pas oublier » du jour le matin", () => {
    const reminders: Reminder[] = [
      { id: "photo", label: "Photo de classe", dueDate: "2026-10-13", memberIds: [], done: false },
      { id: "fait", label: "Déjà fait", dueDate: "2026-10-13", memberIds: [], done: true },
      { id: "demain", label: "Plus tard", dueDate: "2026-10-14", memberIds: [], done: false },
    ];
    expect(planNotifications([], reminders, "2026-10-13", "07:30", none)).toEqual([]);
    const planned = planNotifications([], reminders, "2026-10-13", "08:10", none);
    expect(planned.map((item) => item.body)).toEqual(["Photo de classe"]);
  });
});
