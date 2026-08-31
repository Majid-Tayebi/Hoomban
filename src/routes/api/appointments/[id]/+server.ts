import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import {
	notifyAppointmentCancelled,
	notifyAppointmentRescheduled
} from '$lib/server/notifications/appointment-notify';

function canPatchAppointment(role: string): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor';
}

export const PATCH: RequestHandler = async ({ request, params }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}
	if (!canPatchAppointment(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	const id = params.id;
	if (!id) {
		return json({ error: 'شناسه نامعتبر' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const pb = await getAdminPb();
		const existing = await pb.collection('appointments').getOne(id, {
			expand: 'doctor',
			...PB_NO_AUTO_CANCEL
		});

		if (user.role === 'doctor') {
			const myDoctor = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${user.id}"`,
				...PB_NO_AUTO_CANCEL
			});
			if (!myDoctor.items.length || String(existing.doctor) !== myDoctor.items[0].id) {
				return json({ error: 'دسترسی ندارید' }, { status: 403 });
			}
		}

		const patch: Record<string, unknown> = {};
		let notifyCancel = false;
		let notifyReschedule = false;

		if (body.status !== undefined) {
			const status = String(body.status);
			patch.status = status;
			if (status === 'cancelled' && String(existing.status) !== 'cancelled') {
				notifyCancel = true;
			}
		}

		if (body.dateTime !== undefined) {
			const dateTime = String(body.dateTime);
			const prev = new Date(String(existing.date_time)).getTime();
			const next = new Date(dateTime).getTime();
			patch.date_time = dateTime;
			if (prev !== next && String(existing.status) !== 'cancelled') {
				notifyReschedule = true;
			}
		}

		if (!Object.keys(patch).length) {
			return json({ error: 'تغییری ارسال نشده' }, { status: 400 });
		}

		const updated = await pb.collection('appointments').update(id, patch, PB_NO_AUTO_CANCEL);

		try {
			if (notifyCancel) {
				await notifyAppointmentCancelled(pb, id);
			} else if (notifyReschedule) {
				await notifyAppointmentRescheduled(pb, id);
			}
		} catch (notifyErr) {
			console.error('appointment notification failed:', notifyErr);
		}

		return json({ id: updated.id, status: updated.status, date_time: updated.date_time });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در به‌روزرسانی نوبت';
		return json({ error: message }, { status: 500 });
	}
};
