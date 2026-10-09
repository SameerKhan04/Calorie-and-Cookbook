import { describe, expect, it } from "vitest";
import { authHeader, createTestApp, sampleOnboarding } from "./helpers.js";

describe("profile routes", () => {
  it("creates a profile via onboarding and suggests targets", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/onboarding", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sampleOnboarding),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.profile.displayName).toBe("Sam");
    expect(body.targets.calorieTargetKcal).toBeGreaterThan(1000);
    expect(body.targets.macros.proteinG).toBeGreaterThan(0);
  });

  it("rejects invalid onboarding payloads with 422", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/onboarding", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: "" }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("updates profile fields and regenerates suggested targets when body metrics change", async () => {
    const app = createTestApp();
    await app.request("/v1/onboarding", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sampleOnboarding),
    });

    const res = await app.request("/v1/profile", {
      method: "PATCH",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weightKg: 78, goal: "maintain" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.weightKg).toBe(78);
    expect(body.profile.goal).toBe("maintain");
    expect(body.suggestedTargets.calorieTargetKcal).toBe(
      body.suggestedTargets.tdeeKcal,
    );
  });

  it("allows manual target override without changing suggested plan math", async () => {
    const app = createTestApp();
    await app.request("/v1/onboarding", {
      method: "POST",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sampleOnboarding),
    });

    const res = await app.request("/v1/targets", {
      method: "PUT",
      headers: {
        ...authHeader("user-a"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caloriesKcal: 2200,
        proteinG: 170,
        carbsG: 210,
        fatG: 70,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.targets.caloriesKcal).toBe(2200);
    expect(body.targets.source).toBe("manual");
  });
});
