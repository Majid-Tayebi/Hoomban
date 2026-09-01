import type PocketBase from 'pocketbase';
import { formatFaDate, formatFaTime } from '$lib/date';
import type { SmsTemplate } from '$lib/sms';
import { queueSms } from '$lib/server/sms/queue-sms';

type UserExpand = {
	id?: string;
	name?: string;
	mobile?: string;
};

type PatientExpand = {
	id?: string;
	name?: string;
	mobile?: string;
};

type DoctorExpand = {
	display_name?: string;
	user?: string;
	expand?: { user?: UserExpand };
};

export type AppointmentSmsExpand = {
	patient?: PatientExpand;
	doctor?: DoctorExpand;
};

export type AppointmentSmsContext = {
	dateTime: Date;
	date: string;
	time: string;
	patientMobile: string;
	patientName: string;
	doctorMobile: string;
	doctorName: string;
};

function normalizeMobile(raw: string | undefined): string {
	return String(raw ?? '').replace(/\D/g, '');
}

function isValidMobile(mobile: string): boolean {
	return mobile.length >= 10;
}

export function buildAppointmentSmsContext(
	appointment: { date_time?: string; expand?: AppointmentSmsExpand }
): AppointmentSmsContext | null {
	const when = appointment.date_time ? new Date(String(appointment.date_time)) : null;
	if (!when || Number.isNaN(when.getTime())) return null;

	const patient = appointment.expand?.patient;
	const doctorUser = appointment.expand?.doctor?.expand?.user;

	return {
		dateTime: when,
		date: formatFaDate(when),
		time: formatFaTime(when),
		patientMobile: normalizeMobile(patient?.mobile),
		patientName: patient?.name ? String(patient.name) : '',
		doctorMobile: normalizeMobile(doctorUser?.mobile),
		doctorName: String(appointment.expand?.doctor?.display_name || 'متخصص')
	};
}

async function queueSmsToMobile(
	pb: PocketBase,
	params: {
		mobile: string;
		template: SmsTemplate;
		payload: Record<string, string | number>;
	}
): Promise<void> {
	if (!isValidMobile(params.mobile)) return;
	await queueSms(pb, {
		to: params.mobile,
		template: params.template,
		payload: params.payload
	});
}

export async function queueAppointmentPatientSms(
	pb: PocketBase,
	params: {
		mobile: string;
		template: Extract<
			SmsTemplate,
			'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_rescheduled'
		>;
		dateTime: string | Date;
		doctorName?: string;
		patientName?: string;
	}
): Promise<void> {
	const when = params.dateTime instanceof Date ? params.dateTime : new Date(String(params.dateTime));
	if (Number.isNaN(when.getTime())) return;

	await queueSmsToMobile(pb, {
		mobile: params.mobile,
		template: params.template,
		payload: {
			date: formatFaDate(when),
			time: formatFaTime(when),
			doctor: params.doctorName || 'متخصص',
			patient: params.patientName || ''
		}
	});
}

export async function queueAppointmentDoctorSms(
	pb: PocketBase,
	params: {
		mobile: string;
		template: Extract<SmsTemplate, 'doctor_new_appointment' | 'doctor_appointment_reminder' | 'doctor_appointment_rescheduled'>;
		dateTime: string | Date;
		doctorName?: string;
		patientName?: string;
	}
): Promise<void> {
	const when = params.dateTime instanceof Date ? params.dateTime : new Date(String(params.dateTime));
	if (Number.isNaN(when.getTime())) return;

	await queueSmsToMobile(pb, {
		mobile: params.mobile,
		template: params.template,
		payload: {
			date: formatFaDate(when),
			time: formatFaTime(when),
			doctor: params.doctorName || 'متخصص',
			patient: params.patientName || ''
		}
	});
}

/** Patient SMS from an expanded appointment record. */
export async function queueAppointmentSmsFromRecord(
	pb: PocketBase,
	appointment: { date_time?: string; expand?: AppointmentSmsExpand },
	template: Extract<
		SmsTemplate,
		'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_rescheduled'
	>
): Promise<void> {
	const ctx = buildAppointmentSmsContext(appointment);
	if (!ctx?.patientMobile) return;

	await queueAppointmentPatientSms(pb, {
		mobile: ctx.patientMobile,
		template,
		dateTime: ctx.dateTime,
		doctorName: ctx.doctorName,
		patientName: ctx.patientName
	});
}

/** Auto SMS after booking — patient confirmation + specialist notice. */
export async function queueAppointmentBookingSms(
	pb: PocketBase,
	appointment: { date_time?: string; expand?: AppointmentSmsExpand }
): Promise<void> {
	const ctx = buildAppointmentSmsContext(appointment);
	if (!ctx) return;

	await Promise.allSettled([
		ctx.patientMobile
			? queueAppointmentPatientSms(pb, {
					mobile: ctx.patientMobile,
					template: 'appointment_confirmed',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve(),
		ctx.doctorMobile
			? queueAppointmentDoctorSms(pb, {
					mobile: ctx.doctorMobile,
					template: 'doctor_new_appointment',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve()
	]);
}

/** Auto SMS after reschedule — patient + specialist with updated date/time. */
export async function queueAppointmentRescheduleSms(
	pb: PocketBase,
	appointment: { date_time?: string; expand?: AppointmentSmsExpand }
): Promise<void> {
	const ctx = buildAppointmentSmsContext(appointment);
	if (!ctx) return;

	await Promise.allSettled([
		ctx.patientMobile
			? queueAppointmentPatientSms(pb, {
					mobile: ctx.patientMobile,
					template: 'appointment_rescheduled',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve(),
		ctx.doctorMobile
			? queueAppointmentDoctorSms(pb, {
					mobile: ctx.doctorMobile,
					template: 'doctor_appointment_rescheduled',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve()
	]);
}

/** Auto reminder SMS — patient + specialist using appointment date/time. */
export async function queueAppointmentReminderSms(
	pb: PocketBase,
	appointment: { date_time?: string; expand?: AppointmentSmsExpand }
): Promise<void> {
	const ctx = buildAppointmentSmsContext(appointment);
	if (!ctx) return;

	await Promise.allSettled([
		ctx.patientMobile
			? queueAppointmentPatientSms(pb, {
					mobile: ctx.patientMobile,
					template: 'appointment_reminder',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve(),
		ctx.doctorMobile
			? queueAppointmentDoctorSms(pb, {
					mobile: ctx.doctorMobile,
					template: 'doctor_appointment_reminder',
					dateTime: ctx.dateTime,
					doctorName: ctx.doctorName,
					patientName: ctx.patientName
				})
			: Promise.resolve()
	]);
}
