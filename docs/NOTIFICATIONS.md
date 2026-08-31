# سیستم اعلان‌ها (Notifications) — هومبان

آخرین به‌روزرسانی: ۱۴۰۵/۰۶/۰۷

## هدف

اعلان **درون‌برنامه‌ای** برای نقش‌های پنل (زنگوله هدر). جدا از:
- **پیامک** (`sms_outbox`) — کانال بیرونی به موبایل مراجع
- **پیام‌های داخلی** (`/dashboard/messages`) — inbox mock، فعلاً unrelated
- **بنر محصول** (`DashboardUpdateBanner`) — اعلان یک‌بار مصرف UI

---

## معماری (تصمیم نهایی)

```
رویداد (نوبت) → API سرور SvelteKit → notifications (PocketBase)
                                              ↓
                         Realtime PB + polling → NotificationBell (app-shell)
```

| لایه | فناوری | توضیح |
|------|--------|--------|
| ذخیره | Collection `notifications` | هر رکورد = یک اعلان برای یک `recipient` |
| تولید | `src/lib/server/notifications/` | فقط سرور (admin PB)، نه فرانت |
| خواندن | `GET /api/notifications` | با Bearer token کاربر |
| Realtime | `pb.collection('notifications').subscribe` | فیلتر `recipient = userId` |
| UI | `notification-bell.svelte` | Popover + badge + mark read |

### فیلدهای `notifications`

| فیلد | نوع | توضیح |
|------|-----|--------|
| `recipient` | relation → users | گیرنده |
| `type` | select | `appointment_created` \| `appointment_cancelled` \| `appointment_rescheduled` \| `system` |
| `title` | text | عنوان کوتاه |
| `body` | text | توضیح عمومی (بدون اطلاعات بالینی) |
| `href` | text | مسیر کلیک، مثلاً `/dashboard/appointments` |
| `read_at` | date | null = خوانده‌نشده |
| `priority` | select | `normal` \| `urgent` |
| `metadata` | json | `{ appointmentId, ... }` — داخلی |

### RBAC (PocketBase)

- **list / view / update:** `recipient = @request.auth.id`
- **create:** فقط سرور (admin) — `createRule: null`
- **delete:** `recipient = @request.auth.id || role = admin`

### اصل حریم خصوصی

- متن اعلان **عمومی** (زمان، «نوبت جدید») — بدون نام مراجع در اعلان منشی
- جزئیات فقط پس از RBAC در صفحه مقصد

---

## نقش‌ها و انواع اعلان (MVP)

| رویداد | گیرندگان | type |
|--------|----------|------|
| ثبت نوبت | مراجع، متخصص، admin، secretary | `appointment_created` |
| لغو نوبت | همان گروه | `appointment_cancelled` |
| تغییر زمان | همان گروه | `appointment_rescheduled` |

---

## فازبندی

### ✅ فاز ۰ — Schema + سرویس (انجام شده)

- [x] Migration `1787000008_notifications.js`
- [x] `src/lib/notifications/types.ts`
- [x] `src/lib/notifications/services/notifications-client.ts`
- [x] `src/lib/notifications/notifications.svelte.ts`
- [x] `src/lib/server/notifications/` (create, appointment handlers)
- [x] `src/lib/server/request-auth.ts`
- [x] API: `GET /api/notifications`, `POST .../read-all`, `PATCH .../[id]/read`

### ✅ فاز ۱ — UI زنگوله (انجام شده)

- [x] `notification-bell.svelte` (Popover bits-ui)
- [x] اتصال به `app-shell.svelte`
- [x] Badge تعداد خوانده‌نشده
- [x] «همه را خواندم» + کلیک → navigate + mark read
- [x] Realtime subscribe + refresh اولیه

### ✅ فاز ۲ — رویداد نوبت (MVP انجام شده)

- [x] `POST /api/appointments/create` — ایجاد + notify
- [x] `PATCH /api/appointments/[id]` — لغو / تغییر زمان + notify
- [x] `booking.ts` → API به‌جای `pb.create` مستقیم
- [x] UI لغو نوبت در `appointments-list-table.svelte`
- [x] UI تغییر زمان در لیست نوبت‌ها (دیالوگ تاریخ/ساعت + اعلان خودکار)

### ⬜ فاز ۳ — یادآور و زمان‌بندی (بخشی انجام شد)

- [x] Cron endpoint: `POST /api/cron/appointment-reminders` (header `x-cron-secret`)
- [x] یادآوری ~۲۴h قبل: اعلان in-app + صف SMS (`appointment_reminder`)
- [x] اعلان «پرداخت ثبت شد» از desk (`POST /api/desk/record-payment`)
- [ ] Task Scheduler / cron واقعی روی سرور (فراخوانی دوره‌ای endpoint)

### ⬜ فاز ۴ — ترجیحات کاربر (باقی‌مانده)

- [ ] Collection `notification_preferences`
- [ ] خاموش/روشن کردن نوع اعلان per user

### ⬜ فاز ۵ — Push / PWA (انجام شد)

- [x] `manifest.webmanifest` + meta tags (نصب PWA)
- [x] `src/service-worker.ts` (cache + push + notificationclick)
- [x] Collection `push_subscriptions` + API subscribe/unsubscribe
- [x] Web Push با VAPID (`web-push`) — dispatch از `create.ts`
- [x] UI: prompt در app-shell، toggle در زنگوله، تنظیمات در پروفایل
- [x] `POST /api/push/test` برای تست ارسال

#### env لازم

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@hoomban.ir
```

تولید کلید: `node scripts/generate-vapid-keys.mjs`

#### تست

```bash
npm run build && npm run preview
node scripts/test-push-api.mjs
```

---

## فایل‌های کلیدی

| مسیر | نقش |
|------|-----|
| `pocketbase/pb_migrations/1787000008_notifications.js` | Schema |
| `src/lib/server/notifications/appointment-notify.ts` | منطق اعلان نوبت |
| `src/lib/server/notifications/create.ts` | insert اعلان |
| `src/routes/api/notifications/+server.ts` | لیست |
| `src/routes/api/notifications/[id]/read/+server.ts` | خوانده‌شده |
| `src/routes/api/notifications/read-all/+server.ts` | همه خوانده |
| `src/routes/api/appointments/create/+server.ts` | نوبت + notify |
| `src/routes/api/appointments/[id]/+server.ts` | PATCH نوبت + notify |
| `src/routes/api/cron/appointment-reminders/+server.ts` | Cron یادآوری ۲۴h |
| `src/routes/api/desk/record-payment/+server.ts` | ثبت پرداخت + notify |
| `src/lib/appointments/components/appointment-reschedule-dialog.svelte` | UI تغییر زمان |
| `src/lib/server/notifications/reminder-notify.ts` | منطق یادآوری |
| `src/lib/server/notifications/payment-notify.ts` | اعلان پرداخت |
| `src/lib/components/notification-bell.svelte` | UI |
| `src/lib/notifications/notifications.svelte.ts` | state سراسری |

---

## API قرارداد

### `GET /api/notifications?limit=30`

Header: `Authorization: Bearer <pb_token>`

### `PATCH /api/notifications/:id/read`

### `POST /api/notifications/read-all`

### `POST /api/appointments/create`

```json
{
  "patientId": "...",
  "doctorId": "...",
  "dateTime": "ISO",
  "type": "in_person",
  "notesPublic": "..."
}
```

### `PATCH /api/appointments/:id`

```json
{ "status": "cancelled" }
```
یا
```json
{ "dateTime": "ISO" }
```

---

## کارهایی که عمداً انجام نمی‌دهیم (فعلاً)

- ادغام با `/dashboard/messages`
- تولید اعلان از `$effect` فرانت
- WebSocket جدا از PocketBase Realtime
- نمایش نام مراجع در اعلان منشی

---

## راه‌اندازی

```bash
cd pocketbase
./pocketbase migrate
./pocketbase serve --http=127.0.0.1:8090
```

Migration: `1787000008_notifications.js`

### Cron یادآوری ۲۴ ساعته

در `.env.local` (یا env سرور):

```env
CRON_SECRET=یک-رشته-تصادفی-طولانی
```

هر ۱۵–۳۰ دقیقه یک بار (Task Scheduler ویندوز یا cron لینوکس):

```powershell
Invoke-WebRequest -Method POST -Uri "http://127.0.0.1:5173/api/cron/appointment-reminders" -Headers @{ "x-cron-secret" = "YOUR_SECRET" }
```

پاسخ موفق: `{ "ok": true, "scanned": N, "sent": N, "skipped": N }`

---

## مراجع

- RBAC کلی: `src/lib/rbac.ts`
- وضعیت پنل: `docs/PANEL_STATUS.md`
- SMS: `src/routes/api/sms/send/+server.ts`
