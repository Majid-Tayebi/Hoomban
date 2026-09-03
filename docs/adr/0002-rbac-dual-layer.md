# ADR 0002 — Dual-layer RBAC (SvelteKit + PocketBase)

## Status
Accepted (2026-09)

## Context
UI hiding is not access control. Clinic data (clinical notes, psych results, payments) must stay sealed even if a client calls PocketBase or `/api` directly.

## Decision
1. **SvelteKit:** `canAccessPath` whitelist (`src/lib/rbac.ts`) + `+layout.server.ts` / `dashboard-guards.ts` + per-route API role checks.
2. **PocketBase API rules:** collection `list/view/create/update` rules in `pocketbase/pb_migrations/*`.
3. Sensitive creates (appointments mutate, psych_results create) are **server-only** (`createRule`/`updateRule` = null); SvelteKit uses admin PB after authz.
4. Users cannot self-escalate `role` (phase-3 updateRule field lock).

## How to extend
1. Add path to `DASHBOARD_ROUTE_ACCESS` and a `require*` helper if needed.
2. Add/adjust a PocketBase migration — never only hide a nav item.
3. Run `npm run verify:acl` and add a Vitest case under `src/lib/**/*.test.ts` when logic is pure.
