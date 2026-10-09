import { describe, expect, it } from "vitest";
import {
  CustomFoodSchema,
  DiaryEntryCreateSchema,
  FoodSearchQuerySchema,
  MacroTargetsSchema,
} from "../src/food.js";

describe("CustomFoodSchema", () => {
  it("accepts a custom food with per-serving macros", () => {
    const food = CustomFoodSchema.parse({
      name: "Homemade biryani",
      brand: null,
      barcode: null,
      servingLabel: "1 bowl",
      servingGrams: 300,
      caloriesKcal: 520,
      proteinG: 28,
      carbsG: 60,
      fatG: 18,
      bookmarked: true,
    });

    expect(food.name).toBe("Homemade biryani");
    expect(food.bookmarked).toBe(true);
  });

  it("trims names and rejects blank names", () => {
    expect(CustomFoodSchema.safeParse({
      name: "  ",
      servingLabel: "1",
      servingGrams: 100,
      caloriesKcal: 100,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    }).success).toBe(false);
  });
});

describe("DiaryEntryCreateSchema", () => {
  it("requires a positive quantity and meal slot", () => {
    const entry = DiaryEntryCreateSchema.parse({
      foodId: "11111111-1111-4111-8111-111111111111",
      loggedAt: "2026-10-09T12:00:00.000Z",
      mealSlot: "lunch",
      quantity: 1.5,
    });

    expect(entry.quantity).toBe(1.5);
    expect(entry.mealSlot).toBe("lunch");
  });

  it("rejects zero quantity", () => {
    expect(
      DiaryEntryCreateSchema.safeParse({
        foodId: "11111111-1111-4111-8111-111111111111",
        loggedAt: "2026-10-09T12:00:00.000Z",
        mealSlot: "snack",
        quantity: 0,
      }).success,
    ).toBe(false);
  });
});

describe("FoodSearchQuerySchema", () => {
  it("requires a non-empty query", () => {
    expect(FoodSearchQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(FoodSearchQuerySchema.parse({ q: "oats" }).q).toBe("oats");
  });
});

describe("MacroTargetsSchema", () => {
  it("accepts manual target overrides", () => {
    const targets = MacroTargetsSchema.parse({
      caloriesKcal: 2100,
      proteinG: 160,
      carbsG: 200,
      fatG: 70,
    });
    expect(targets.caloriesKcal).toBe(2100);
  });
});
