import { describe, expect, it } from "vitest";
import { remainingMacros, nextMealBudget } from "../src/remaining.js";

describe("remainingMacros", () => {
  it("subtracts logged macros from targets", () => {
    const remaining = remainingMacros(
      { caloriesKcal: 2000, proteinG: 150, carbsG: 200, fatG: 65 },
      { caloriesKcal: 500, proteinG: 40, carbsG: 50, fatG: 20 },
    );

    expect(remaining).toEqual({
      caloriesKcal: 1500,
      proteinG: 110,
      carbsG: 150,
      fatG: 45,
    });
  });

  it("allows negative remaining when over target", () => {
    const remaining = remainingMacros(
      { caloriesKcal: 2000, proteinG: 150, carbsG: 200, fatG: 65 },
      { caloriesKcal: 2500, proteinG: 160, carbsG: 210, fatG: 70 },
    );

    expect(remaining.caloriesKcal).toBe(-500);
  });
});

describe("nextMealBudget", () => {
  it("splits remaining calories across remaining meals", () => {
    expect(nextMealBudget(900, 3)).toBe(300);
  });

  it("returns full remaining when one meal left", () => {
    expect(nextMealBudget(450, 1)).toBe(450);
  });

  it("returns 0 when no meals remain", () => {
    expect(nextMealBudget(450, 0)).toBe(0);
  });

  it("floors fractional budgets", () => {
    expect(nextMealBudget(100, 3)).toBe(33);
  });
});
