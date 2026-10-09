import { describe, expect, it } from "vitest";
import { OnboardingSchema, ProfileUpdateSchema } from "../src/profile.js";

describe("OnboardingSchema", () => {
  it("accepts a complete onboarding payload", () => {
    const parsed = OnboardingSchema.parse({
      displayName: "Sam",
      sex: "male",
      ageYears: 28,
      heightCm: 178,
      weightKg: 82,
      activity: "moderate",
      goal: "lose",
      mealsPerDay: 3,
      units: "metric",
      dietTags: ["halal"],
      preferredRetailers: ["woolworths"],
      aiPhotoConsent: false,
    });

    expect(parsed.displayName).toBe("Sam");
    expect(parsed.mealsPerDay).toBe(3);
  });

  it("rejects empty display names", () => {
    const result = OnboardingSchema.safeParse({
      displayName: "  ",
      sex: "female",
      ageYears: 30,
      heightCm: 165,
      weightKg: 60,
      activity: "light",
      goal: "maintain",
      mealsPerDay: 3,
      units: "metric",
      dietTags: [],
      preferredRetailers: [],
      aiPhotoConsent: false,
    });

    expect(result.success).toBe(false);
  });

  it("defaults optional kitchen fields", () => {
    const parsed = OnboardingSchema.parse({
      displayName: "Alex",
      sex: "female",
      ageYears: 30,
      heightCm: 165,
      weightKg: 60,
      activity: "light",
      goal: "maintain",
      mealsPerDay: 3,
      units: "metric",
      dietTags: [],
      preferredRetailers: [],
      aiPhotoConsent: false,
    });

    expect(parsed.equipment).toEqual([]);
    expect(parsed.budgetAudPerWeek).toBeUndefined();
  });
});

describe("ProfileUpdateSchema", () => {
  it("allows partial updates", () => {
    const parsed = ProfileUpdateSchema.parse({ weightKg: 81, goal: "maintain" });
    expect(parsed.weightKg).toBe(81);
    expect(parsed.goal).toBe("maintain");
  });

  it("rejects empty update objects", () => {
    const result = ProfileUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
