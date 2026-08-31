# وضعیت پنل همه‌کاره هومبان (CRM + CMS)

آخرین به‌روزرسانی: ۱۴۰۵/۰۶/۱۰

## معماری

- پنل داخل `/dashboard/*` (اپ جدا نیست)
- نقش‌ها: `admin` | `secretary` | `doctor` | `writer` | `patient`
- بک‌اند: PocketBase — فرانت: SvelteKit + Tailwind RTL (Svelte 5)
- دیپلوی: `@sveltejs/adapter-node` — `npm run build && npm run start`
- فونت: Vazirmatn — تم: پالت سبز ملایم ColorHunt (`#659287` … `#E6F2DD`)

## مسیرها

| مسیر | نقش‌های مجاز | وضعیت UI | بک‌اند |
|------|--------------|----------|--------|
| `/dashboard` | همهٔ لاگین‌شده | ✅ نقش‌محور | PB |
| `/dashboard/appointments` | admin, secretary, doctor | ✅ KPI + لیست | PB (بدون mock اجباری) |
| `/dashboard/calendar` | admin, secretary | ✅ ماه/هفته/روز | PB appointments |
| `/dashboard/desk/*` | admin, secretary | ✅ میز منشی + حسابداری | PB |
| `/dashboard/patients` | admin, doctor | ✅ بازطراحی لیست | PB |
| `/dashboard/patients/[id]` | admin, doctor | ✅ جزئیات + ویتال/دارو از PB | PB + notes |
| `/dashboard/doctors` | admin, secretary | ✅ گرید کارت | PB |
| `/dashboard/doctors/[id]` | admin, secretary | ✅ جزئیات (آمار mock) | PB |
| `/dashboard/doctors/new` | admin, secretary | ✅ افزودن متخصص | PB |
| `/dashboard/departments` | admin, secretary | ✅ KPI / نمودار | PB + fallback mock |
| `/dashboard/inventory` | admin, secretary | ✅ گرید / KPI | PB (بدون fallback mock) |
| `/dashboard/messages` | admin, secretary, doctor | ✅ اینباکس | PB (بدون fallback mock) |
| `/dashboard/services` | admin, secretary | ✅ کارت تعرفه | PB |
| `/dashboard/articles` | admin, writer, secretary | ✅ CRUD shadcn | PB |
| `/dashboard/tests` + `[id]` | admin, secretary, writer | ✅ CRUD shadcn | PB |
| `/dashboard/schedule` | doctor, admin | ✅ ساعات حضور | PB |
| `/dashboard/admin` | admin | ✅ هاب مدیریت | PB |
| `/dashboard/admin/staff` | admin | ✅ کارکنان | PB |
| `/dashboard/settings` | admin | ✅ SMS outbox | PB |
| `/dashboard/help` | همه | ✅ راهنما (شماره تست فقط dev) | — |
| `/dashboard/profile` | همه | ✅ پروفایل + push | PB |
| **اعلان‌ها (زنگوله)** | همهٔ لاگین‌شده | ✅ فاز ۰–۲ + Web Push | [`docs/NOTIFICATIONS.md`](NOTIFICATIONS.md) |
| `/appointments/book` | همه | ✅ رزرو با انتخاب متخصص | PB |

---

## امنیت (انجام‌شده اخیر)

- [x] `/api/sms/send` — auth اجباری + نقش admin/secretary
- [x] `users.create` قفل — migration `1787000023`
- [x] رمز/OTP dev فقط سرور — `dev-credentials` در `$lib/server/`
- [x] صفحه help — شماره‌های تست فقط وقتی `DEV_DEMO_AUTH` یا `dev`
- [x] RBAC default-deny — مسیرهای ناشناخته `/dashboard/*` بسته
- [x] Service Worker — API و PocketBase کش نمی‌شوند

## زیرساخت پروداکشن

- [x] `.env.example` — متغیرهای لازم
- [x] `adapter-node` + اسکریپت `npm run start`
- [x] GitHub Actions — `check` + `build` + job اختیاری ACL (`npm run verify:acl`)

---

## باقیمانده (نیاز سرور واقعی یا بعدی)

- [ ] OTP/SMS واقعی (Kavenegar)
- [ ] Cron یادآوری ۲۴h روی سرور (`CRON_SECRET` + Task Scheduler)
- [ ] `notification_preferences` (فاز ۴ اعلان‌ها)
- [ ] ویتال/آلرژی/دارو — فیلدهای JSON در `patient_profiles` (migration `1787000024`)؛ UI وقتی داده باشد
- [ ] نمودارهای جزئیات پزشک — mock fallback
- [ ] پرداخت آنلاین واقعی

---

## Env vars

کپی از `.env.example` به `.env.local` و پر کردن مقادیر. تولید VAPID: `node scripts/generate-vapid-keys.mjs`

---

## اسکریپت‌های QA محلی

```bash
npm run check          # typecheck
npm run build          # build پروداکشن
npm run verify:acl     # نیاز PocketBase روشن + .env.local
```

---

## فازها (خلاصه)

| فاز | وضعیت |
|-----|--------|
| CRM + CMS + RBAC | ✅ |
| موج UI Medlink | ✅ (عمده صفحات) |
| Desk + حسابداری | ✅ |
| اعلان in-app + realtime | ✅ |
| Web Push / PWA | ✅ (preview/build) |
| ارجاع بین متخصصین | ✅ |
| لندینگ متخصصین masonry | ✅ |
| SMS/OTP پروداکشن | ⬜ |
| Cron یادآوری | ⬜ endpoint هست |
