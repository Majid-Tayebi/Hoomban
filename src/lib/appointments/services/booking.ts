import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { BookingClient, BookingDoctor, BookingService, BookingSlot, BookingWorkingDay } from '../booking-types';
import { parseScheduleDates, resolveScheduleForDate } from '$lib/schedule/date-schedule';
import { formatServiceNote } from '../service-booking';

const MOBILE_REGEX = /^09\d{9}$/;
const CATALOG_CACHE_MS = 5 * 60 * 1000;

let doctorsCache: { at: number; data: BookingDoctor[] } | null = null;
let servicesCache: { at: number; data: BookingService[] } | null = null;

export function invalidateBookingCatalogCache(): void {
	doctorsCache = null;
	servicesCache = null;
}

function authHeaders(): HeadersInit {
	return {
		'Content-Type': 'application/json',
		...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
	};
}

async function createAppointmentViaApi(payload: {
	patientId: string;
	doctorId: string;
	dateTime: string;
	type: string;
	notesPublic?: string;
}): Promise<void> {
	const res = await fetch('/api/appointments/create', {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify({
			patientId: payload.patientId,
			doctorId: payload.doctorId,
			dateTime: payload.dateTime,
			type: payload.type,
			notesPublic: payload.notesPublic
		})
	});
	const data = (await res.json()) as { id?: string; error?: string };
	if (!res.ok || !data.id) {
		throw new Error(data.error || 'خطا در ثبت نوبت');
	}
}

export function validateMobile(mobile: string): string | null {
	const clean = mobile.replace(/\D/g, '');
	if (!MOBILE_REGEX.test(clean)) return null;
	return clean;
}

export function fullClientName(client: BookingClient): string {
	return `${client.firstName.trim()} ${client.lastName.trim()}`.replace(/\s+/g, ' ').trim();
}

export async function loadBookingDoctors(): Promise<BookingDoctor[]> {
	if (doctorsCache && Date.now() - doctorsCache.at < CATALOG_CACHE_MS) {
		return doctorsCache.data;
	}

	const result = await pb.collection('doctors').getList(1, 50, {
		expand: 'user',
		filter: 'is_active = true',
		sort: 'sort_order',
		...PB_NO_AUTO_CANCEL
	});

	const data = result.items.map((item) => {
		const workingDays = Array.isArray(item.working_days)
			? (item.working_days as BookingWorkingDay[])
			: [];
		const scheduleDates = parseScheduleDates(item.schedule_dates);
		return {
			id: item.id,
			name: String(item.display_name || item.expand?.user?.name || 'روانشناس'),
			specialty: String(item.specialty || item.bio || 'روانشناسی'),
			visitFee: Number(item.visit_fee || 0),
			slotDuration: Number(item.slot_duration || 45),
			photo: item.photo ? String(item.photo) : undefined,
			workingDays,
			scheduleDates: Object.keys(scheduleDates).length ? scheduleDates : undefined
		};
	});

	doctorsCache = { at: Date.now(), data };
	return data;
}

export function getBookingDoctorPhotoUrl(doctor: BookingDoctor): string | null {
	if (!doctor.photo) return null;
	return pb.files.getURL(
		{ id: doctor.id, collectionId: 'pbc_656799828', collectionName: 'doctors' } as never,
		doctor.photo
	);
}

export function isDoctorWorkingOn(doctor: BookingDoctor, date: Date): boolean {
	const ranges = resolveScheduleForDate(date, doctor.scheduleDates, doctor.workingDays);
	return ranges.length > 0;
}

export async function loadAvailableSlots(
	doctor: BookingDoctor,
	selectedDate: Date,
	options?: { excludeAppointmentId?: string }
): Promise<BookingSlot[]> {
	const ranges = resolveScheduleForDate(selectedDate, doctor.scheduleDates, doctor.workingDays);
	if (!ranges.length) return [];

	const slots: BookingSlot[] = [];
	const slotDuration = doctor.slotDuration || 45;

	for (const range of ranges) {
		const [startHour, startMinute] = range.startTime.split(':').map(Number);
		const [endHour, endMinute] = range.endTime.split(':').map(Number);
		let currentTime = startHour * 60 + startMinute;
		const endTime = endHour * 60 + endMinute;

		while (currentTime + slotDuration <= endTime) {
			const slotHour = Math.floor(currentTime / 60);
			const slotMinute = currentTime % 60;
			const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
			slots.push({ time: timeString, date: selectedDate, doctorId: doctor.id });
			currentTime += slotDuration;
		}
	}

	const dayStart = new Date(selectedDate);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const busySlots = await pb.collection('appointments').getList(1, 100, {
		filter: `doctor = "${doctor.id}" && date_time >= "${dayStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && (status = "reserved" || status = "pending" || status = "confirmed")`,
		...PB_NO_AUTO_CANCEL
	});

	const excludeId = options?.excludeAppointmentId;
	const busyTimes = new Set(
		busySlots.items
			.filter((apt) => !excludeId || apt.id !== excludeId)
			.map((apt) => {
				const aptDate = new Date(String(apt.date_time));
				return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
			})
	);

	return slots.filter((slot) => !busyTimes.has(slot.time));
}

/** Find or create patient without switching the secretary session. */
export async function resolvePatientId(client: BookingClient): Promise<string> {
	const mobile = validateMobile(client.mobile);
	if (!mobile) throw new Error('شماره موبایل نامعتبر است');

	const name = fullClientName(client);
	if (!name) throw new Error('نام و نام خانوادگی لازم است');

	const res = await fetch('/api/appointments/resolve-patient', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify({ mobile, name })
	});

	const data = (await res.json()) as { id?: string; error?: string };
	if (!res.ok || !data.id) {
		throw new Error(data.error || 'خطا در ثبت مراجع');
	}
	return data.id;
}

export async function loadBookingServices(): Promise<BookingService[]> {
	if (servicesCache && Date.now() - servicesCache.at < CATALOG_CACHE_MS) {
		return servicesCache.data;
	}

	const result = await pb.collection('services').getList(1, 100, {
		filter: 'is_active = true',
		sort: 'sort_order',
		...PB_NO_AUTO_CANCEL
	});

	const data = result.items.map((item) => ({
		id: item.id,
		title: String(item.title || ''),
		slug: String(item.slug || ''),
		category: String(item.category || ''),
		description: String(item.description || ''),
		price: Number(item.price || 0)
	}));

	servicesCache = { at: Date.now(), data };
	return data;
}

const SERVICE_SLOT_DURATION = 45;
const SERVICE_DAY_START = 9 * 60;
const SERVICE_DAY_END = 18 * 60;

export async function loadServiceAvailableSlots(selectedDate: Date): Promise<BookingSlot[]> {
	const slots: BookingSlot[] = [];
	let currentTime = SERVICE_DAY_START;

	while (currentTime + SERVICE_SLOT_DURATION <= SERVICE_DAY_END) {
		const slotHour = Math.floor(currentTime / 60);
		const slotMinute = currentTime % 60;
		const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
		slots.push({ time: timeString, date: selectedDate, doctorId: 'service' });
		currentTime += SERVICE_SLOT_DURATION;
	}

	const dayStart = new Date(selectedDate);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const busySlots = await pb.collection('appointments').getList(1, 200, {
		filter: `date_time >= "${dayStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && status != "cancelled"`
	});

	const busyTimes = new Set(
		busySlots.items.map((apt) => {
			const aptDate = new Date(String(apt.date_time));
			return `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
		})
	);

	return slots.filter((slot) => !busyTimes.has(slot.time));
}

async function getFallbackDoctorId(): Promise<string> {
	const doctors = await loadBookingDoctors();
	if (!doctors.length) throw new Error('متخصص فعالی برای ثبت نوبت خدمات یافت نشد');
	return doctors[0].id;
}

export function slotToIsoDateTime(slot: BookingSlot): string {
	const appointmentDateTime = new Date(slot.date);
	const [hours, minutes] = slot.time.split(':').map(Number);
	appointmentDateTime.setHours(hours, minutes, 0, 0);
	return appointmentDateTime.toISOString();
}

export async function createServiceAppointment(params: {
	patientId: string;
	service: BookingService;
	slot: BookingSlot;
}): Promise<void> {
	const doctorId = await getFallbackDoctorId();

	await createAppointmentViaApi({
		patientId: params.patientId,
		doctorId,
		dateTime: slotToIsoDateTime(params.slot),
		type: 'service',
		notesPublic: formatServiceNote(params.service)
	});
}

export async function createInPersonAppointment(params: {
	patientId: string;
	doctorId: string;
	slot: BookingSlot;
}): Promise<void> {
	await createAppointmentViaApi({
		patientId: params.patientId,
		doctorId: params.doctorId,
		dateTime: slotToIsoDateTime(params.slot),
		type: 'in_person'
	});
}
