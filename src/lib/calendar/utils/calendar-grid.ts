import {
	addDays,
	addJalaliMonths,
	dateToJalali,
	formatFaDigits,
	JALALI_MONTHS,
	jalaliMonthLength,
	jalaliToGregorianDate,
	sameDay,
	startOfDay,
	toPersianWeekdayIndex,
	WEEKDAYS_FA
} from '$lib/date';
import type { CalendarDayCell, ScheduleCategory, ScheduleCategoryId, ScheduleEvent } from '../types';

export const WEEKDAY_SHORT_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

export function toIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return startOfDay(new Date(y, m - 1, d));
}

export function startOfMonth(d: Date): Date {
	const j = dateToJalali(d);
	return jalaliToGregorianDate(j.jy, j.jm, 1);
}

export function endOfMonth(d: Date): Date {
	const j = dateToJalali(d);
	const len = jalaliMonthLength(j.jy, j.jm);
	return jalaliToGregorianDate(j.jy, j.jm, len);
}

/** Saturday-start week (Persian). */
export function startOfWeek(d: Date): Date {
	const idx = toPersianWeekdayIndex(d);
	return addDays(startOfDay(d), -idx);
}

export function endOfWeek(d: Date): Date {
	return addDays(startOfWeek(d), 6);
}

export function addMonths(d: Date, n: number): Date {
	const j = dateToJalali(d);
	const next = addJalaliMonths(j.jy, j.jm, n);
	return jalaliToGregorianDate(next.jy, next.jm, 1);
}

export function formatMonthYearFa(d: Date): string {
	const j = dateToJalali(d);
	return `${JALALI_MONTHS[j.jm - 1]} ${formatFaDigits(j.jy)}`;
}

export function formatJalaliMonthShort(d: Date): string {
	const j = dateToJalali(d);
	return JALALI_MONTHS[j.jm - 1].slice(0, 2);
}

export function formatJalaliMonthRange(d: Date): string {
	const j = dateToJalali(d);
	const len = jalaliMonthLength(j.jy, j.jm);
	const start = jalaliToGregorianDate(j.jy, j.jm, 1);
	const end = jalaliToGregorianDate(j.jy, j.jm, len);
	return `${start.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' })} – ${end.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function formatDayMonthFa(d: Date): string {
	return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const CATEGORY_META: Record<
	ScheduleCategoryId,
	{ label: string; tone: 'sky' | 'violet' }
> = {
	appointment: { label: 'نوبت بیمار', tone: 'sky' },
	service: { label: 'نوبت خدمات', tone: 'violet' }
};

export function categoryToneClass(tone: 'sky' | 'violet'): {
	chip: string;
	bar: string;
	card: string;
	dot: string;
} {
	if (tone === 'violet') {
		return {
			chip: 'bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800/50',
			bar: 'bg-violet-500',
			card: 'border-violet-200/70 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/20',
			dot: 'bg-violet-500'
		};
	}
	return {
		chip: 'bg-sky-100 text-sky-900 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800/50',
		bar: 'bg-sky-500',
		card: 'border-sky-200/70 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/20',
		dot: 'bg-sky-500'
	};
}

export function buildCategories(events: ScheduleEvent[]): ScheduleCategory[] {
	const ids: ScheduleCategoryId[] = ['appointment', 'service'];
	return ids.map((id) => ({
		id,
		label: CATEGORY_META[id].label,
		tone: CATEGORY_META[id].tone,
		count: events.filter((e) => e.category === id).length
	}));
}

export function filterEvents(
	events: ScheduleEvent[],
	mode: 'all' | ScheduleCategoryId
): ScheduleEvent[] {
	if (mode === 'all') return events;
	return events.filter((e) => e.category === mode);
}

export function eventsOnDay(events: ScheduleEvent[], day: Date): ScheduleEvent[] {
	const iso = toIsoDate(day);
	return events
		.filter((e) => e.date === iso)
		.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function buildMonthGrid(
	cursor: Date,
	events: ScheduleEvent[],
	today = new Date()
): CalendarDayCell[] {
	const j = dateToJalali(cursor);
	const monthStart = jalaliToGregorianDate(j.jy, j.jm, 1);
	const gridStart = startOfWeek(monthStart);
	const cells: CalendarDayCell[] = [];

	for (let i = 0; i < 42; i++) {
		const date = addDays(gridStart, i);
		const jd = dateToJalali(date);
		cells.push({
			date,
			iso: toIsoDate(date),
			day: jd.jd,
			inCurrentMonth: jd.jm === j.jm && jd.jy === j.jy,
			isToday: sameDay(date, today),
			events: eventsOnDay(events, date)
		});
	}
	return cells;
}

export function weekDays(cursor: Date, events: ScheduleEvent[], today = new Date()): CalendarDayCell[] {
	const start = startOfWeek(cursor);
	return Array.from({ length: 7 }, (_, i) => {
		const date = addDays(start, i);
		const jd = dateToJalali(date);
		return {
			date,
			iso: toIsoDate(date),
			day: jd.jd,
			inCurrentMonth: true,
			isToday: sameDay(date, today),
			events: eventsOnDay(events, date)
		};
	});
}

export { WEEKDAYS_FA };
