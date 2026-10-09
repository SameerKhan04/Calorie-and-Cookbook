import { z } from "zod";

export const SexSchema = z.enum(["male", "female"]);
export const ActivitySchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
export const GoalSchema = z.enum(["lose", "maintain", "gain"]);
export const UnitsSchema = z.enum(["metric", "imperial"]);

export const OnboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  sex: SexSchema,
  ageYears: z.number().int().min(1).max(120),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(400),
  activity: ActivitySchema,
  goal: GoalSchema,
  mealsPerDay: z.number().int().min(1).max(8),
  units: UnitsSchema.default("metric"),
  dietTags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  preferredRetailers: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  equipment: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  budgetAudPerWeek: z.number().min(0).max(5000).optional(),
  aiPhotoConsent: z.boolean().default(false),
});

export const ProfileUpdateSchema = OnboardingSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
