import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { createNotificationsForUsers } from '$lib/server/notifications/create';

async function staffUserIds(pb: Awaited<ReturnType<typeof getAdminPb>>): Promise<string[]> {
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

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}
	if (user.role !== 'patient') {
		return json({ error: 'فقط مراجع می‌تواند درخواست ثبت کند' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const message = String(body.message || '').trim();
		const appointmentId = body.appointmentId ? String(body.appointmentId).trim() : '';
		const category =
			body.category === 'appointment_cancel' ? 'appointment_cancel' : 'general';

		if (message.length < 10) {
			return json({ error: 'لطفاً توضیحات را کامل‌تر بنویسید (حداقل ۱۰ کاراکتر)' }, { status: 400 });
		}

		const pb = await getAdminPb();

		if (appointmentId) {
			try {
				const apt = await pb.collection('appointments').getOne(appointmentId, PB_NO_AUTO_CANCEL);
				if (String(apt.patient) !== user.id) {
					return json({ error: 'این نوبت متعلق به شما نیست' }, { status: 403 });
				}
			} catch {
				return json({ error: 'نوبت یافت نشد' }, { status: 400 });
			}
		}

		const record = await pb.collection('patient_requests').create(
			{
				patient: user.id,
				...(appointmentId ? { appointment: appointmentId } : {}),
				category,
				message,
				status: 'pending'
			},
			PB_NO_AUTO_CANCEL
		);

		const staffIds = await staffUserIds(pb);
		if (staffIds.length) {
			const title =
				category === 'appointment_cancel' ? 'درخواست لغو نوبت' : 'درخواست پشتیبانی مراجع';
			await createNotificationsForUsers(pb, staffIds, {
				type: 'system',
				title,
				body: message.length > 120 ? `${message.slice(0, 120)}…` : message,
				href: '/dashboard/appointments',
				priority: category === 'appointment_cancel' ? 'urgent' : 'normal',
				metadata: { patientRequestId: record.id, appointmentId: appointmentId || null }
			});
		}

		return json({ id: record.id, ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ثبت درخواست ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
