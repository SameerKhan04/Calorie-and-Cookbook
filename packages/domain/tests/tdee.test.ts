import { describe, expect, it } from "vitest";
import { suggestTargets } from "../src/tdee.js";

describe("suggestTargets", () => {
  it("suggests a calorie deficit plan for weight loss", () => {
    const plan = suggestTargets({
      sex: "male",
      ageYears: 30,
      heightCm: 180,
      weightKg: 90,
      activity: "moderate",
      goal: "lose",
    });

    expect(plan.bmrKcal).toBeGreaterThan(1500);
    expect(plan.tdeeKcal).toBeGreaterThan(plan.bmrKcal);
    expect(plan.calorieTargetKcal).toBeLessThan(plan.tdeeKcal);
    expect(plan.macros.proteinG + plan.macros.carbsG + plan.macros.fatG).toBeGreaterThan(0);
    expect(plan.calorieTargetKj).toBeCloseTo(plan.calorieTargetKcal * 4.184, 0);
  });

  it("suggests a surplus for weight gain", () => {
    const plan = suggestTargets({
      sex: "female",
      ageYears: 25,
      heightCm: 165,
      weightKg: 55,
      activity: "light",
      goal: "gain",
    });

    expect(plan.calorieTargetKcal).toBeGreaterThan(plan.tdeeKcal);
  });

  it("matches maintenance to TDEE", () => {
    const plan = suggestTargets({
      sex: "male",
      ageYears: 40,
      heightCm: 175,
      weightKg: 80,
      activity: "sedentary",
      goal: "maintain",
    });

    expect(plan.calorieTargetKcal).toBe(plan.tdeeKcal);
  });

  it("rejects invalid body metrics", () => {
    expect(() =>
      suggestTargets({
        sex: "male",
        ageYears: 0,
        heightCm: 180,
        weightKg: 80,
        activity: "moderate",
        goal: "maintain",
      }),
    ).toThrow(/age/i);
  });
});
