import { describe, expect, it } from "vitest";
import { createTestApp, authHeader } from "./helpers.js";

describe("auth middleware", () => {
  it("rejects protected routes without a bearer token", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/profile");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects invalid bearer tokens", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/profile", {
      headers: { Authorization: "Bearer not-valid" },
    });
    expect(res.status).toBe(401);
  });

  it("allows access with a valid test token", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/profile", {
      headers: authHeader("user-a"),
    });
    // No profile yet → 404, but authenticated
    expect(res.status).toBe(404);
  });
});
