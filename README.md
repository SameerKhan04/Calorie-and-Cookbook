# Calorie & Cookbook

Expo (Android + web) calorie tracker and meal planner. Australia-first (kJ + kcal).

## Monorepo

| Package | Role |
|---------|------|
| `apps/mobile` | Expo Router client |
| `apps/api` | Hono API |
| `packages/domain` | Pure nutrition math |
| `packages/schemas` | Shared Zod contracts |

## Commands

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @cac/api dev
pnpm --filter @cac/mobile start
```

Copy `.env.example` to `.env` for local API secrets.

## V1 scope

Onboarding, calorie/macro targets, food search + barcode, custom foods, bookmarks, Today diary, offline write queue.
