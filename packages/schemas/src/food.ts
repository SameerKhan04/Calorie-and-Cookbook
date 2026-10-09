import { z } from "zod";

export const MealSlotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const MacroTargetsSchema = z.object({
  caloriesKcal: z.number().min(800).max(10000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(500),
});

export const CustomFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120).nullable().optional().default(null),
  barcode: z.string().trim().min(4).max(32).nullable().optional().default(null),
  servingLabel: z.string().trim().min(1).max(60),
  servingGrams: z.number().positive().max(5000),
  caloriesKcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(500),
  bookmarked: z.boolean().optional().default(false),
});

export const DiaryEntryCreateSchema = z.object({
  foodId: z.string().uuid(),
  loggedAt: z.string().datetime(),
  mealSlot: MealSlotSchema,
  quantity: z.number().positive().max(50),
  notes: z.string().trim().max(280).optional(),
});

export const DiaryEntryUpdateSchema = z
  .object({
    mealSlot: MealSlotSchema.optional(),
    quantity: z.number().positive().max(50).optional(),
    notes: z.string().trim().max(280).nullable().optional(),
    loggedAt: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const FoodSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const BarcodeLookupSchema = z.object({
  barcode: z.string().trim().min(4).max(32),
});

export type CustomFoodInput = z.infer<typeof CustomFoodSchema>;
export type DiaryEntryCreateInput = z.infer<typeof DiaryEntryCreateSchema>;
export type MacroTargetsInput = z.infer<typeof MacroTargetsSchema>;
