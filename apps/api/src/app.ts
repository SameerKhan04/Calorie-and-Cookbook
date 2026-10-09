import { Hono } from "hono";
import { cors } from "hono/cors";
import { ApiError, toErrorBody } from "./errors.js";
import { requireAuth, type AuthVariables } from "./middleware/auth.js";
import { securityHeaders } from "./middleware/security.js";
import { diaryRoutes } from "./routes/diary.js";
import { foodRoutes } from "./routes/foods.js";
import { profileRoutes } from "./routes/profile.js";
import type { FoodCatalog } from "./services/food-catalog.js";
import { createStubCatalog } from "./services/food-catalog.js";
import { MemoryStore } from "./store/memory.js";

export type AppDeps = {
  store: MemoryStore;
  catalog: FoodCatalog;
  now: () => Date;
  allowedOrigins?: string[];
  version?: string;
};

export function createApp(deps?: Partial<AppDeps>) {
  const resolved: AppDeps = {
    store: deps?.store ?? new MemoryStore(),
    catalog: deps?.catalog ?? createStubCatalog(),
    now: deps?.now ?? (() => new Date()),
    allowedOrigins: deps?.allowedOrigins ?? [
      "http://localhost:8081",
      "http://localhost:19006",
    ],
    version: deps?.version ?? "0.1.0",
  };

  const app = new Hono<{ Variables: AuthVariables }>();

  app.use("*", securityHeaders);
  app.use(
    "*",
    cors({
      origin: resolved.allowedOrigins ?? [],
      credentials: true,
    }),
  );

  app.onError((error, c) => {
    const { status, body } = toErrorBody(error);
    return c.json(body, status as 400);
  });

  app.get("/v1/health", (c) =>
    c.json({
      status: "ok",
      version: resolved.version,
      time: resolved.now().toISOString(),
    }),
  );

  const protectedApi = new Hono<{ Variables: AuthVariables }>();
  protectedApi.use("*", requireAuth);
  protectedApi.route("/", profileRoutes(resolved));
  protectedApi.route("/", foodRoutes(resolved));
  protectedApi.route("/", diaryRoutes(resolved));

  app.route("/v1", protectedApi);

  app.notFound((c) => {
    throw new ApiError(404, "NOT_FOUND", "Route not found");
  });

  return app;
}
