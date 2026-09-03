# هومبان (Hoomban)

**پلتفرم اختصاصی کلینیک روانشناسی** — نوبت‌دهی آنلاین، پرونده بالینی، آزمون‌های روان‌شناختی، حسابداری میز پذیرش، CMS مقالات و پنل نقش‌محور.

> English version below ↓

---

## فارسی

### این پروژه چیست؟

هومبان یک **سامانه عملیاتی کلینیک** است، نه یک وب‌سایت عمومی ساده. از لندینگ و رزرو نوبت تا پرونده مراجع، یادداشت بالینی، آزمون NEO-240، پرداخت زرین‌پال، پیامک، اعلان و مدیریت محتوا را در یک پشتهٔ یکپارچه پوشش می‌دهد.

| نقش | دسترسی نمونه |
|-----|----------------|
| **مدیر** | کارکنان، تنظیمات، حسابداری، ACL کامل |
| **منشی** | میز پذیرش، نوبت، تقویم، مراجعان (هماهنگی)، خدمات، انبار |
| **روانشناس** | پرونده و یادداشت بالینی، نوبت‌های خود، ارجاع |
| **نویسنده** | ویرایش آزمون‌ها و مقالات |
| **مراجع** | رزرو، پروفایل، نتایج آزمون خود |

### پشته فناوری

| لایه | فناوری |
|------|--------|
| فرانت / BFF | SvelteKit 5 · Svelte 5 · Tailwind · shadcn-svelte |
| بک‌اند داده | PocketBase 0.27 (Auth · ACL · فایل · Realtime) |
| پرداخت | زرین‌پال (sandbox / production) |
| پیامک | SMS.ir |
| تست | Vitest · Playwright |
| استقرار | `@sveltejs/adapter-node` |

### پیش‌نیازها

- Node.js **22+**
- PocketBase **0.27+** در پوشه `pocketbase/`
- (اختیاری در dev / اجباری در production) Redis برای rate-limit و کش

### راه‌اندازی محلی

```powershell
npm install
copy .env.example .env

cd pocketbase
.\pocketbase.exe migrate
.\pocketbase.exe serve --http=127.0.0.1:8090

# ترمینال دیگر
npm run dev
```

برای ورود سریع توسعه: `DEV_DEMO_AUTH=true` در `.env` (در production سرور استارت نمی‌شود).

| نقش | نام کاربری | رمز |
|-----|------------|-----|
| مدیر / منشی / روانشناس / نویسنده / مراجع | `admin` · `secretary` · `doctor` · `writer` · `patient` | `12341234` |

### اسکریپت‌ها

| دستور | توضیح |
|-------|-------|
| `npm run dev` | سرور توسعه |
| `npm run build` / `npm run start` | بیلد و اجرای production |
| `npm run check` | TypeScript + Svelte |
| `npm run test` | تست واحد |
| `npm run e2e` | Playwright |
| `npm run verify:acl` | صحت قوانین دسترسی PocketBase |

### مستندات

| سند | موضوع |
|-----|--------|
| [docs/FEATURES.md](docs/FEATURES.md) | کاتالوگ کامل امکانات |
| [docs/WHY-NOT-WORDPRESS.md](docs/WHY-NOT-WORDPRESS.md) | چرا کدنویسی اختصاصی بهتر از وردپرس است (برای کارفرما) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | معماری سیستم |
| [docs/DEVELOPING.md](docs/DEVELOPING.md) | راهنمای توسعه‌دهنده |
| [docs/SECURITY-FIXES.md](docs/SECURITY-FIXES.md) | تاریخچه سخت‌گیری امنیتی |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | سیستم اعلان و Web Push |
| [docs/PANEL_STATUS.md](docs/PANEL_STATUS.md) | وضعیت ماژول‌های پنل |
| [docs/adr/](docs/adr/) | تصمیم‌های معماری (احراز هویت، RBAC) |

### امنیت (خلاصه)

- RBAC **دو لایه**: قوانین PocketBase + گارد SvelteKit
- مبلغ پرداخت خدمت فقط از دیتابیس با `serviceId` (نه از کلاینت)
- ویرایش پروفایل فقط از `/api/profile*`
- CSRF Origin، rate-limit، قفل ارتقای نقش، توکن خارج از `localStorage`
- فایل‌های بالینی در استوریج PocketBase با ACL — نه در مرورگر

### استقرار

```bash
npm run build && npm run start
```

PocketBase جداگانه اجرا شود. متغیرهای حیاتی: `POCKETBASE_URL`، `PUBLIC_POCKETBASE_URL`، `PUBLIC_APP_URL`، و در production `REDIS_URL`. جزئیات در `.env.example`.

---

## English

### What is Hoomban?

Hoomban is a **clinic operations platform** for a psychology practice—not a brochure site. It combines public booking, clinical records, psychometrics (including NEO-240), desk accounting, Zarinpal payments, SMS, notifications, and an editorial CMS in one stack.

| Role | Example access |
|------|----------------|
| **Admin** | Staff, settings, full ACL |
| **Secretary** | Front desk, calendar, coordination patients, services, inventory |
| **Doctor** | Clinical notes, own appointments, referrals |
| **Writer** | Psych tests & articles |
| **Patient** | Booking, profile, own test results |

### Stack

| Layer | Tech |
|-------|------|
| App / BFF | SvelteKit 5 · Svelte 5 · Tailwind · shadcn-svelte |
| Data API | PocketBase 0.27 (auth, ACL, files, realtime) |
| Payments | Zarinpal |
| SMS | SMS.ir |
| Tests | Vitest · Playwright |
| Deploy | Node adapter (`npm run build && npm run start`) |

### Local setup

```powershell
npm install
copy .env.example .env
cd pocketbase && .\pocketbase.exe migrate && .\pocketbase.exe serve --http=127.0.0.1:8090
npm run dev
```

Dev quick-login: set `DEV_DEMO_AUTH=true` (blocked in production startups). Demo users: `admin` / `secretary` / `doctor` / `writer` / `patient` with password `12341234`.

### Documentation map

- **[FEATURES](docs/FEATURES.md)** — full product capability catalog  
- **[Why not WordPress](docs/WHY-NOT-WORDPRESS.md)** — client-facing comparison  
- **[Architecture](docs/ARCHITECTURE.md)** · **[Developing](docs/DEVELOPING.md)** · **[Security fixes](docs/SECURITY-FIXES.md)** · **[ADRs](docs/adr/)**

### Security highlights

Dual-layer RBAC (PocketBase rules + SvelteKit guards), server-authoritative payment amounts, profile writes only via `/api/profile*`, Origin CSRF checks, rate limiting, role self-escalation locked, in-memory auth store (no token in `localStorage`), clinical files behind PB ACL.

### License / ownership

Private clinic software — not an open-source template. Contact the project owner for deployment and commercial use.
