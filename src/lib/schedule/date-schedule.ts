import { toIsoDateString } from '$lib/date';
import type { TimeSlot } from './working-schedule';

export type DateDaySchedule = {
	enabled: boolean;
	slots: TimeSlot[];
};

export type DateScheduleMap = Record<string, DateDaySchedule>;

export function emptyDateSchedule(): DateDaySchedule {
	return { enabled: false, slots: [] };
}

export function getDateSchedule(map: DateScheduleMap, iso: string): DateDaySchedule {
	const row = map[iso];
	if (!row) return emptyDateSchedule();
	return {
		enabled: Boolean(row.enabled),
		slots: Array.isArray(row.slots) ? row.slots.map((s) => ({ ...s })) : []
	};
}

export function setDateSchedule(
	map: DateScheduleMap,
	iso: string,
	day: DateDaySchedule
): DateScheduleMap {
	const next = { ...map };
	if (!day.enabled || !day.slots.length) {
		delete next[iso];
		return next;
	}
	next[iso] = {
		enabled: true,
		slots: day.slots.map((s) => ({ ...s }))
	};
	return next;
}

export function markedDatesFromMap(map: DateScheduleMap): string[] {
	return Object.entries(map)
		.filter(([, d]) => d.enabled && d.slots.length > 0)
		.map(([iso]) => iso);
}

export function isoFromDate(date: Date): string {
	return toIsoDateString(date);
}

type WeekdayRaw = {
	day?: string;
	enabled?: boolean;
	startTime?: string | null;
	endTime?: string | null;
	slots?: TimeSlot[];
};

/** Seed calendar from legacy weekly template for the next N days. */
export function expandWeeklyToDates(
	workingDays: WeekdayRaw[],
	from: Date,
	days: number
): DateScheduleMap {
	const map: DateScheduleMap = {};
	const faByJs = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

	for (let i = 0; i < days; i++) {
		const d = new Date(from);
		d.setDate(d.getDate() + i);
		const fa = faByJs[d.getDay()];
		const wd = workingDays.find((w) => w.day === fa);
		if (!wd?.enabled) continue;

		let slots: TimeSlot[] = [];
		if (Array.isArray(wd.slots) && wd.slots.length) {
			slots = wd.slots.filter((s) => s.startTime && s.endTime);
		} else if (wd.startTime && wd.endTime) {
			slots = [{ startTime: String(wd.startTime), endTime: String(wd.endTime) }];
		}
		if (!slots.length) continue;

		map[isoFromDate(d)] = { enabled: true, slots };
	}
	return map;
}

export function resolveScheduleForDate(
	date: Date,
	scheduleDates: DateScheduleMap | undefined,
	weekdayFallback?: WeekdayRaw[]
): TimeSlot[] {
	const iso = isoFromDate(date);
	const dateEntry = scheduleDates?.[iso];
	if (dateEntry?.enabled && dateEntry.slots?.length) {
		return dateEntry.slots;
	}

	if (!weekdayFallback?.length) return [];

	const faByJs = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
	const fa = faByJs[date.getDay()];
	const wd = weekdayFallback.find((w) => w.day === fa);
	if (!wd?.enabled) return [];

	if (Array.isArray(wd.slots) && wd.slots.length) {
		return wd.slots.filter((s) => s.startTime && s.endTime);
	}
	if (wd.startTime && wd.endTime) {
		return [{ startTime: String(wd.startTime), endTime: String(wd.endTime) }];
	}
	return [];
}

export function parseScheduleDates(raw: unknown): DateScheduleMap {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const map: DateScheduleMap = {};
	for (const [iso, value] of Object.entries(raw as Record<string, unknown>)) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
		const row = value as DateDaySchedule;
		if (row?.enabled && Array.isArray(row.slots) && row.slots.length) {
			map[iso] = {
				enabled: true,
				slots: row.slots.filter((s) => s.startTime && s.endTime)
			};
		}
	}
	return map;
}
