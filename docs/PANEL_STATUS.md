# وضعیت پنل همه‌کاره هومبان (CRM + CMS)

آخرین به‌روزرسانی: ۱۴۰۵/۰۶/۱۲

کاتالوگ کامل امکانات: [`FEATURES.md`](./FEATURES.md)

## معماری

- پنل داخل `/dashboard/*`
- نقش‌ها: `admin` | `secretary` | `doctor` | `writer` | `patient`
- بک‌اند: PocketBase — فرانت: SvelteKit 5 + Tailwind RTL
- دیپلوی: `@sveltejs/adapter-node` — `npm run build && npm run start`

## مسیرها

| مسیر | نقش‌های مجاز | وضعیت | بک‌اند |
|------|--------------|--------|--------|
| `/dashboard` | همهٔ لاگین‌شده | ✅ نقش‌محور | PB |
| `/dashboard/appointments` | admin, secretary, doctor, patient | ✅ | PB |
| `/dashboard/calendar` | admin, secretary | ✅ | PB |
| `/dashboard/desk/*` | admin, secretary | ✅ حسابداری | PB |
| `/dashboard/patients` | admin, doctor | ✅ | PB |
| `/dashboard/patients/[id]` | admin, doctor | ✅ notes/ارجاع/پیوست | PB |
| `/dashboard/doctors` | admin, secretary | ✅ | PB |
| `/dashboard/doctors/[id]` | admin, secretary | ✅ آمار واقعی نوبت/مراجع | PB |
| `/dashboard/doctors/new` | admin, secretary | ✅ | PB |
| `/dashboard/inventory` | admin, secretary | ✅ بدون mock | PB |
| `/dashboard/messages` | admin, secretary, doctor | ✅ بدون mock | PB |
| `/dashboard/services` | admin, secretary | ✅ | PB |
| `/dashboard/articles` | admin, writer, secretary | ✅ | PB |
| `/dashboard/tests` + `[id]` | writer, admin | ✅ | PB |
| `/dashboard/schedule` | doctor, admin | ✅ | PB |
| `/dashboard/admin` · `staff` | admin | ✅ | PB |
| `/dashboard/settings` | admin | ✅ SMS outbox | PB |
| `/dashboard/help` | همه | ✅ | — |
| `/dashboard/profile` | همه | ✅ + Web Push | API/PB |
| اعلان زنگوله | همه | ✅ + Push | PB realtime |
| `/appointments/book` | لاگین | ✅ زرین‌پال | API |

## امنیت (انجام‌شده)

- [x] RBAC default-deny روی `/dashboard/*`
- [x] قفل role / نوبت سرور-only / CSRF Origin / TRUST_PROXY
- [x] پروفایل فقط `/api/profile*`
- [x] مبلغ خدمت از DB · E2E امنیتی
- [x] Service Worker — API و PB کش نمی‌شوند
- [x] clinical_notes و psych_results با ACL سخت

جزئیات: [`SECURITY-FIXES.md`](./SECURITY-FIXES.md)

## زیرساخت پروداکشن

- [x] `.env.example` کامل
- [x] adapter-node + `npm run start`
- [x] CI: check + build (+ ACL اختیاری)
- [x] Redis برای production rate-limit/cache
- [x] OpenAPI `/api/docs`

## پیکربندی باقی‌مانده روی سرور زنده

این‌ها در کد آماده‌اند؛ نیاز به credential/زمان‌بند دارند:

- [ ] `ZARINPAL_MERCHANT_ID` production
- [ ] SMS.ir production key + خط اختصاصی
- [ ] Cron یادآوری ۲۴h (`CRON_SECRET` + Task Scheduler)
- [ ] `REDIS_URL` / `VAPID_*` / اختیاری `SENTRY_DSN`

## فازها

| فاز | وضعیت |
|-----|--------|
| CRM + CMS + RBAC | ✅ |
| Desk + حسابداری + زرین‌پال | ✅ |
| اعلان in-app + Web Push | ✅ |
| Psych NEO/generic سرور-side | ✅ |
| سخت‌گیری امنیتی فاز ۲–۴ | ✅ |
| کیفیت/عملکرد (کش، fields، حذف mock داغ) | ✅ |
| ترجیحات اعلان کاربر | ⬜ backlog |

## QA محلی

```bash
npm run check
npm run test
npm run e2e
npm run verify:acl   # نیاز PB روشن + .env
npm run build
```
