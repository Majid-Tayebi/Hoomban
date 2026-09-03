# Hoomban API

Base path: `/api`

## Authentication

Most endpoints accept either:

- `Authorization: Bearer <pocketbase-jwt>` header, or
- Session cookie set by `POST /api/auth/login`

## Documentation

| Resource | URL |
|----------|-----|
| OpenAPI 3.1 JSON | `/api/openapi.json` |
| Human-readable table | `/api/docs` |

## Route groups

| Prefix | Purpose | Auth |
|--------|---------|------|
| `/api/auth/*` | Login, logout, OTP, session refresh | Mixed |
| `/api/psych/*` | Test submit (server-side scoring), question sync | Required |
| `/api/appointments/*` | Create/update appointments | Role-based |
| `/api/notifications/*` | In-app notifications | Required |
| `/api/messages/*` | Staff internal messaging | Required |
| `/api/payments/zarinpal/*` | Online payment gateway | Required |
| `/api/push/*` | Web Push subscription | Required |
| `/api/desk/*` | Secretary desk operations | Secretary/admin |
| `/api/profile/*` | Profile uniqueness checks | Required |
| `/api/cron/*` | Scheduled jobs | `CRON_SECRET` header |

## Conventions

- Errors: `{ "error": "پیام فارسی" }` with appropriate HTTP status
- Rate limiting: `429` on auth and sensitive endpoints (Redis in production)
- Psych results: **never** created client-side — use `/api/psych/generic/submit` or `/api/psych/neo-240/submit`

## Local development

```bash
# PocketBase on :8090, app on :5173
DEV_DEMO_AUTH=true npm run dev
```

Test users: `admin|doctor|secretary|writer|patient` / password `12341234`
