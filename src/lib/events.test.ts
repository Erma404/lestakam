import { describe, expect, it } from "vitest";
import {
  eventTimeSpan,
  eventsForDay,
  expandEvents,
  layoutOverlapping,
  nextEventForMember,
  sevenDayWindow,
  timeToMinutes,
} from "./events";
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

describe("timeToMinutes", () => {
  it("convertit une heure en minutes depuis minuit", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:45")).toBe(1425);
  });
});

describe("eventTimeSpan", () => {
  it("utilise l'heure de fin quand elle est donnée", () => {
    expect(eventTimeSpan({ ...natation, startTime: "10:00", endTime: "11:30" })).toEqual({
      startMin: 600,
      endMin: 690,
    });
  });

  it("donne une durée par défaut d'une heure sans heure de fin", () => {
    expect(eventTimeSpan({ ...natation, startTime: "10:00", endTime: undefined })).toEqual({
      startMin: 600,
      endMin: 660,
    });
  });

  it("place un événement sans heure au tout début de la journée", () => {
    expect(eventTimeSpan({ ...natation, startTime: undefined, endTime: undefined })).toEqual({
      startMin: 0,
      endMin: 60,
    });
  });
});

describe("layoutOverlapping", () => {
  it("garde une seule colonne pour des événements qui ne se chevauchent pas", () => {
    const result = layoutOverlapping([
      { id: "a", startMin: 540, endMin: 600 },
      { id: "b", startMin: 600, endMin: 660 },
    ]);
    expect(result.every((entry) => entry.columns === 1 && entry.column === 0)).toBe(true);
  });

  it("répartit deux événements qui se chevauchent sur deux colonnes", () => {
    const result = layoutOverlapping([
      { id: "a", startMin: 540, endMin: 630 },
      { id: "b", startMin: 570, endMin: 600 },
    ]);
    const a = result.find((entry) => entry.event.id === "a");
    const b = result.find((entry) => entry.event.id === "b");
    expect(a?.columns).toBe(2);
    expect(b?.columns).toBe(2);
    expect(a?.column).not.toBe(b?.column);
  });

  it("ouvre un nouveau groupe après la fin d'un chevauchement", () => {
    const result = layoutOverlapping([
      { id: "a", startMin: 540, endMin: 600 },
      { id: "b", startMin: 550, endMin: 590 },
      { id: "c", startMin: 700, endMin: 730 },
    ]);
    const c = result.find((entry) => entry.event.id === "c");
    expect(c?.columns).toBe(1);
    expect(c?.column).toBe(0);
  });
});
