# Implementation Plan: Calorie & Cookbook (V1)

## Overview

Expo (Android + web) + Hono API + shared Zod/domain packages. V1 ships the diary vertical slice: onboarding, targets, search/barcode log, bookmarks, custom foods, Today diary, offline queue. Security and degradation are built into foundations.

## Architecture Decisions

- pnpm workspaces monorepo: `apps/mobile`, `apps/api`, `packages/domain`, `packages/schemas`
- Vitest for unit/API tests; TDD for all domain and API behaviour
- In-memory stores + fakes in tests so CI needs no live Supabase/OFF
- Nutrition truth: Open Food Facts + custom foods; AI deferred to V2
- Domain math (TDEE, remaining macros) is pure and unit-tested

## Task List

### Phase 0: Foundation
- [ ] Task 1: Monorepo scaffold + Vitest + CI scripts
- [ ] Task 2: Design tokens + app shell stubs
- [ ] Task 3: Shared Zod schemas + SQL migration stubs + RLS notes
- [ ] Task 4–5: Auth middleware contract + API hardening (health, headers, rate-limit stub)

### Checkpoint 0
- [ ] Tests pass, types check, unauthenticated diary routes rejected

### Phase 1: V1 Diary
- [ ] Task 6: Onboarding + profile schemas/API
- [ ] Task 7: TDEE/macro suggestion + manual override (domain)
- [ ] Task 8: Food search (custom + OFF with timeout fallback)
- [ ] Task 9: Barcode → lookup → confirm → diary
- [ ] Task 10: Custom food + bookmarks/recents + remaining macros
- [ ] Task 11: Today UI states + offline/delete + offline queue

### Checkpoint 1 — V1 ship
- [ ] User can onboard, log food (search/barcode/custom), see remaining energy, bookmark, change targets; offline queue works

## Risks
- Free OFF outages → cache + custom food fallback
- No live Supabase in local tests → memory repository; wire real Supabase via env later

## Open Questions
- Product display name (using Calorie & Cookbook for now)
