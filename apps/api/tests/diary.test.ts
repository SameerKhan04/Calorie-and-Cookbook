import { describe, expect, it } from "vitest";
import { authHeader, createTestApp, sampleOnboarding } from "./helpers.js";

async function setupUser(app: ReturnType<typeof createTestApp>) {
  await app.request("/v1/onboarding", {
    method: "POST",
    headers: {
      ...authHeader("user-a"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sampleOnboarding),
  });
  const foodRes = await app.request("/v1/foods", {
    method: "POST",
    headers: {
      ...authHeader("user-a"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Chicken rice",
      servingLabel: "1 plate",
      servingGrams: 350,
      caloriesKcal: 500,
      proteinG: 40,
      carbsG: 50,
      fatG: 12,
    }),
  });
  return (await foodRes.json()).food as { id: string };
}

describe("diary routes", () => {
  it("logs food and returns remaining macros for the day", async () => {
    const app = createTestApp();
    const food = await setupUser(app);

    const res = await app.request("/v1/diary", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        foodId: food.id,
        loggedAt: "2026-10-09T12:00:00.000Z",
        mealSlot: "lunch",
        quantity: 1,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.caloriesKcal).toBe(500);
    expect(body.day.logged.caloriesKcal).toBe(500);
    expect(body.day.remaining.caloriesKcal).toBe(body.day.targets.caloriesKcal - 500);
  });

  it("lists today's diary and supports edit/delete", async () => {
    const app = createTestApp();
    const food = await setupUser(app);
    const created = await app.request("/v1/diary", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        foodId: food.id,
        loggedAt: "2026-10-09T08:00:00.000Z",
        mealSlot: "breakfast",
        quantity: 1,
      }),
    });
    const entryId = (await created.json()).entry.id as string;

    const listed = await app.request("/v1/diary?date=2026-10-09", {
      headers: authHeader("user-a"),
    });
    expect(listed.status).toBe(200);
    expect((await listed.json()).entries).toHaveLength(1);

    const patched = await app.request(`/v1/diary/${entryId}`, {
      method: "PATCH",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: 2 }),
    });
    expect(patched.status).toBe(200);
    expect((await patched.json()).entry.caloriesKcal).toBe(1000);

    const deleted = await app.request(`/v1/diary/${entryId}`, {
      method: "DELETE",
      headers: authHeader("user-a"),
    });
    expect(deleted.status).toBe(204);

    const after = await app.request("/v1/diary?date=2026-10-09", {
      headers: authHeader("user-a"),
    });
    expect((await after.json()).entries).toHaveLength(0);
  });

  it("returns 404 (not 403) when editing another user's entry", async () => {
    const app = createTestApp();
    const food = await setupUser(app);
    const created = await app.request("/v1/diary", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        foodId: food.id,
        loggedAt: "2026-10-09T08:00:00.000Z",
        mealSlot: "breakfast",
        quantity: 1,
      }),
    });
    const entryId = (await created.json()).entry.id as string;

    await app.request("/v1/onboarding", {
      method: "POST",
      headers: {
        ...authHeader("user-b"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...sampleOnboarding, displayName: "Other" }),
    });

    const res = await app.request(`/v1/diary/${entryId}`, {
      method: "DELETE",
      headers: authHeader("user-b"),
    });
    expect(res.status).toBe(404);
  });

  it("accepts offline queue sync batches idempotently", async () => {
    const app = createTestApp();
    const food = await setupUser(app);
    const clientId = "11111111-1111-4111-8111-111111111111";

    const first = await app.request("/v1/diary/sync", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entries: [
          {
            clientId,
            foodId: food.id,
            loggedAt: "2026-10-09T09:00:00.000Z",
            mealSlot: "breakfast",
            quantity: 1,
          },
        ],
      }),
    });
    expect(first.status).toBe(200);
    expect((await first.json()).created).toHaveLength(1);

    const second = await app.request("/v1/diary/sync", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entries: [
          {
            clientId,
            foodId: food.id,
            loggedAt: "2026-10-09T09:00:00.000Z",
            mealSlot: "breakfast",
            quantity: 1,
          },
        ],
      }),
    });
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.created).toHaveLength(0);
    expect(body.duplicates).toHaveLength(1);
  });
});
