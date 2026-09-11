import { describe, expect, it } from "vitest";
import { eventsForDay, expandEvents, nextEventForMember, sevenDayWindow } from "./events";
import type { CalendarEvent } from "./types";

const window7 = sevenDayWindow("2026-09-11");

const natation: CalendarEvent = {
  id: "natation",
  title: "Cours de natation",
  date: "2026-09-12",
  startTime: "10:00",
  category: "activite",
  memberIds: ["khloe"],
  repeatsWeekly: true,
};

const pediatre: CalendarEvent = {
  id: "pediatre",
  title: "Pédiatre",
  date: "2026-09-15",
  startTime: "09:15",
  category: "sante",
  memberIds: ["khloe", "ernestine"],
};

const passe: CalendarEvent = {
  id: "passe",
  title: "Événement passé",
  date: "2026-09-01",
  category: "autre",
  memberIds: ["stephane"],
};

describe("sevenDayWindow", () => {
  it("renvoie 7 jours consécutifs à partir d'aujourd'hui", () => {
    expect(window7).toEqual([
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ]);
  });

  it("passe correctement d'un mois à l'autre", () => {
    expect(sevenDayWindow("2026-09-28")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });
});

describe("expandEvents", () => {
  it("garde les événements ponctuels situés dans la fenêtre", () => {
    const result = expandEvents([pediatre, passe], window7);
    expect(result.map((event) => event.title)).toEqual(["Pédiatre"]);
  });

  it("répète un événement hebdomadaire le bon jour de la semaine", () => {
    const result = expandEvents([natation], sevenDayWindow("2026-09-15"));
    // Le samedi suivant le 15 septembre 2026 est le 19.
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-09-19");
  });

  it("ne fait pas remonter une récurrence avant sa date de départ", () => {
    const result = expandEvents([natation], sevenDayWindow("2026-09-01"));
    expect(result).toHaveLength(0);
  });
});

describe("eventsForDay", () => {
  const events = expandEvents([natation, pediatre], window7);

  it("trie les événements par heure", () => {
    const journee = eventsForDay(
      [
        { ...pediatre, date: "2026-09-11", startTime: "16:00" },
        { ...pediatre, id: "matin", date: "2026-09-11", startTime: "08:00" },
      ],
      "2026-09-11",
    );
    expect(journee.map((event) => event.startTime)).toEqual(["08:00", "16:00"]);
  });

  it("filtre sur un membre de la famille", () => {
    expect(eventsForDay(events, "2026-09-15", "ernestine")).toHaveLength(1);
    expect(eventsForDay(events, "2026-09-15", "stephane")).toHaveLength(0);
  });
});

describe("nextEventForMember", () => {
  it("renvoie le prochain rendez-vous à venir", () => {
    const events = expandEvents([natation, pediatre], window7);
    const next = nextEventForMember(events, "khloe", "2026-09-11");
    expect(next?.title).toBe("Cours de natation");
  });

  it("ne renvoie rien quand le membre n'a aucun rendez-vous", () => {
    const events = expandEvents([natation], window7);
    expect(nextEventForMember(events, "stephane", "2026-09-11")).toBeUndefined();
  });
});
