import { Hono } from "hono";
import { suggestTargets } from "@cac/domain";
import {
  MacroTargetsSchema,
  OnboardingSchema,
  ProfileUpdateSchema,
} from "@cac/schemas";
import { ApiError } from "../errors.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { AppDeps } from "../app.js";

function parseOr422<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } },
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid input", result.error.flatten());
  }
  return result.data;
}

export function profileRoutes(deps: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.post("/onboarding", async (c) => {
    const userId = c.get("userId");
    if (deps.store.profiles.has(userId)) {
      throw new ApiError(409, "ALREADY_ONBOARDED", "Profile already exists");
    }

    const input = parseOr422(OnboardingSchema, await c.req.json());
    const now = deps.now().toISOString();
    const suggested = suggestTargets(input);
    const targets = {
      userId,
      caloriesKcal: suggested.calorieTargetKcal,
      proteinG: suggested.macros.proteinG,
      carbsG: suggested.macros.carbsG,
      fatG: suggested.macros.fatG,
      source: "suggested" as const,
      updatedAt: now,
    };

    deps.store.profiles.set(userId, { ...input, userId, updatedAt: now });
    deps.store.suggested.set(userId, suggested);
    deps.store.targets.set(userId, targets);

    return c.json(
      {
        profile: deps.store.profiles.get(userId),
        targets: { ...suggested, source: "suggested" },
      },
      201,
    );
  });

  app.get("/profile", async (c) => {
    const userId = c.get("userId");
    const profile = deps.store.profiles.get(userId);
    if (!profile) throw new ApiError(404, "NOT_FOUND", "Profile not found");
    return c.json({
      profile,
      targets: deps.store.targets.get(userId),
      suggestedTargets: deps.store.suggested.get(userId),
    });
  });

  app.patch("/profile", async (c) => {
    const userId = c.get("userId");
    const existing = deps.store.profiles.get(userId);
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Profile not found");

    const patch = parseOr422(ProfileUpdateSchema, await c.req.json());
    const now = deps.now().toISOString();
    const profile = { ...existing, ...patch, userId, updatedAt: now };
    const suggested = suggestTargets(profile);
    deps.store.profiles.set(userId, profile);
    deps.store.suggested.set(userId, suggested);

    const currentTargets = deps.store.targets.get(userId);
    if (!currentTargets || currentTargets.source === "suggested") {
      deps.store.targets.set(userId, {
        userId,
        caloriesKcal: suggested.calorieTargetKcal,
        proteinG: suggested.macros.proteinG,
        carbsG: suggested.macros.carbsG,
        fatG: suggested.macros.fatG,
        source: "suggested",
        updatedAt: now,
      });
    }

    return c.json({
      profile,
      targets: deps.store.targets.get(userId),
      suggestedTargets: suggested,
    });
  });

  app.put("/targets", async (c) => {
    const userId = c.get("userId");
    if (!deps.store.profiles.has(userId)) {
      throw new ApiError(404, "NOT_FOUND", "Profile not found");
    }
    const input = parseOr422(MacroTargetsSchema, await c.req.json());
    const targets = {
      userId,
      ...input,
      source: "manual" as const,
      updatedAt: deps.now().toISOString(),
    };
    deps.store.targets.set(userId, targets);
    return c.json({ targets });
  });

  return app;
}
