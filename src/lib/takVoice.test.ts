import { describe, expect, it } from "vitest";
import { speakableText } from "./takVoice";

describe("speakableText", () => {
  it("lit les heures et ignore emojis et liens", () => {
    expect(speakableText("🏊 Natation samedi à 19:00 ! https://maps.example")).toBe("Natation samedi à 19 heures !");
    expect(speakableText("École à 08:30")).toBe("École à 8 heures 30");
  });
});
