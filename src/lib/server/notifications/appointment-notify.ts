import type PocketBase from 'pocketbase';
import { formatFaDateTime } from '$lib/date';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { createNotificationsForUsers } from '$lib/server/notifications/create';
import type { NotificationType } from '$lib/notifications/types';
import {
	queueAppointmentBookingSms,
	queueAppointmentRescheduleSms
} from '$lib/server/sms/appointment-sms';

type AppointmentExpand = {
	patient?: { id?: string; name?: string; mobile?: string };
	doctor?: { id?: string; user?: string; display_name?: string; expand?: { user?: { id?: string } } };
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

function doctorUserId(exp: AppointmentExpand): string | null {
	const doc = exp.doctor;
	if (!doc) return null;
	if (doc.user) return String(doc.user);
	return doc.expand?.user?.id ? String(doc.expand.user.id) : null;
}

function formatWhen(dateTime: string | undefined): string {
	if (!dateTime) return '';
	try {
		return formatFaDateTime(new Date(dateTime));
	} catch {
		return '';
	}
}

async function notifyAppointmentEvent(
	pb: PocketBase,
	appointmentId: string,
	type: NotificationType,
	titleByRole?: { patient?: string; staff?: string; doctor?: string }
): Promise<void> {
	const apt = await pb.collection('appointments').getOne(appointmentId, {
		expand: 'patient,doctor,doctor.user',
		...PB_NO_AUTO_CANCEL
	});

	const exp = (apt.expand ?? {}) as AppointmentExpand;
	const when = formatWhen(String(apt.date_time));
	const href = `/dashboard/appointments?appointment=${appointmentId}`;

	const patientId = exp.patient?.id ? String(exp.patient.id) : null;
	const doctorUser = doctorUserId(exp);
	const staffIds = await staffUserIds(pb);

	const defaultTitles: Record<NotificationType, string> = {
		appointment_created: 'نوبت جدید',
		appointment_cancelled: 'لغو نوبت',
		appointment_rescheduled: 'تغییر زمان نوبت',
		system: 'اعلان سیستم'
	};

	const title = defaultTitles[type];
	const bodyPatient =
		type === 'appointment_created'
			? `نوبت شما برای ${when} ثبت شد.`
			: type === 'appointment_cancelled'
				? `نوبت ${when} لغو شد.`
				: `زمان نوبت به ${when} تغییر کرد.`;

	const bodyStaff = `رویداد نوبت — ${when}. جزئیات در فهرست نوبت‌ها.`;
	const bodyDoctor = `نوبت مرتبط با شما — ${when}.`;

	if (patientId) {
		await createNotificationsForUsers(pb, [patientId], {
			type,
			title: titleByRole?.patient ?? title,
			body: bodyPatient,
			href,
			metadata: { appointmentId }
		});
	}

	if (doctorUser) {
		await createNotificationsForUsers(pb, [doctorUser], {
			type,
			title: titleByRole?.doctor ?? title,
			body: bodyDoctor,
			href,
			metadata: { appointmentId }
		});
	}

	if (staffIds.length) {
		await createNotificationsForUsers(pb, staffIds, {
			type,
			title: titleByRole?.staff ?? title,
			body: bodyStaff,
			href,
			metadata: { appointmentId }
		});
	}

	if (type === 'appointment_created') {
		try {
			await queueAppointmentBookingSms(pb, apt);
		} catch {
			/* SMS is best-effort */
		}
	}

	if (type === 'appointment_rescheduled') {
		try {
			await queueAppointmentRescheduleSms(pb, apt);
		} catch {
			/* SMS is best-effort */
		}
	}
}

export async function notifyAppointmentCreated(pb: PocketBase, appointmentId: string): Promise<void> {
	await notifyAppointmentEvent(pb, appointmentId, 'appointment_created');
}

export async function notifyAppointmentCancelled(pb: PocketBase, appointmentId: string): Promise<void> {
	await notifyAppointmentEvent(pb, appointmentId, 'appointment_cancelled');
}

export async function notifyAppointmentRescheduled(pb: PocketBase, appointmentId: string): Promise<void> {
	await notifyAppointmentEvent(pb, appointmentId, 'appointment_rescheduled');
}
