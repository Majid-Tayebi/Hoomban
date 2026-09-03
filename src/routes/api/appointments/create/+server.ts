import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canManageAppointments, getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { notifyAppointmentCreated } from '$lib/server/notifications/appointment-notify';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}
	if (!canManageAppointments(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const patientId = String(body.patientId ?? '');
		const doctorId = String(body.doctorId ?? '');
		const dateTime = String(body.dateTime ?? '');
		const type = String(body.type ?? 'in_person');
		const notesPublic = body.notesPublic ? String(body.notesPublic) : '';

		if (!patientId || !doctorId || !dateTime) {
			return json({ error: 'اطلاعات نوبت ناقص است' }, { status: 400 });
		}

		if (user.role === 'patient' && patientId !== user.id) {
			return json({ error: 'فقط برای خودتان می‌توانید نوبت بگیرید' }, { status: 403 });
		}

		const pb = await getAdminPb();
		const record = await pb.collection('appointments').create(
			{
				patient: patientId,
				doctor: doctorId,
				date_time: dateTime,
				status: 'reserved',
				type,
				...(notesPublic ? { notes_public: notesPublic } : {})
			},
			PB_NO_AUTO_CANCEL
		);

		try {
			await notifyAppointmentCreated(pb, record.id);
		} catch (notifyErr) {
			console.error('appointment notification failed:', notifyErr);
		}

		return json({ id: record.id });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت نوبت';
		return json({ error: message }, { status: 500 });
	}
};
