# راهنمای توسعه هومبان

برای تازه‌واردها — قبل از تغییر دامنه حساس این‌ها را بخوانید.

## اسناد کلیدی

| سند | موضوع |
|-----|--------|
| [README.md](../README.md) | راه‌اندازی دوزبانه |
| [FEATURES.md](./FEATURES.md) | کاتالوگ امکانات |
| [WHY-NOT-WORDPRESS.md](./WHY-NOT-WORDPRESS.md) | استدلال محصول برای کارفرما |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | لایه‌ها و جریان‌ها |
| [adr/0001-dual-auth.md](./adr/0001-dual-auth.md) | session cookie + PB token |
| [adr/0002-rbac-dual-layer.md](./adr/0002-rbac-dual-layer.md) | RBAC دو لایه |
| [SECURITY-FIXES.md](./SECURITY-FIXES.md) | تاریخچه اصلاحات امنیتی |
| [NOTIFICATIONS.md](./NOTIFICATIONS.md) | اعلان و Push |
| [PANEL_STATUS.md](./PANEL_STATUS.md) | وضعیت ماژول‌های پنل |

## قرارداد ماژول‌ها (`src/lib/`)

- `*/components` — UI فقط (props + callbacks؛ بدون admin PB)
- `*/services` — واکشی/نوشتن داده
- `server/` — **فقط سرور** (هرگز از کلاینت import نشود)
- `seo/` — متا و JSON-LD
- فیلتر PB: `$lib/pocketbase-filter` (`escapeFilterValue`)
- تست واحد کنار ماژول: `*.test.ts`
- UI: فقط Tailwind + shadcn-svelte + lucide — بدون `<style>` خام

## امنیت (چک‌لیست کوتاه)

- مبلغ پرداخت خدمت فقط از DB با `serviceId`
- ویرایش پروفایل فقط از `/api/profile` (نه `users.update` در کلاینت)
- نوبت create/update فقط سرور
- Origin check روی `/api`های mutating در `hooks.server.ts`
- IP برای rate-limit فقط با `TRUST_PROXY=true` از هدر پروکسی
- Secrets با `timingSafeEqualString`
- OG پیش‌فرض: `static/images/og-default.png` — `node scripts/generate-og-banner.mjs`
- بعد از تغییر migration: PocketBase را migrate و serve کنید (خودکار توسط agent طبق قانون پروژه)

## Svelte

- Svelte 5 runes؛ قبل از تحویل کامپوننت از svelte-autofixer استفاده کنید
- `goto(resolve('/path'))` با `resolve` از `$app/paths`

## دستورهای مفید

```bash
npm run check
npm run test
npm run verify:acl
npm run e2e
npm run build && npm run start
```
