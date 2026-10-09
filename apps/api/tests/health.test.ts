import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

describe("GET /v1/health", () => {
  it("returns ok without authentication", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBeTruthy();
    expect(typeof body.time).toBe("string");
  });

  it("sets security headers", async () => {
    const app = createTestApp();
    const res = await app.request("/v1/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
