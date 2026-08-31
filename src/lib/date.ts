import * as jalaali from 'jalaali-js';

/** Persian weekday labels (Saturday-first week). */
export const WEEKDAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'] as const;

export const JALALI_MONTHS = [
	'فروردین',
	'اردیبهشت',
	'خرداد',
	'تیر',
	'مرداد',
	'شهریور',
	'مهر',
	'آبان',
	'آذر',
	'دی',
	'بهمن',
	'اسفند'
] as const;

export type JalaliDate = { jy: number; jm: number; jd: number };

export function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

export function addDays(d: Date, n: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}

export function formatFaDate(d: Date): string {
	return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatFaTime(d: Date): string {
	return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export function formatFaDateTime(d: Date): string {
	return `${formatFaDate(d)} — ${formatFaTime(d)}`;
}

/** Relative time for feeds (notifications, messages). */
export function formatRelativeFa(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';

	const now = Date.now();
	const diffMs = now - d.getTime();
	if (diffMs < 0) return formatFaDateTime(d);

	const diffMin = Math.floor(diffMs / 60_000);
	if (diffMin < 1) return 'همین الان';
	if (diffMin < 60) return `${diffMin.toLocaleString('fa-IR')} دقیقه پیش`;

	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;

	const startToday = startOfDay(new Date());
	const startMsg = startOfDay(d);
	const diffDays = Math.round((startToday.getTime() - startMsg.getTime()) / 86_400_000);
	if (diffDays === 0) return 'امروز';
	if (diffDays === 1) return 'دیروز';
	if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
	return formatFaDate(d);
}

export function formatFaDigits(n: number): string {
	return n.toLocaleString('fa-IR', { useGrouping: false });
}

const FA_DIGIT = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** Faster digit formatting for calendar grids (avoids Intl on every cell). */
export function formatFaDigitsFast(n: number): string {
	return String(n).replace(/\d/g, (d) => FA_DIGIT[Number(d)]);
}

/** JS getDay(): 0=Sun … 6=Sat → index in WEEKDAYS_FA (شنبه=0). */
export function toPersianWeekdayIndex(d: Date): number {
	const js = d.getDay();
	return (js + 1) % 7;
}

export function hoursRange(startHour = 8, endHour = 21): number[] {
	const hours: number[] = [];
	for (let h = startHour; h < endHour; h++) hours.push(h);
	return hours;
}

export function setTimeOnDate(base: Date, hours: number, minutes: number): Date {
	const d = new Date(base);
	d.setHours(hours, minutes, 0, 0);
	return d;
}

export function sameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function dateToJalali(d: Date): JalaliDate {
	return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function jalaliToGregorianDate(jy: number, jm: number, jd: number): Date {
	const g = jalaali.toGregorian(jy, jm, jd);
	return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0, 0);
}

export function jalaliMonthLength(jy: number, jm: number): number {
	return jalaali.jalaaliMonthLength(jy, jm);
}

export function addJalaliMonths(jy: number, jm: number, delta: number): { jy: number; jm: number } {
	let total = jy * 12 + (jm - 1) + delta;
	let y = Math.floor(total / 12);
	let m = (total % 12) + 1;
	if (m <= 0) {
		y -= 1;
		m += 12;
	}
	return { jy: y, jm: m };
}

/** ISO date string (YYYY-MM-DD) → Date at noon local time. */
export function parseIsoDate(value: string): Date | null {
	if (!value?.trim()) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!match) return null;
	const y = Number(match[1]);
	const m = Number(match[2]);
	const d = Number(match[3]);
	if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
	return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Date → ISO date string for PocketBase date fields. */
export function toIsoDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Format birth date for display in Persian Jalali. */
export function formatJalaliBirthDate(value: string): string {
	const d = parseIsoDate(value);
	if (!d) return '';
	const j = dateToJalali(d);
	return `${formatFaDigits(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${formatFaDigits(j.jy)}`;
}
