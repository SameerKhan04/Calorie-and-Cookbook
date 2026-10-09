import { describe, expect, it } from "vitest";
import { kcalToKj, kjToKcal } from "../src/energy.js";

describe("energy conversion", () => {
  it("converts kcal to kJ using the food-label factor 4.184", () => {
    expect(kcalToKj(100)).toBeCloseTo(418.4, 1);
  });

  it("converts kJ to kcal", () => {
    expect(kjToKcal(418.4)).toBeCloseTo(100, 1);
  });

  it("rejects negative energy values", () => {
    expect(() => kcalToKj(-1)).toThrow(/non-negative/i);
    expect(() => kjToKcal(-1)).toThrow(/non-negative/i);
  });
});
