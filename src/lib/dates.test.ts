import { describe, expect, it } from "vitest";
import {
  addDays,
  currentMoment,
  formatDateRangeMonth,
  formatDayNumber,
  formatLongDate,
  formatMonthYear,
  formatRelativeDay,
  formatWeekdayShort,
  monthGridDays,
  nextSevenDays,
  shiftMonth,
  startOfMonth,
  startOfWeek,
  toDateKey,
  todayKey,
  weekDays,
} from "./dates";

describe("clés de date", () => {
  it("formate une date sur le fuseau horaire du foyer", () => {
    // 23h30 UTC le 10 septembre correspond déjà au 11 septembre à Paris.
    expect(toDateKey(new Date("2026-09-10T23:30:00Z"))).toBe("2026-09-11");
  });

  it("avance et recule d'un nombre de jours", () => {
    expect(addDays("2026-09-11", 1)).toBe("2026-09-12");
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("gère le changement d'heure d'été sans décalage", () => {
    // Le changement d'heure en France a lieu le 25 octobre 2026.
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("donne toujours 7 jours consécutifs", () => {
    const days = nextSevenDays(todayKey());
    expect(days).toHaveLength(7);
    expect(new Set(days).size).toBe(7);
  });
});

describe("libellés en français", () => {
  it("écrit la date en toutes lettres", () => {
    expect(formatLongDate("2026-09-11")).toBe("vendredi 11 septembre");
  });

  it("abrège le jour de la semaine pour la bande des 7 jours", () => {
    expect(formatWeekdayShort("2026-09-12")).toBe("SAM");
    expect(formatDayNumber("2026-09-12")).toBe("12");
  });

  it("dit « Aujourd'hui » et « Demain »", () => {
    expect(formatRelativeDay("2026-09-11", "2026-09-11")).toBe("Aujourd'hui");
    expect(formatRelativeDay("2026-09-12", "2026-09-11")).toBe("Demain");
    expect(formatRelativeDay("2026-09-14", "2026-09-11")).toBe("Lundi 14");
  });
});

describe("startOfWeek", () => {
  it("renvoie le lundi de la semaine, un vendredi", () => {
    // Le 11 septembre 2026 est un vendredi.
    expect(startOfWeek("2026-09-11")).toBe("2026-09-07");
  });

  it("renvoie la date elle-même un lundi", () => {
    expect(startOfWeek("2026-09-07")).toBe("2026-09-07");
  });

  it("passe correctement d'un dimanche au lundi précédent", () => {
    // Le 13 septembre 2026 est un dimanche.
    expect(startOfWeek("2026-09-13")).toBe("2026-09-07");
  });
});

describe("weekDays", () => {
  it("renvoie les 7 jours de lundi à dimanche", () => {
    expect(weekDays("2026-09-11")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });
});

describe("startOfMonth", () => {
  it("renvoie le premier jour du mois", () => {
    expect(startOfMonth("2026-09-11")).toBe("2026-09-01");
  });
});

describe("shiftMonth", () => {
  it("avance d'un mois", () => {
    expect(shiftMonth("2026-09-11", 1)).toBe("2026-10-01");
  });

  it("recule d'un mois", () => {
    expect(shiftMonth("2026-09-11", -1)).toBe("2026-08-01");
  });

  it("ne dérive pas sur un mois plus court", () => {
    // 31 janvier + 1 mois ne doit pas déborder sur mars.
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("monthGridDays", () => {
  it("renvoie 42 jours en commençant un lundi", () => {
    const days = monthGridDays("2026-09-11");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-08-31");
    expect(days[days.length - 1]).toBe("2026-10-11");
  });
});

describe("formatMonthYear", () => {
  it("formate le mois et l'année en toutes lettres", () => {
    expect(formatMonthYear("2026-09-11")).toBe("septembre 2026");
  });
});

describe("formatDateRangeMonth", () => {
  it("donne un seul mois quand toute la fenêtre y tient", () => {
    expect(formatDateRangeMonth(weekDays("2026-09-11"))).toBe("Septembre 2026");
  });

  it("combine les deux mois quand la fenêtre chevauche", () => {
    // Semaine du 28 septembre au 4 octobre 2026.
    expect(formatDateRangeMonth(weekDays("2026-09-30"))).toBe("Sept. – Octobre 2026");
  });
});

describe("currentMoment", () => {
  it("découpe la journée en matin, après-midi et soir", () => {
    expect(currentMoment(new Date("2026-09-11T06:00:00Z"))).toBe("matin");
    expect(currentMoment(new Date("2026-09-11T13:00:00Z"))).toBe("apres-midi");
    expect(currentMoment(new Date("2026-09-11T19:00:00Z"))).toBe("soir");
  });
});
