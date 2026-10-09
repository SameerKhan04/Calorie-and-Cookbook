import { Hono } from "hono";
import { CustomFoodSchema, FoodSearchQuerySchema } from "@cac/schemas";
import { ApiError } from "../errors.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { AppDeps } from "../app.js";

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

export function foodRoutes(deps: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.post("/foods", async (c) => {
    const userId = c.get("userId");
    const input = parseOr422(CustomFoodSchema, await c.req.json());
    const food = {
      id: deps.store.newId(),
      userId,
      name: input.name,
      brand: input.brand ?? null,
      barcode: input.barcode ?? null,
      servingLabel: input.servingLabel,
      servingGrams: input.servingGrams,
      caloriesKcal: input.caloriesKcal,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      bookmarked: input.bookmarked ?? false,
      source: "custom" as const,
      createdAt: deps.now().toISOString(),
    };
    deps.store.foods.set(food.id, food);
    return c.json({ food }, 201);
  });

  app.get("/foods/search", async (c) => {
    const userId = c.get("userId");
    const query = parseOr422(FoodSearchQuerySchema, {
      q: c.req.query("q"),
      limit: c.req.query("limit"),
    });

    const custom = [...deps.store.foods.values()].filter(
      (f) =>
        f.userId === userId &&
        f.name.toLowerCase().includes(query.q.toLowerCase()),
    );

    let catalogItems: Awaited<ReturnType<typeof deps.catalog.search>> = [];
    let degraded = false;
    try {
      catalogItems = await deps.catalog.search(query.q, query.limit);
    } catch {
      degraded = true;
    }

    const items = [
      ...custom.map((f) => ({ ...f, source: "custom" as const })),
      ...catalogItems,
    ].slice(0, query.limit);

    return c.json({ items, degraded });
  });

  app.get("/foods/barcode/:barcode", async (c) => {
    const barcode = c.req.param("barcode");
    try {
      const food = await deps.catalog.byBarcode(barcode);
      if (!food) {
        throw new ApiError(404, "FOOD_NOT_FOUND", "No food found for barcode");
      }
      return c.json({ food });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "FEATURE_DEGRADED",
        "Barcode lookup is temporarily unavailable",
      );
    }
  });

  app.get("/foods/bookmarks", async (c) => {
    const userId = c.get("userId");
    const items = [...deps.store.foods.values()].filter(
      (f) => f.userId === userId && f.bookmarked,
    );
    return c.json({ items });
  });

  app.post("/foods/:id/bookmark", async (c) => {
    const userId = c.get("userId");
    const food = deps.store.foods.get(c.req.param("id"));
    if (!food || food.userId !== userId) {
      throw new ApiError(404, "NOT_FOUND", "Food not found");
    }
    food.bookmarked = true;
    deps.store.foods.set(food.id, food);
    return c.json({ food });
  });

  return app;
}
