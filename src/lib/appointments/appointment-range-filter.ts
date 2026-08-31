import { addDays, dateToJalali, jalaliMonthLength, jalaliToGregorianDate, startOfDay, toPersianWeekdayIndex } from '$lib/date';

export type AppointmentRangeFilter = 'week' | 'month';

export function getAppointmentRangeBounds(filter: AppointmentRangeFilter, now = new Date()): {
	start: Date;
	end: Date;
} {
	if (filter === 'month') {
		const j = dateToJalali(now);
		const start = startOfDay(jalaliToGregorianDate(j.jy, j.jm, 1));
		const monthLength = jalaliMonthLength(j.jy, j.jm);
		const end = addDays(startOfDay(jalaliToGregorianDate(j.jy, j.jm, monthLength)), 1);
		return { start, end };
	}

	const start = addDays(startOfDay(now), -toPersianWeekdayIndex(now));
	const end = addDays(start, 7);
	return { start, end };
}

export function isAppointmentInRange(
	dateTime: Date,
	filter: AppointmentRangeFilter,
	now = new Date()
): boolean {
	const { start, end } = getAppointmentRangeBounds(filter, now);
	return dateTime >= start && dateTime < end;
}
