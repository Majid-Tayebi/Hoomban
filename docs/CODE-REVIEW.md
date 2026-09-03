# گزارش بررسی پروژه هومبان

**تاریخ:** 1405/06/12 (بازبینی انتقادات صریح)  
**دامنه:** امنیت، معماری، کیفیت کد، عملکرد، سئو، قابلیت توسعه  

> وضعیت به‌روز محصول و مقایسه کارفرما: [`FEATURES.md`](./FEATURES.md) · [`WHY-NOT-WORDPRESS.md`](./WHY-NOT-WORDPRESS.md) · [`README.md`](../README.md)

---

## نمره کلی (زمان نگارش این گزارش): ۸.۳ از ۱۰

| حوزه                  | نمره   | روند |
| --------------------- | ------ | ---- |
| امنیت                 | ۸.۵/۱۰ | CSP nonce فعال (بدون unsafe-inline دستی) |
| معماری و ماژولار بودن | ۸.۵/۱۰ | generic نزدیک‌تر به neo؛ profile استخراج شد |
| کیفیت کد              | ۸/۱۰   | Vitest ۱۷ تست |
| سئو                   | ۸/۱۰   | SeoHead روی همه صفحات عمومی کلیدی |
| تست و DevOps          | ۸/۱۰   | E2E با storageState + auth.setup |
| مستندسازی             | ۸/۱۰   | OpenAPI + docs index (بعداً FEATURES / WHY-NOT-WORDPRESS اضافه شد) |

---

## ۸. بازبینی انتقادات صریح

| انتقاد | وضعیت قبل | اقدام / وضعیت فعلی |
|--------|-----------|-------------------|
| **ناهمگونی psych (generic MVP)** | generic بدون draft/result panel/server load | ✅ `GenericTestRunner` با draft؛ `GenericResultPanel`؛ `+page.server.ts`؛ submit سروری |
| **SEO نیمه‌کاره** | SeoHead فقط ۶ route | ✅ اضافه شد: `tests/[slug]`، `auth`، `appointments/book` (+ قبلی‌ها) |
| **Fat dashboard components** | `profile/+page.svelte` ۶۶۸ خط | ✅ استخراج به `lib/profile/components/profile-settings-page.svelte` |
| **E2E شکننده** | UI dev-login، بدون storageState | ✅ `e2e/auth.setup.ts` + `storageState` per role در Playwright |
| **CODE-REVIEW قدیمی** | ناهماهنگ با واقعیت | ✅ این بخش + جدول نمرات به‌روز |
| **کامنت API کم** | فقط کد پراکنده | ✅ OpenAPI spec، `/api/docs`، `src/routes/api/README.md` |
| **CSP ضعیف (unsafe-inline)** | hooks دستی با unsafe-inline | ✅ `kit.csp.mode: 'nonce'` در `svelte.config.js`؛ vite بدون override |

### باقی‌مانده (پایین‌تر)

- **dashboard fat:** `admin/staff` (~۳۴۷ خط)، `messages` (~۲۷۲) — هنوز قابل split
- **generic psych:** ویرایشگر سوالات generic در dashboard هنوز ساده‌تر از neo-test-editor است
- **E2E:** وابستگی به PocketBase dev در CI باقی است (storageState وابستگی UI را کم کرد)
- **i18n کامل:** فقط زیرساخت `fa`/`en` برای offline — کل UI فارسی است (عمدی)

---

## ۵. سئو — پوشش صفحات

| صفحه | SeoHead | noindex |
|------|---------|---------|
| `/` | ✅ | |
| `/articles`, `/articles/[slug]` | ✅ | |
| `/faq` | ✅ | |
| `/tests` | ✅ | |
| `/tests/[slug]` | ✅ | |
| `/tests/result/[id]` | ✅ | ✅ |
| `/appointments/book` | ✅ | |
| `/auth` | ✅ | ✅ |
| `/dashboard/*` | — | (پنل خصوصی) |

---

## ۴. کیفیت کد و تست

**Vitest:** ۱۷ تست (neo-240 score/parse/config، generic score، RBAC)

**Playwright E2E:** login، booking، clinical-notes، rbac، psych-submit — با `e2e/.auth/*.json`

**CI:** typecheck + build + verify:acl + e2e

---

## ۲. امنیت (خلاصه)

- RBAC دو لایه (SvelteKit + PocketBase)
- `psych_results` فقط server-side create
- CSP: `mode: 'nonce'` — **بدون** `unsafe-inline` در hooks
- Rate limit + Redis در production

---

## ۷. جمع‌بندی

| سوال | پاسخ |
|------|------|
| انتقادات برطرف شد؟ | ۷/۷ مورد اصلی — اقدام یا بهبود معنادار |
| آماده production؟ | بله با Sentry/Redis/env |
| تست پایدار؟ | بهتر از قبل؛ CI هنوز به PB نیاز دارد |

**مراجع:** `[docs/SECURITY-FIXES.md](./SECURITY-FIXES.md)` · `[docs/ARCHITECTURE.md](./ARCHITECTURE.md)` · `[src/routes/api/README.md](../src/routes/api/README.md)`
