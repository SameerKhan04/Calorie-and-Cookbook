import { createApp } from "../src/app.js";
import { MemoryStore } from "../src/store/memory.js";
import type { FoodCatalog } from "../src/services/food-catalog.js";

export function authHeader(userId: string): HeadersInit {
  return { Authorization: `Bearer test:${userId}` };
}

export function createTestApp(options?: {
  catalog?: FoodCatalog;
  store?: MemoryStore;
}) {
  const store = options?.store ?? new MemoryStore();
  return createApp({
    store,
    catalog:
      options?.catalog ??
      ({
        async search() {
          return [];
        },
        async byBarcode() {
          return null;
        },
      } satisfies FoodCatalog),
    now: () => new Date("2026-10-09T12:00:00.000Z"),
  });
}

export const sampleOnboarding = {
  displayName: "Sam",
  sex: "male" as const,
  ageYears: 28,
  heightCm: 178,
  weightKg: 82,
  activity: "moderate" as const,
  goal: "lose" as const,
  mealsPerDay: 3,
  units: "metric" as const,
  dietTags: ["halal"],
  preferredRetailers: ["woolworths"],
  aiPhotoConsent: false,
};
