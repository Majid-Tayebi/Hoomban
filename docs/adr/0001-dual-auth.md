# ADR 0001 — Dual authentication (httpOnly cookie + PocketBase token)

## Status
Accepted (2026-09)

## Context
The app uses PocketBase for data and SvelteKit for BFF/API. Some UI still talks to PocketBase from the browser (lists, profile updates). Server routes need a stable session for SSR guards.

## Decision
1. **Canonical session:** `hoomban_auth` httpOnly cookie (see `src/lib/server/session.ts`).
2. **Browser PB client:** in-memory `BaseAuthStore` only — **no localStorage** (`src/lib/pocketbase.ts`).
3. On load, `hydrateAuthFromSession()` calls `GET /api/auth/session` with credentials and fills memory store.
4. Mutating clinic operations (appointments, payments, psych submit) go through `/api/*` with server `getAdminPb()` or user token validation.

## Consequences
- XSS can still read an in-memory token during the tab lifetime, but not a long-lived localStorage token after reload.
- Prefer moving remaining direct PB writes to `/api` over time.
- Never enable `DEV_DEMO_AUTH` in production (`startup-guards.ts`).
