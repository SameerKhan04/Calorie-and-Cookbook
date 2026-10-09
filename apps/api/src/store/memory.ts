import { randomUUID } from "node:crypto";
import type { OnboardingInput, MacroTargetsInput } from "@cac/schemas";
import type { SuggestedTargets } from "@cac/domain";

export type StoredProfile = OnboardingInput & {
  userId: string;
  updatedAt: string;
};

export type StoredTargets = MacroTargetsInput & {
  userId: string;
  source: "suggested" | "manual";
  updatedAt: string;
};

export type StoredFood = {
  id: string;
  userId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  servingLabel: string;
  servingGrams: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bookmarked: boolean;
  source: "custom";
  createdAt: string;
};

export type StoredDiaryEntry = {
  id: string;
  userId: string;
  foodId: string;
  foodName: string;
  loggedAt: string;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
  quantity: number;
  notes?: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  clientId?: string;
  createdAt: string;
};

export class MemoryStore {
  profiles = new Map<string, StoredProfile>();
  targets = new Map<string, StoredTargets>();
  suggested = new Map<string, SuggestedTargets>();
  foods = new Map<string, StoredFood>();
  diary = new Map<string, StoredDiaryEntry>();
  clientIds = new Map<string, string>(); // `${userId}:${clientId}` -> entryId

  newId(): string {
    return randomUUID();
  }
}
