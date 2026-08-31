import type PocketBase from 'pocketbase';
import { formatFaDateTime, formatFaTime } from '$lib/date';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { createNotificationsForUsers } from '$lib/server/notifications/create';
import { queueSms } from '$lib/server/sms/queue-sms';

const REMINDER_KIND = 'reminder_24h';
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const REMINDER_TOLERANCE_MS = 2 * 60 * 60 * 1000;

type AppointmentExpand = {
	patient?: { id?: string; mobile?: string; name?: string };
	doctor?: { display_name?: string; expand?: { user?: { id?: string } } };
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
		const timeLabel = formatFaTime(new Date(String(apt.date_time)));
		const doctorName = String(exp.doctor?.display_name || 'متخصص');
		const patientUserId = exp.patient?.id ? String(exp.patient.id) : null;
		const patientMobile = exp.patient?.mobile ? String(exp.patient.mobile) : '';
		const doctorUserId = exp.doctor?.expand?.user?.id ? String(exp.doctor.expand.user.id) : null;

		const metadata = { appointmentId: apt.id, kind: REMINDER_KIND };

		if (patientUserId) {
			if (await reminderAlreadySent(pb, patientUserId, apt.id)) {
				skipped += 1;
			} else {
				await createNotificationsForUsers(pb, [patientUserId], {
					type: 'system',
					title: 'یادآوری نوبت',
					body: `فردا نوبت شما ساعت ${timeLabel} است.`,
					href: '/dashboard/appointments',
					metadata
				});
				if (patientMobile) {
					await queueSms(pb, {
						to: patientMobile,
						template: 'appointment_reminder',
						payload: { time: timeLabel, doctor: doctorName }
					});
				}
				sent += 1;
			}
		}

		if (doctorUserId && !(await reminderAlreadySent(pb, doctorUserId, apt.id))) {
			await createNotificationsForUsers(pb, [doctorUserId], {
				type: 'system',
				title: 'یادآوری نوبت',
				body: `فردا جلسه‌ای در ${when} دارید.`,
				href: '/dashboard/appointments',
				metadata
			});
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
