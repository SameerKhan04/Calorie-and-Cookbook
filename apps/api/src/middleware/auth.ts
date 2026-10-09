import type { MiddlewareHandler } from "hono";
import { ApiError } from "../errors.js";

export type AuthVariables = {
  userId: string;
};

/**
 * V1 auth: accepts `Bearer test:<userId>` for local/dev/tests.
 * When SUPABASE_JWT_SECRET is set later, verify real JWTs here without changing routes.
 */
export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (
  c,
  next,
) => {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const token = header.slice("Bearer ".length).trim();
  const testMatch = /^test:([A-Za-z0-9_-]+)$/.exec(token);
  if (!testMatch) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
  }

  c.set("userId", testMatch[1]!);
  await next();
};
