import { WEEKDAYS_FA } from '$lib/date';

export type TimeSlot = {
	startTime: string;
	endTime: string;
};

export type WorkingDaySchedule = {
	day: string;
	enabled: boolean;
	slots: TimeSlot[];
};

export type SchedulePreset = {
	id: string;
	label: string;
	slots: TimeSlot[];
};

/** Half-hour options from 07:00 to 22:00 — no manual typing needed. */
export const TIME_OPTIONS: string[] = (() => {
	const out: string[] = [];
	for (let h = 7; h <= 22; h++) {
		for (const m of [0, 30]) {
			if (h === 22 && m === 30) break;
			out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
		}
	}
	return out;
})();

export const SCHEDULE_PRESETS: SchedulePreset[] = [
	{ id: 'morning', label: 'صبح', slots: [{ startTime: '09:00', endTime: '13:00' }] },
	{ id: 'afternoon', label: 'عصر', slots: [{ startTime: '16:00', endTime: '20:00' }] },
	{ id: 'full', label: 'تمام‌روز', slots: [{ startTime: '09:00', endTime: '17:00' }] },
	{
		id: 'split',
		label: 'صبح + عصر',
		slots: [
			{ startTime: '09:00', endTime: '12:00' },
			{ startTime: '16:00', endTime: '20:00' }
		]
	}
];

export function createEmptyWeek(): WorkingDaySchedule[] {
	return WEEKDAYS_FA.map((day) => ({
		day,
		enabled: false,
		slots: []
	}));
}

type RawWorkingDay = {
	day?: string;
	enabled?: boolean;
	startTime?: string | null;
	endTime?: string | null;
	slots?: TimeSlot[];
};

/** Load from PocketBase — supports legacy single-range and new multi-slot format. */
export function normalizeWorkingDay(raw: RawWorkingDay, dayLabel: string): WorkingDaySchedule {
	const enabled = Boolean(raw.enabled);
	let slots: TimeSlot[] = [];

	if (Array.isArray(raw.slots) && raw.slots.length) {
		slots = raw.slots
			.filter((s) => s.startTime && s.endTime)
			.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
	} else if (raw.startTime && raw.endTime) {
		slots = [{ startTime: String(raw.startTime), endTime: String(raw.endTime) }];
	}

	return { day: raw.day || dayLabel, enabled, slots };
}

export function serializeWorkingDay(day: WorkingDaySchedule): RawWorkingDay {
	if (!day.enabled || !day.slots.length) {
		return { day: day.day, enabled: false, slots: [], startTime: null, endTime: null };
	}

	const primary = day.slots[0];
	return {
		day: day.day,
		enabled: true,
		slots: day.slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
		startTime: primary.startTime,
		endTime: primary.endTime
	};
}

export function applyPreset(day: WorkingDaySchedule, preset: SchedulePreset): WorkingDaySchedule {
	return {
		...day,
		enabled: true,
		slots: preset.slots.map((s) => ({ ...s }))
	};
}

export function defaultPreset(): SchedulePreset {
	return SCHEDULE_PRESETS.find((p) => p.id === 'full') ?? SCHEDULE_PRESETS[2];
}

export function addSlot(day: WorkingDaySchedule): WorkingDaySchedule {
	const last = day.slots.at(-1);
	const nextStart = last ? last.endTime : '09:00';
	const startIdx = TIME_OPTIONS.indexOf(nextStart);
	const endTime = TIME_OPTIONS[Math.min(startIdx + 4, TIME_OPTIONS.length - 1)] ?? '17:00';

	return {
		...day,
		enabled: true,
		slots: [...day.slots, { startTime: nextStart, endTime }]
	};
}

export function removeSlot(day: WorkingDaySchedule, index: number): WorkingDaySchedule {
	return {
		...day,
		slots: day.slots.filter((_, i) => i !== index)
	};
}

/** Resolve slots for booking / display (legacy + new format). */
export function resolveDaySlots(raw: RawWorkingDay): TimeSlot[] {
	return normalizeWorkingDay(raw, raw.day || '').slots;
}

export function formatSlotsLabel(slots: TimeSlot[]): string {
	if (!slots.length) return '';
	return slots.map((s) => `${s.startTime}–${s.endTime}`).join(' · ');
}

export function formatTimeFa(time: string): string {
	return time;
}
