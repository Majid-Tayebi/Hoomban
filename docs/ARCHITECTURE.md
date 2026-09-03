# معماری هومبان

آخرین به‌روزرسانی: ۱۴۰۵/۰۶/۱۲

## نمای کلی

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (RTL / fa-IR)                 │
│  SvelteKit SSR + Client hydration · PWA SW              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│  SvelteKit (Node adapter) — BFF                          │
│  ├── +page.server.ts  — guards, data load, cache headers│
│  ├── /api/*           — auth, profile, psych, payments  │
│  ├── hooks.server.ts  — session, Origin CSRF, locals    │
│  └── cache / rate-limit (Redis یا memory)               │
└────────────────────────┬────────────────────────────────┘
                         │ PocketBase SDK (server + client)
┌────────────────────────▼────────────────────────────────┐
│  PocketBase 0.27                                         │
│  ├── Collections + API Rules (RBAC)                      │
│  ├── File storage (attachments, audio, covers)           │
│  └── Realtime (notifications)                            │
└─────────────────────────────────────────────────────────┘
```

مستندات محصول: [`FEATURES.md`](./FEATURES.md) · مقایسه با وردپرس: [`WHY-NOT-WORDPRESS.md`](./WHY-NOT-WORDPRESS.md)

## لایه‌های اپلیکیشن

### 1. Routes (`src/routes/`)

| مسیر | نقش |
|------|-----|
| `/` | لندینگ عمومی (کش‌شده) |
| `/auth` | ورود OTP / نام‌کاربری |
| `/appointments/book` | ویزارد رزرو |
| `/dashboard/*` | پنل نقش‌محور |
| `/tests/*` | کاتالوگ و اجرای آزمون |
| `/articles/*` | مجله |
| `/api/*` | BFF (auth, profile, psych, payments, cron, …) |
| `/api/docs` · `/api/openapi.json` | مستند OpenAPI |
| `/sitemap.xml` | sitemap داینامیک |

### 2. کتابخانه مشترک (`src/lib/`)

| پوشه | مسئولیت |
|------|---------|
| `auth.svelte.ts` / `rbac.ts` | state و نقش |
| `server/` | PocketBase admin، CSRF، rate-limit، profile، payments — **فقط سرور** |
| `psych/` | NEO-240 و generic scoring |
| `appointments/` · `patients/` · `desk/` | دامنه کلینیک |
| `seo/` | Schema.org، OG |
| `pocketbase-filter.ts` | escape فیلتر مشترک |

قرارداد ماژول: `components` (UI) · `services` (داده) · تست `*.test.ts` کنار ماژول.

### 3. PocketBase

مهاجرت‌ها در `pocketbase/pb_migrations/`. ACL در سطح collection — مخفی‌سازی UI کافی نیست.

**نقش‌ها:** `admin` · `secretary` · `doctor` · `writer` · `patient`

| داده | admin | secretary | doctor | writer | patient |
|------|-------|-----------|--------|--------|---------|
| clinical_notes | ✓ | ✗ | ✓ (مرتبط) | ✗ | ✗ |
| psych_results | ✓ | ✗ | ✓ (مراجع مرتبط) | ✗ | ✓ (خود) |
| psych_tests edit | ✓ مشاهده | ✗ | ✗ | ✓ | ✗ |
| users (staff) | ✓ | ✗ | ✗ | ✗ | ✗ |
| users (patients) | ✓ | ✓ | ✓ | ✗ | ✗ |
| appointments write | فقط سرور (null create/update rule) | | | | |

## جریان احراز هویت

1. `/api/auth/login` یا OTP  
2. کوکی httpOnly + توکن PB در حافظه (نه localStorage)  
3. `hooks.server.ts` → `locals.user`  
4. گارد `/dashboard` بر اساس نقش  

جزئیات: [`adr/0001-dual-auth.md`](./adr/0001-dual-auth.md) · [`adr/0002-rbac-dual-layer.md`](./adr/0002-rbac-dual-layer.md)

## آزمون‌های روان‌شناختی

```
Writer edits  →  POST /api/psych/questions/sync
Patient takes →  POST /api/psych/neo-240/submit | generic/submit
Result view   →  server load + ACL + charts
```

امتیاز **همیشه** سمت سرور است.

## پرداخت

- زرین‌پال: `/api/payments/zarinpal/request` + callback  
- مبلغ خدمت فقط با `serviceId` از PocketBase resolve می‌شود  
- Desk: `/api/desk/record-payment` با قفل/سقف مبلغ  

## SEO و کش

- `SeoHead` — OG 1200×630 (`static/images/og-default.png`)، Twitter، canonical، hreflang  
- کاور مقاله: `/api/public/article-cover/[id]` (بدون افشای پورت PB به کراولر)  
- `getCachedJson` + `publicCacheHeaders` برای لندینگ/مقالات/تست‌ها/sitemap  

## تست

| نوع | ابزار |
|-----|--------|
| Unit | Vitest — `src/lib/**/*.test.ts` |
| ACL | `npm run verify:acl` |
| E2E | Playwright — شامل `e2e/security.spec.ts` |

## متغیرهای محیطی کلیدی

| متغیر | کاربرد |
|-------|--------|
| `POCKETBASE_URL` / `PUBLIC_POCKETBASE_URL` | PB سرور / کلاینت |
| `PUBLIC_APP_URL` | canonical |
| `POCKETBASE_ADMIN_*` | عملیات admin سرور |
| `REDIS_URL` | rate-limit + cache (اجباری production) |
| `TRUST_PROXY` | اعتماد به XFF فقط پشت پروکسی واقعی |
| `ZARINPAL_*` / `SMSIR_*` / `VAPID_*` / `CRON_SECRET` | پرداخت، پیامک، push، cron |
| `DEV_DEMO_AUTH` | فقط dev — در production استارت مسدود |

فهرست کامل: `.env.example`

## تصمیم‌های طراحی

1. PocketBase به‌جای ORM جدا — Auth + ACL + فایل + سرعت  
2. RBAC دو لایه — PB rules + SvelteKit guards  
3. BFF برای نوشتن‌های حساس (نوبت، پروفایل، پرداخت، امتیاز آزمون)  
4. Batch sync سوالات NEO — کاهش round-trip  
5. کدنویسی اختصاصی به‌جای وردپرس — [`WHY-NOT-WORDPRESS.md`](./WHY-NOT-WORDPRESS.md)
