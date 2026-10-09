# V1 Task Checklist

## Phase 0
- [x] Task 1: Monorepo scaffold (Expo Router, Hono, workspaces, env example, CI)
- [x] Task 2: Design tokens + app shell (tabs/screens, Log flow)
- [x] Task 3: Schema v1 + shared Zod + SQL migration stub
- [x] Task 4: Auth middleware + session contract (test bearer + SecureStore/AsyncStorage)
- [x] Task 5: API hardening (health, CORS, Zod 422s, security headers)

## Checkpoint 0
- [x] Full test suite green
- [ ] Typecheck green (mobile Expo config may need runtime; packages+api typecheck)

## Phase 1
- [x] Task 6: Onboarding + profile update
- [x] Task 7: TDEE/macros in domain + override API
- [x] Task 8: Food search API + Today search log
- [x] Task 9: Barcode lookup path (API + Log screen)
- [x] Task 10: Custom food + bookmarks + remaining calories
- [x] Task 11: Diary CRUD + offline write queue + Today states

## Checkpoint 1 — V1
- [x] Domain + API + offline queue covered by tests
- [x] Mobile V1 screens: Welcome → Onboarding → Today → Log → You
