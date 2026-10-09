import { kcalToKj } from "./energy.js";

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export type SuggestTargetsInput = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
};

export type SuggestedTargets = {
  bmrKcal: number;
  tdeeKcal: number;
  calorieTargetKcal: number;
  calorieTargetKj: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

function mifflinStJeor(input: SuggestTargetsInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return Math.round(input.sex === "male" ? base + 5 : base - 161);
}

function macroSplit(calorieTargetKcal: number, weightKg: number) {
  const proteinG = Math.round(weightKg * 1.8);
  const fatG = Math.round((calorieTargetKcal * 0.25) / 9);
  const carbsG = Math.max(
    0,
    Math.round((calorieTargetKcal - proteinG * 4 - fatG * 9) / 4),
  );
  return { proteinG, carbsG, fatG };
}

export function suggestTargets(input: SuggestTargetsInput): SuggestedTargets {
  if (!Number.isFinite(input.ageYears) || input.ageYears < 1 || input.ageYears > 120) {
    throw new Error("ageYears must be between 1 and 120");
  }
  if (!Number.isFinite(input.heightCm) || input.heightCm < 50 || input.heightCm > 300) {
    throw new Error("heightCm must be between 50 and 300");
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 400) {
    throw new Error("weightKg must be between 20 and 400");
  }

  const bmrKcal = mifflinStJeor(input);
  const tdeeKcal = Math.round(bmrKcal * ACTIVITY_FACTOR[input.activity]);
  const calorieTargetKcal = Math.max(1200, tdeeKcal + GOAL_DELTA[input.goal]);

  return {
    bmrKcal,
    tdeeKcal,
    calorieTargetKcal,
    calorieTargetKj: Math.round(kcalToKj(calorieTargetKcal)),
    macros: macroSplit(calorieTargetKcal, input.weightKg),
  };
}
