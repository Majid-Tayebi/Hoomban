import { pb } from '$lib/pocketbase';
import type { CalendarPageData, ScheduleEvent } from '../types';
import { buildMockServiceSchedules } from '../data/mock-data';
import {
	buildCategories,
	toIsoDate,
	addMonths,
	startOfMonth,
	endOfMonth
} from '../utils/calendar-grid';
import { addDays, startOfDay, dateToJalali, jalaliMonthLength, jalaliToGregorianDate } from '$lib/date';
import { isServiceAppointment, parseServiceNote } from '$lib/appointments/service-booking';

function initials(name: string): string {
	return name
		.split(/\s+/)
		.map((w) => w.charAt(0))
		.slice(0, 2)
		.join('');
}

function statusFa(status: string): string {
	const map: Record<string, string> = {
		pending: 'در انتظار',
		reserved: 'رزرو',
		confirmed: 'تأیید',
		cancelled: 'لغو',
		completed: 'انجام‌شده',
		no_show: 'غیبت'
	};
	return map[status] || status;
}

async function fetchAppointmentEvents(anchor: Date): Promise<ScheduleEvent[]> {
	const j = dateToJalali(anchor);
	const from = jalaliToGregorianDate(j.jy, j.jm, 1);
	const len = jalaliMonthLength(j.jy, j.jm);
	const to = addDays(jalaliToGregorianDate(j.jy, j.jm, len), 1);

	const filter = `date_time >= "${from.toISOString()}" && date_time < "${to.toISOString()}" && status != "cancelled"`;

	const res = await pb.collection('appointments').getList(1, 300, {
		filter,
		expand: 'patient,doctor,doctor.user',
		sort: 'date_time'
	});

	return res.items.map((a) => {
		const exp = a.expand as {
			patient?: { name?: string; mobile?: string };
			doctor?: {
				display_name?: string;
				specialty?: string;
				slot_duration?: number;
				expand?: { user?: { name?: string } };
			};
		};
		const dt = new Date(String(a.date_time));
		const notesPublic = a.notes_public ? String(a.notes_public) : '';
		const aptType = String(a.type || '');
		const serviceInfo = parseServiceNote(notesPublic);
		const isService = isServiceAppointment(aptType, notesPublic);

		const duration = isService ? 45 : Number(exp.doctor?.slot_duration || 45);
		const end = new Date(dt.getTime() + duration * 60_000);
		const patientName = String(exp.patient?.name || exp.patient?.mobile || 'بیمار');
		const doctorName = String(
			exp.doctor?.display_name || exp.doctor?.expand?.user?.name || 'متخصص'
		);
		const startTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
		const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

		if (isService && serviceInfo) {
			return {
				id: `apt-${a.id}`,
				title: `${patientName} — ${serviceInfo.title}`,
				category: 'service' as const,
				date: toIsoDate(dt),
				startTime,
				endTime,
				location: 'کلینیک',
				participants: patientName,
				lead: {
					name: serviceInfo.title,
					role: serviceInfo.category || 'خدمات کلینیک',
					initials: 'خ'
				},
				note: '',
				statusLabel: statusFa(String(a.status)),
				patientId: a.patient ? String(a.patient) : undefined,
				appointmentId: String(a.id),
				serviceTitle: serviceInfo.title
			};
		}

		return {
			id: `apt-${a.id}`,
			title: `${patientName} — ${doctorName}`,
			category: 'appointment' as const,
			date: toIsoDate(dt),
			startTime,
			endTime,
			location: aptType === 'online' ? 'جلسه آنلاین' : 'کلینیک',
			participants: patientName,
			lead: {
				name: doctorName,
				role: String(exp.doctor?.specialty || 'متخصص'),
				initials: initials(doctorName)
			},
			note: notesPublic,
			statusLabel: statusFa(String(a.status)),
			patientId: a.patient ? String(a.patient) : undefined,
			appointmentId: String(a.id)
		};
	});
}

/** Load patient appointments + service slots for the visible Jalali month. */
export async function loadCalendarPageData(
	anchor: Date = new Date(),
	opts: { includeMockServices?: boolean } = {}
): Promise<CalendarPageData> {
	const includeMockServices = opts.includeMockServices ?? false;
	let appointmentEvents: ScheduleEvent[] = [];

	try {
		appointmentEvents = await fetchAppointmentEvents(startOfDay(anchor));
	} catch {
		appointmentEvents = [];
	}

	const hasRealServiceBookings = appointmentEvents.some((e) => e.category === 'service');
	const serviceEvents =
		includeMockServices && !hasRealServiceBookings ? buildMockServiceSchedules(anchor) : [];
	const events = [...appointmentEvents, ...serviceEvents];
	const categories = buildCategories(events);

	return {
		events,
		categories,
		totalSchedules: events.length
	};
}

export function monthKey(d: Date): string {
	const j = dateToJalali(d);
	return `${j.jy}-${j.jm}`;
}

export { addMonths, startOfMonth, endOfMonth };
