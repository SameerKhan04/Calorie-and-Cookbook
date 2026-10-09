import { describe, expect, it } from "vitest";
import { authHeader, createTestApp, sampleOnboarding } from "./helpers.js";
import type { CatalogFood } from "../src/services/food-catalog.js";

const oats: CatalogFood = {
  id: "off-oats",
  name: "Rolled oats",
  brand: "Coles",
  barcode: "9300601001234",
  servingLabel: "40 g",
  servingGrams: 40,
  caloriesKcal: 150,
  proteinG: 5,
  carbsG: 27,
  fatG: 3,
  source: "open_food_facts",
};

async function onboard(app: ReturnType<typeof createTestApp>, userId = "user-a") {
  await app.request("/v1/onboarding", {
    method: "POST",
    headers: {
      ...authHeader(userId),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sampleOnboarding),
  });
}

describe("foods routes", () => {
  it("searches catalog foods and merges custom foods", async () => {
    const app = createTestApp({
      catalog: {
        async search(q) {
          return q.toLowerCase().includes("oat") ? [oats] : [];
        },
        async byBarcode() {
          return null;
        },
      },
    });
    await onboard(app);

    const create = await app.request("/v1/foods", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Overnight oats",
        servingLabel: "1 jar",
        servingGrams: 250,
        caloriesKcal: 320,
        proteinG: 18,
        carbsG: 40,
        fatG: 8,
        bookmarked: true,
      }),
    });
    expect(create.status).toBe(201);

    const res = await app.request("/v1/foods/search?q=oats", {
      headers: authHeader("user-a"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.some((f: { name: string }) => f.name === "Overnight oats")).toBe(
      true,
    );
    expect(body.items.some((f: { name: string }) => f.name === "Rolled oats")).toBe(true);
  });

  it("looks up barcode and falls back when catalog misses", async () => {
    const app = createTestApp({
      catalog: {
        async search() {
          return [];
        },
        async byBarcode(code) {
          return code === oats.barcode ? oats : null;
        },
      },
    });
    await onboard(app);

    const hit = await app.request("/v1/foods/barcode/9300601001234", {
      headers: authHeader("user-a"),
    });
    expect(hit.status).toBe(200);
    expect((await hit.json()).food.name).toBe("Rolled oats");

    const miss = await app.request("/v1/foods/barcode/0000000000000", {
      headers: authHeader("user-a"),
    });
    expect(miss.status).toBe(404);
    expect((await miss.json()).error.code).toBe("FOOD_NOT_FOUND");
  });

  it("returns FEATURE_DEGRADED when catalog search throws, still returning custom foods", async () => {
    const app = createTestApp({
      catalog: {
        async search() {
          throw new Error("OFF down");
        },
        async byBarcode() {
          return null;
        },
      },
    });
    await onboard(app);
    await app.request("/v1/foods", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Custom oats",
        servingLabel: "1 cup",
        servingGrams: 80,
        caloriesKcal: 300,
        proteinG: 10,
        carbsG: 50,
        fatG: 5,
      }),
    });

    const res = await app.request("/v1/foods/search?q=oats", {
      headers: authHeader("user-a"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.degraded).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].name).toBe("Custom oats");
  });

  it("bookmarks and lists recents", async () => {
    const app = createTestApp();
    await onboard(app);
    const created = await app.request("/v1/foods", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Greek yogurt",
        servingLabel: "170 g",
        servingGrams: 170,
        caloriesKcal: 100,
        proteinG: 17,
        carbsG: 6,
        fatG: 0,
        bookmarked: true,
      }),
    });
    const food = (await created.json()).food;

    const bookmarks = await app.request("/v1/foods/bookmarks", {
      headers: authHeader("user-a"),
    });
    expect(bookmarks.status).toBe(200);
    expect((await bookmarks.json()).items[0].id).toBe(food.id);
  });

  it("does not leak another user's custom foods", async () => {
    const app = createTestApp();
    await onboard(app, "user-a");
    await onboard(app, "user-b");
    await app.request("/v1/foods", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Secret shake",
        servingLabel: "1",
        servingGrams: 100,
        caloriesKcal: 200,
        proteinG: 20,
        carbsG: 10,
        fatG: 5,
      }),
    });

    const res = await app.request("/v1/foods/search?q=Secret", {
      headers: authHeader("user-b"),
    });
    const body = await res.json();
    expect(body.items).toHaveLength(0);
  });
});
