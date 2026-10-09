import { describe, expect, it } from "vitest";
import { formatEnergy, formatMacroLine, todayDateString } from "../src/format";

describe("formatEnergy", () => {
  it("shows kcal and kJ together", () => {
    expect(formatEnergy(100)).toBe("100 kcal · 418 kJ");
  });
});

describe("formatMacroLine", () => {
  it("rounds macro grams for display", () => {
    expect(formatMacroLine(40.4, 50.6, 12.2)).toBe("P 40g · C 51g · F 12g");
  });
});

describe("todayDateString", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(todayDateString(new Date("2026-10-09T15:30:00.000Z"))).toBe("2026-10-09");
  });
});
