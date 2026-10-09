import { Hono } from "hono";
import { z } from "zod";
import { remainingMacros, nextMealBudget } from "@cac/domain";
import { DiaryEntryCreateSchema, DiaryEntryUpdateSchema } from "@cac/schemas";
import { ApiError } from "../errors.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { AppDeps } from "../app.js";
import type { StoredDiaryEntry } from "../store/memory.js";

function parseOr422<T>(
  schema: {
    safeParse: (
      data: unknown,
    ) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } };
  },
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid input", result.error.flatten());
  }
  return result.data;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildDaySummary(deps: AppDeps, userId: string, date: string) {
  const targets = deps.store.targets.get(userId);
  if (!targets) throw new ApiError(404, "NOT_FOUND", "Targets not found");

  const profile = deps.store.profiles.get(userId);
  const entries = [...deps.store.diary.values()].filter(
    (e) => e.userId === userId && dayKey(e.loggedAt) === date,
  );

  const logged = entries.reduce(
    (acc, e) => ({
      caloriesKcal: acc.caloriesKcal + e.caloriesKcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const targetMacros = {
    caloriesKcal: targets.caloriesKcal,
    proteinG: targets.proteinG,
    carbsG: targets.carbsG,
    fatG: targets.fatG,
  };
  const remaining = remainingMacros(targetMacros, logged);
  const mealsPerDay = profile?.mealsPerDay ?? 3;
  const mealsLogged = new Set(entries.map((e) => e.mealSlot)).size;
  const mealsLeft = Math.max(0, mealsPerDay - mealsLogged);

  return {
    date,
    targets: targetMacros,
    logged,
    remaining,
    nextMealBudgetKcal: nextMealBudget(remaining.caloriesKcal, mealsLeft),
    entries,
  };
}

function scaleMacros(
  food: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  },
  quantity: number,
) {
  return {
    caloriesKcal: Math.round(food.caloriesKcal * quantity),
    proteinG: Math.round(food.proteinG * quantity * 10) / 10,
    carbsG: Math.round(food.carbsG * quantity * 10) / 10,
    fatG: Math.round(food.fatG * quantity * 10) / 10,
  };
}

function resolveFood(deps: AppDeps, userId: string, foodId: string) {
  const custom = deps.store.foods.get(foodId);
  if (custom && custom.userId === userId) return custom;
  // Catalog foods are not persisted in memory store; clients must create custom copies.
  throw new ApiError(404, "FOOD_NOT_FOUND", "Food not found");
}

export function diaryRoutes(deps: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.post("/diary", async (c) => {
    const userId = c.get("userId");
    const input = parseOr422(DiaryEntryCreateSchema, await c.req.json());
    const food = resolveFood(deps, userId, input.foodId);
    const macros = scaleMacros(food, input.quantity);
    const entry: StoredDiaryEntry = {
      id: deps.store.newId(),
      userId,
      foodId: food.id,
      foodName: food.name,
      loggedAt: input.loggedAt,
      mealSlot: input.mealSlot,
      quantity: input.quantity,
      notes: input.notes,
      ...macros,
      createdAt: deps.now().toISOString(),
    };
    deps.store.diary.set(entry.id, entry);
    const day = buildDaySummary(deps, userId, dayKey(entry.loggedAt));
    return c.json({ entry, day }, 201);
  });

  app.get("/diary", async (c) => {
    const userId = c.get("userId");
    const date = c.req.query("date") ?? deps.now().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(422, "VALIDATION_ERROR", "date must be YYYY-MM-DD");
    }
    return c.json(buildDaySummary(deps, userId, date));
  });

  app.patch("/diary/:id", async (c) => {
    const userId = c.get("userId");
    const entry = deps.store.diary.get(c.req.param("id"));
    if (!entry || entry.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Entry not found");
    }
    const patch = parseOr422(DiaryEntryUpdateSchema, await c.req.json());
    const quantity = patch.quantity ?? entry.quantity;
    const food = resolveFood(deps, userId, entry.foodId);
    const macros = scaleMacros(food, quantity);
    const updated: StoredDiaryEntry = {
      ...entry,
      ...patch,
      notes: patch.notes === null ? undefined : (patch.notes ?? entry.notes),
      quantity,
      ...macros,
    };
    deps.store.diary.set(updated.id, updated);
    return c.json({
      entry: updated,
      day: buildDaySummary(deps, userId, dayKey(updated.loggedAt)),
    });
  });

  app.delete("/diary/:id", async (c) => {
    const userId = c.get("userId");
    const entry = deps.store.diary.get(c.req.param("id"));
    if (!entry || entry.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Entry not found");
    }
    deps.store.diary.delete(entry.id);
    return c.body(null, 204);
  });

  const SyncSchema = z.object({
    entries: z
      .array(
        DiaryEntryCreateSchema.extend({
          clientId: z.string().uuid(),
        }),
      )
      .max(50),
  });

  app.post("/diary/sync", async (c) => {
    const userId = c.get("userId");
    const input = parseOr422(SyncSchema, await c.req.json());
    const created: StoredDiaryEntry[] = [];
    const duplicates: string[] = [];

    for (const item of input.entries) {
      const key = `${userId}:${item.clientId}`;
      const existingId = deps.store.clientIds.get(key);
      if (existingId) {
        duplicates.push(item.clientId);
        continue;
      }
      const food = resolveFood(deps, userId, item.foodId);
      const macros = scaleMacros(food, item.quantity);
      const entry: StoredDiaryEntry = {
        id: deps.store.newId(),
        userId,
        foodId: food.id,
        foodName: food.name,
        loggedAt: item.loggedAt,
        mealSlot: item.mealSlot,
        quantity: item.quantity,
        notes: item.notes,
        clientId: item.clientId,
        ...macros,
        createdAt: deps.now().toISOString(),
      };
      deps.store.diary.set(entry.id, entry);
      deps.store.clientIds.set(key, entry.id);
      created.push(entry);
    }

    return c.json({ created, duplicates });
  });

  return app;
}
