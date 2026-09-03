# امکانات هومبان / Hoomban Feature Catalog

**نسخه سند:** ۱۴۰۵/۰۶/۱۲ · Sep 2026  
**مخاطب:** کارفرما، محصول، توسعه  
**وضعیت:** منعکس‌کنندهٔ کد فعلی مخزن (نه roadmap فرضی)

> این سند فقط قابلیت‌هایی را فهرست می‌کند که در کد پیاده‌سازی شده‌اند. موارد «آمادهٔ پیکربندی» صریحاً مشخص شده‌اند.

---

## ۱. نمای محصول / Product overview

هومبان یک **سامانهٔ یکپارچه کلینیک روانشناسی** است شامل:

1. وب‌سایت عمومی (لندینگ، مقالات، FAQ، آزمون‌های عمومی)  
2. رزرو نوبت و پرداخت آنلاین  
3. پنل عملیاتی نقش‌محور (CRM + میز پذیرش + بالینی + CMS)  
4. موتور آزمون‌های روان‌شناختی با امتیازدهی سمت سرور  
5. اعلان، پیامک، Web Push و زیرساخت امنیتی/SEO/PWA

---

## ۲. نقش‌ها و کنترل دسترسی / Roles & access

| نقش | fa | دامنه دسترسی |
|-----|-----|----------------|
| `admin` | مدیر | همهٔ ماژول‌های پنل، کارکنان، تنظیمات، ACL کامل |
| `secretary` | منشی | نوبت، تقویم، میز پذیرش/حسابداری، خدمات، انبار، مقالات (هماهنگی)، پیام‌های داخلی |
| `doctor` | روانشناس | پرونده و یادداشت بالینی، نوبت‌های مرتبط، ارجاع، پیام |
| `writer` | نویسنده | ویرایش آزمون‌ها و مقالات |
| `patient` | مراجع | رزرو، پروفایل، نوبت‌های خود، نتایج آزمون خود |

**اجرای امنیت:** قوانین PocketBase + گارد `+page.server.ts` / API + چک‌لیست UI (UI به‌تنهایی کافی نیست). مسیرهای ناشناختهٔ `/dashboard/*` به‌صورت پیش‌فرض **deny**.

جزئیات: [`adr/0002-rbac-dual-layer.md`](./adr/0002-rbac-dual-layer.md)

---

## ۳. وب عمومی / Public site

| قابلیت | مسیر / ماژول | توضیح |
|--------|--------------|--------|
| لندینگ | `/` | متخصصین، خدمات، نظرات، مقالات؛ کش سرور + `Cache-Control` |
| رزرو نوبت | `/appointments/book` | ویزارد چندمرحله‌ای (متخصص / خدمت، تاریخ‌ساعت، تأیید) |
| مقالات | `/articles`, `/articles/[slug]` | CMS منتشرشده؛ کاور از طریق پروکسی اپ |
| FAQ | `/faq` | FAQ + Schema FAQPage |
| کاتالوگ آزمون | `/tests`, `/tests/[slug]` | آزمون‌های فعال عمومی |
| نتیجه آزمون | `/tests/result/[id]` | نمایش نتیجه با ACL |
| آفلاین | `/offline` + Service Worker | صفحهٔ آفلاین PWA |
| SEO | `SeoHead`, `/sitemap.xml`, `robots.txt` | OG 1200×630، JSON-LD، hreflang، Disallow داشبورد/API |

---

## ۴. احراز هویت و پروفایل / Auth & profile

| قابلیت | وضعیت | جزئیات |
|--------|--------|--------|
| ورود نام‌کاربری/رمز | ✅ | `/api/auth/login` + rate-limit |
| ورود / بازیابی OTP موبایل | ✅ | SMS.ir؛ در sandbox نمایش کد در UI |
| Session دوگانه | ✅ | کوکی httpOnly + توکن PB حافظه‌ای — [`adr/0001-dual-auth.md`](./adr/0001-dual-auth.md) |
| ورود سریع Dev | ✅ | فقط با `DEV_DEMO_AUTH`؛ در production استارت نمی‌شود |
| پروفایل | ✅ | جزئیات، آدرس، آواتار، رمز — فقط `/api/profile*` |
| تغییر موبایل | ✅ | درخواست + تأیید OTP |
| یکتایی موبایل/نام‌کاربری | ✅ | `/api/profile/check-unique` با auth + rate-limit |

---

## ۵. نوبت‌دهی و تقویم / Appointments & calendar

| قابلیت | وضعیت | جزئیات |
|--------|--------|--------|
| رزرو ویزیت حضوری | ✅ | اسلات بر اساس ساعات کاری متخصص |
| رزرو خدمت کلینیک | ✅ | مسیر جدا در ویزارد؛ قیمت از DB |
| میز پذیرش (Desk) | ✅ | ثبت برای مراجع، بدون پرداخت اجباری آنلاین |
| لیست نوبت‌ها | ✅ | KPI، فیلتر وضعیت، اکشن‌های نقش‌محور |
| لغو / تأیید | ✅ | ACL سمت سرور؛ محدودیت زمانی لغو بیمار قابل پیکربندی |
| تقویم ماه/هفته/روز | ✅ | `/dashboard/calendar` برای admin/secretary |
| ساعات حضور پزشک | ✅ | `/dashboard/schedule` |
| یادآوری ۲۴ساعته | ✅ endpoint | `POST /api/cron/appointment-reminders` + `CRON_SECRET` (نیاز زمان‌بند سرور) |

**نکته امنیتی:** ایجاد/ویرایش مستقیم نوبت از کلاینت PocketBase بسته است؛ فقط از API سرور.

---

## ۶. میز پذیرش و حسابداری / Front desk & accounting

| قابلیت | وضعیت | جزئیات |
|--------|--------|--------|
| پرونده میز منشی | ✅ | `/dashboard/desk/patients/[id]` |
| دفتر حساب مراجع | ✅ | مبلغ مورد انتظار، پرداخت، بخشودگی |
| نمای کلی حسابداری | ✅ | موجودی بدهی، پرداخت‌ها |
| ثبت پرداخت حضوری | ✅ | `/api/desk/record-payment` با سقف و قفل `expected_amount` |
| پرداخت آنلاین زرین‌پال | ✅ | درخواست/callback؛ مبلغ خدمت فقط با `serviceId` از DB |
| سندباکس زرین‌پال | ✅ | `ZARINPAL_SANDBOX=true` |

---

## ۷. پرونده بالینی / Clinical record

| قابلیت | وضعیت | جزئیات |
|--------|--------|--------|
| لیست مراجعان | ✅ | جستجو/صفحه‌بندی سروری برای نقش‌های مجاز |
| جزئیات مراجع | ✅ | پروفایل، نوبت‌ها، متادیتا |
| یادداشت بالینی + صوت | ✅ | فقط admin/پزشک مالک؛ ACL سخت در PB |
| برنامه درمان در یادداشت | ✅ | فیلد `treatment_plan` |
| ارجاع بین متخصصین | ✅ | workflow وضعیت‌دار |
| پیوست پرونده | ✅ | آپلود به استوریج PB |
| ویتال / دارو / آلرژی | ✅ فیلد | از `patient_profiles` وقتی داده وجود داشته باشد |
| گزارش‌های ساختگی UI | ❌ حذف‌شده | دیگر mock به‌عنوان داده واقعی نشان داده نمی‌شود |

---

## ۸. آزمون‌های روان‌شناختی / Psychometrics

| قابلیت | وضعیت | جزئیات |
|--------|--------|--------|
| کاتالوگ و CRUD آزمون | ✅ | نقش writer (+ مشاهده admin) |
| NEO-240 | ✅ | ویرایشگر، runner، امتیاز و تفسیر سمت سرور |
| همگام‌سازی دسته‌ای سوالات | ✅ | `/api/psych/questions/sync` |
| ارسال NEO | ✅ | `/api/psych/neo-240/submit` — کلاینت فقط پاسخ خام |
| آزمون عمومی (generic) | ✅ | `/api/psych/generic/submit` |
| نتیجه + نمودار رادار | ✅ | پنل نتیجه و PDF/چاپ |
| دسترسی نتیجه | ✅ | بیمار فقط خودش؛ منشی بدون دسترسی؛ پزشک مرتبط |

---

## ۹. محتوا و عملیات کلینیک / CMS & ops

| قابلیت | مسیر | نقش‌ها |
|--------|------|--------|
| مقالات | `/dashboard/articles` | admin, writer, secretary |
| خدمات و تعرفه | `/dashboard/services` | admin, secretary |
| متخصصین | `/dashboard/doctors` | admin, secretary |
| انبار | `/dashboard/inventory` | admin, secretary |
| پیام داخلی | `/dashboard/messages` | admin, secretary, doctor |
| کارکنان | `/dashboard/admin/staff` | admin |
| تنظیمات / SMS outbox | `/dashboard/settings` | admin |
| راهنمای پنل | `/dashboard/help` | همه |

---

## ۱۰. اعلان‌ها و کانال‌ها / Notifications & channels

| کانال | وضعیت | توضیح |
|-------|--------|--------|
| زنگوله درون‌برنامه | ✅ | Realtime + polling؛ بدون PHI در متن اعلان |
| Web Push | ✅ | VAPID؛ اشتراک از پروفایل |
| پیامک OTP / یادآوری | ✅ پیکربندی | SMS.ir؛ template؛ sandbox |
| SMS آزاد متنی | محدود | فقط admin (منشی از قالب) |

جزئیات: [`NOTIFICATIONS.md`](./NOTIFICATIONS.md)

---

## ۱۱. زیرساخت مهندسی / Engineering platform

| حوزه | قابلیت |
|------|--------|
| API docs | OpenAPI در `/api/openapi.json` و UI `/api/docs` |
| کش | Redis یا memory؛ لندینگ، مقالات، تست‌ها، sitemap |
| Rate limit | مبتنی بر IP؛ اعتماد به پروکسی فقط با `TRUST_PROXY` |
| CSRF | Origin check روی mutating `/api/*` |
| مانیتورینگ | Sentry (اختیاری) |
| CSP | تنظیم در `svelte.config.js` |
| تست | Vitest واحد · Playwright E2E (شامل `e2e/security.spec.ts`) · اسکریپت‌های ACL |
| i18n پایه | کوکی locale (`fa` پیش‌فرض) |
| برند / SEO | OG اختصاصی، پروکسی کاور مقاله، Schema کلینیک |

---

## ۱۲. آنچه «آمادهٔ بهره‌برداری عملیاتی» است ولی به پیکربندی سرور نیاز دارد

این‌ها در کد هستند؛ بدون credential یا cron روی سرور زنده فعال نمی‌شوند:

- `ZARINPAL_MERCHANT_ID` برای پرداخت واقعی  
- کلید production SMS.ir + خط اختصاصی  
- `CRON_SECRET` + زمان‌بند برای یادآوری نوبت  
- `REDIS_URL` در production  
- `VAPID_*` برای Web Push  
- `SENTRY_DSN` اختیاری  

---

## ۱۳. نقشهٔ مسیر کوتاه / Short roadmap (غیر از کد فعلی)

مواردی که آگاهانه backlog هستند (نه نقص پنهان در این سند):

- ترجیحات اعلان کاربر (فاز ۴ اعلان‌ها)  
- صفحه‌بندی عمیق‌تر نمای کلی حسابداری در مقیاس خیلی بالا  
- غنی‌سازی بیشتر آمار جزئیات پزشک بدون هیچ fallback نمایشی  

---

## English summary

Hoomban ships as a **full clinic OS**: public marketing + booking, role-based CRM/desk, clinical notes with strict ACL, server-scored psychometrics (NEO-240), Zarinpal checkout, SMS.ir OTP, in-app + Web Push notifications, articles/services CMS, inventory, internal messages, OpenAPI, Redis-backed cache/rate-limit, dual-layer RBAC, and Playwright security coverage. Anything that needs live credentials (payment merchant, SMS production, cron, Redis, VAPID) is implemented and documented in `.env.example`—not mocked as “done” without config.
