# اصلاحات امنیتی — فاز ۲

**تاریخ:** 1405/06/11  
**Migration:** `pocketbase/pb_migrations/1787000036_security_hardening_phase2.js`

> نمای محصول و استدلال کارفرما: [`FEATURES.md`](./FEATURES.md) · [`WHY-NOT-WORDPRESS.md`](./WHY-NOT-WORDPRESS.md)

---

## فاز ۳ (۱۴۰۵/۰۶/۱۲)

**Migration:** `1787000039_security_hardening_phase3.js`

| # | موضوع | راه‌حل |
|---|--------|--------|
| 1 | ارتقای نقش توسط خود کاربر | `users.updateRule` قفل `role` / `verified` / `emailVisibility` |
| 2 | ایجاد/ویرایش مستقیم نوبت در PB | `appointments` create/update فقط سرور (null rules) |
| 3 | CSRF Origin | `hooks.server.ts` + `csrf-origin.ts` |
| 4 | دور زدن rate-limit با XFF | فقط با `TRUST_PROXY=true` |
| 5 | مقایسه CRON_SECRET | `timingSafeEqualString` |
| 6 | توکن در localStorage | `BaseAuthStore` حافظه‌ای |
| 7 | مبلغ desk / SMS آزاد | سقف و قفل expected؛ SMS آزاد فقط admin |

---

## فاز ۴ (۱۴۰۵/۰۶/۱۲)

| # | موضوع | راه‌حل |
|---|--------|--------|
| 1 | ویرایش پروفایل از کلاینت PB | فقط `/api/profile` (+ avatar/password) — بدون `users.update` در UI |
| 2 | OG روی پورت PB | بنر `static/images/og-default.png` (1200×630) + پروکسی `/api/public/article-cover/[id]` |
| 3 | mock پیام/انبار | حذف mock؛ خالی در خطا |
| 4 | E2E امنیتی | `e2e/security.spec.ts` — ارتقای نقش، مبلغ پرداخت، CSRF Origin |

---

## خلاصه ۶ اصلاح (فاز ۲)


| #   | موضوع                  | راه‌حل                                                                     |
| --- | ---------------------- | -------------------------------------------------------------------------- |
| 1   | ACL کاربران برای منشی  | منشی فقط `role = 'patient'` را می‌بیند (مراجعان + شماره تماس برای هماهنگی) |
| 2   | Enumeration موبایل     | `/api/profile/check-unique` نیاز به احراز هویت + rate limit                |
| 3   | `psych_results` گسترده | بیمار=fقط خودش؛ admin=همه؛ پزشک=بیماران با نوبت مشترک؛ منشی=بدون دسترسی    |
| 4   | URL PocketBase         | `PUBLIC_POCKETBASE_URL` در کلاینت                                          |
| 5   | Brute-force login      | rate limit روی `/api/auth/login`                                           |
| 6   | دستکاری امتیاز NEO     | اعتبارسنجی و محاسبه در سرور (`/api/psych/neo-240/submit`)                  |


---



## ۱. ACL کاربران — منشی و مراجعان



### قبل

منشی می‌توانست **همه** رکوردهای `users` (شامل admin، doctor، writer) را لیست کند.

### بعد

```
id = @request.auth.id
|| @request.auth.role = 'admin'
|| (@request.auth.role = 'secretary' && role = 'patient')
|| (@request.auth.role = 'doctor' && role = 'patient')
```

- **منشی:** دسترسی به همه مراجعان (`role = patient`) برای جستجو و تماس
- **منشی:** بدون دسترسی به پروفایل staff/admin/doctor
- **پزشک:** فقط بیماران، نه سایر نقش‌ها

---



## ۲. check-unique

- `401` بدون Bearer token معتبر
- rate limit: ۳۰ درخواست / ۱۵ دقیقه per IP
- فقط کاربران احراز هویت‌شده (ویرایش پروفایل)

---



## ۳. psych_results

```
user = @request.auth.id
|| @request.auth.role = 'admin'
|| (@request.auth.role = 'doctor'
    && @collection.appointments.patient ?= user.id
    && @collection.appointments.doctor.user ?= @request.auth.id)
```

- **createRule:** `user = @request.auth.id` (فقط ثبت نتیجه برای خود)
- **منشی:** بدون دسترسی به نتایج روان‌سنجی (`@request.auth.role != 'secretary'`)

---



## ۴. PUBLIC_POCKETBASE_URL

```env
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

فایل: `src/lib/pocketbase.ts`

---



## ۵. Rate limit login

- endpoint: `auth-login`
- ۱۵ تلاش / ۱۵ دقیقه per IP

---



## ۶. اعتبارسنجی NEO در سرور

`POST /api/psych/neo-240/submit`

ورودی: `{ testId, answers: { [order]: selectedIndex } }`

سرور:

1. سوالات و `scoring_config` را از PocketBase می‌خواند
2. امتیاز هر گزینه را از `options_json` محاسبه می‌کند
3. `scoreNeo240` و `buildNeoInterpretation` را اجرا می‌کند
4. نتیجه را با توکن کاربر ذخیره می‌کند

کلاینت (`neo-test-runner.svelte`) دیگر مستقیماً `psych_results.create` نمی‌زند.

---



## تأیید

```bash
npm run verify:acl
```

اسکریپت جدید: `scripts/verify-users-acl.mjs`