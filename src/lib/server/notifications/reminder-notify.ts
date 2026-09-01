import type PocketBase from 'pocketbase';
import { formatFaDateTime } from '$lib/date';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { createNotificationsForUsers } from '$lib/server/notifications/create';
import { queueAppointmentDoctorSms, queueAppointmentPatientSms } from '$lib/server/sms/appointment-sms';

const REMINDER_KIND = 'reminder_24h';
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const REMINDER_TOLERANCE_MS = 2 * 60 * 60 * 1000;

type AppointmentExpand = {
	patient?: { id?: string; mobile?: string; name?: string };
	doctor?: { display_name?: string; expand?: { user?: { id?: string; mobile?: string } } };
};

async function staffUserIds(pb: PocketBase): Promise<string[]> {
	try {
		const res = await pb.collection('users').getFullList({
			filter: 'role = "admin" || role = "secretary"',
			fields: 'id',
			...PB_NO_AUTO_CANCEL
		});
		return res.map((u) => u.id);
	} catch {
		return [];
	}
}

async function reminderAlreadySent(
	pb: PocketBase,
	recipientId: string,
	appointmentId: string
): Promise<boolean> {
	try {
		const res = await pb.collection('notifications').getList(1, 20, {
			filter: `recipient = "${recipientId}" && type = "system"`,
			sort: '-id',
			...PB_NO_AUTO_CANCEL
		});
		return res.items.some((item) => {
			const meta = item.metadata as { appointmentId?: string; kind?: string } | null;
			return meta?.appointmentId === appointmentId && meta?.kind === REMINDER_KIND;
		});
	} catch {
		return false;
	}
}

export type ReminderRunResult = {
	scanned: number;
	sent: number;
	skipped: number;
};

/** Send in-app + SMS reminders for appointments ~24h ahead (idempotent per recipient). */
export async function runAppointmentReminders(pb: PocketBase): Promise<ReminderRunResult> {
	const now = Date.now();
	const windowStart = new Date(now + REMINDER_WINDOW_MS - REMINDER_TOLERANCE_MS).toISOString();
	const windowEnd = new Date(now + REMINDER_WINDOW_MS + REMINDER_TOLERANCE_MS).toISOString();

	const appointments = await pb.collection('appointments').getFullList({
		filter: `date_time >= "${windowStart}" && date_time <= "${windowEnd}" && status != "cancelled" && status != "completed"`,
		expand: 'patient,doctor,doctor.user',
		...PB_NO_AUTO_CANCEL
	});

	let sent = 0;
	let skipped = 0;

	for (const apt of appointments) {
		const exp = (apt.expand ?? {}) as AppointmentExpand;
		const when = formatFaDateTime(new Date(String(apt.date_time)));
		const doctorName = String(exp.doctor?.display_name || 'متخصص');
		const patientUserId = exp.patient?.id ? String(exp.patient.id) : null;
		const patientMobile = exp.patient?.mobile ? String(exp.patient.mobile) : '';
		const patientName = exp.patient?.name ? String(exp.patient.name) : '';
		const doctorUserId = exp.doctor?.expand?.user?.id ? String(exp.doctor.expand.user.id) : null;
		const doctorMobile = exp.doctor?.expand?.user?.mobile ? String(exp.doctor.expand.user.mobile) : '';

		const metadata = { appointmentId: apt.id, kind: REMINDER_KIND };
		const patientReminderSent = patientUserId
			? await reminderAlreadySent(pb, patientUserId, apt.id)
			: true;
		const doctorReminderSent = doctorUserId
			? await reminderAlreadySent(pb, doctorUserId, apt.id)
			: true;

		if (patientUserId && patientReminderSent && doctorUserId && doctorReminderSent) {
			skipped += 1;
			continue;
		}

		if (patientUserId && !patientReminderSent) {
			await createNotificationsForUsers(pb, [patientUserId], {
				type: 'system',
				title: 'یادآوری نوبت',
				body: `یادآوری: نوبت شما ${when} است.`,
				href: '/dashboard/appointments',
				metadata
			});
			if (patientMobile) {
				await queueAppointmentPatientSms(pb, {
					mobile: patientMobile,
					template: 'appointment_reminder',
					dateTime: String(apt.date_time),
					doctorName,
					patientName
				});
			}
			sent += 1;
		}

		if (doctorUserId && !doctorReminderSent) {
			await createNotificationsForUsers(pb, [doctorUserId], {
				type: 'system',
				title: 'یادآوری نوبت',
				body: `یادآوری: جلسه‌ای در ${when} دارید.`,
				href: '/dashboard/appointments',
				metadata
			});
			if (doctorMobile) {
				await queueAppointmentDoctorSms(pb, {
					mobile: doctorMobile,
					template: 'doctor_appointment_reminder',
					dateTime: String(apt.date_time),
					doctorName,
					patientName
				});
			}
			sent += 1;
		}
		const staffIds = await staffUserIds(pb);
		for (const staffId of staffIds) {
			if (await reminderAlreadySent(pb, staffId, apt.id)) continue;
			await createNotificationsForUsers(pb, [staffId], {
				type: 'system',
				title: 'یادآوری نوبت',
				body: `نوبت فردا — ${when}.`,
				href: '/dashboard/appointments',
				metadata
			});
			sent += 1;
		}
	}

	return { scanned: appointments.length, sent, skipped };
}
