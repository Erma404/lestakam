import { describe, expect, it } from "vitest";
import { currentStreak, levelFor } from "./gamification";

const entry = (date: string, stars = 1) => ({ id: date, ritualId: "r", date, stars });

describe("levelFor", () => {
  it("commence au niveau 1", () => {
    expect(levelFor(0)).toMatchObject({ number: 1, name: "Petite graine", progress: 0, span: 15 });
  });

  it("passe au niveau suivant au palier", () => {
    expect(levelFor(42)).toMatchObject({ number: 3, name: "Étoile filante", progress: 2, span: 40 });
  });
});

describe("currentStreak", () => {
  it("compte les jours d'affilée jusqu'à aujourd'hui", () => {
    const entries = [entry("2026-10-09"), entry("2026-10-10"), entry("2026-10-11")];
    expect(currentStreak(entries, "2026-10-11")).toBe(3);
  });

  it("ne casse pas la série avant que la journée ne commence", () => {
    const entries = [entry("2026-10-09"), entry("2026-10-10")];
    expect(currentStreak(entries, "2026-10-11")).toBe(2);
  });

  it("repart de zéro après un jour sans étoile", () => {
    expect(currentStreak([entry("2026-10-08"), entry("2026-10-10")], "2026-10-11")).toBe(1);
  });
});
