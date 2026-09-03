import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import {
	notifyAppointmentCancelled,
	notifyAppointmentRescheduled
} from '$lib/server/notifications/appointment-notify';
import {
	assertPatientCanCancelAppointment,
	markPaidGatewayTransactionsRefundPending
} from '$lib/server/appointments/patient-cancel';

function canPatchAppointment(role: string): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'patient';
}

async function assertSlotAvailable(
	pb: Awaited<ReturnType<typeof getAdminPb>>,
	params: { doctorId: string; dateTime: string; excludeAppointmentId: string }
): Promise<void> {
	const existing = await pb.collection('appointments').getList(1, 1, {
		filter: `doctor = "${params.doctorId}" && date_time = "${params.dateTime}" && status != "cancelled" && id != "${params.excludeAppointmentId}"`,
		...PB_NO_AUTO_CANCEL
	});
	if (existing.items.length) {
		throw new Error('این زمان برای متخصص انتخاب‌شده قبلاً رزرو شده است');
	}
}

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
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

		if (user.role === 'patient') {
			if (String(existing.patient) !== user.id) {
				return json({ error: 'فقط نوبت خودتان را می‌توانید ویرایش کنید' }, { status: 403 });
			}
			if (String(existing.status) === 'cancelled' || String(existing.status) === 'completed') {
				return json({ error: 'این نوبت دیگر قابل ویرایش نیست' }, { status: 400 });
			}

			const wantsCancel = body.status !== undefined && String(body.status) === 'cancelled';
			const wantsScheduleChange = body.doctorId !== undefined || body.dateTime !== undefined;

			if (wantsCancel) {
				if (String(body.status) !== 'cancelled') {
					return json({ error: 'تغییر وضعیت مجاز نیست' }, { status: 403 });
				}
				if (wantsScheduleChange) {
					return json({ error: 'لغو نوبت را جدا از ویرایش زمان انجام دهید' }, { status: 400 });
				}
				try {
					assertPatientCanCancelAppointment({
						status: String(existing.status),
						date_time: String(existing.date_time)
					});
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : 'لغو نوبت مجاز نیست';
					return json({ error: message }, { status: 400 });
				}
			} else if (body.status !== undefined) {
				return json({ error: 'تغییر وضعیت مجاز نیست' }, { status: 403 });
			}
		}

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
			if (user.role === 'patient') {
				patch.status = 'cancelled';
			} else {
				patch.status = status;
			}
			if (status === 'cancelled' && String(existing.status) !== 'cancelled') {
				notifyCancel = true;
			}
		}

		const nextDoctorId =
			body.doctorId !== undefined ? String(body.doctorId) : String(existing.doctor || '');
		const nextDateTime =
			body.dateTime !== undefined ? String(body.dateTime) : String(existing.date_time || '');

		if (body.doctorId !== undefined) {
			if (!nextDoctorId) {
				return json({ error: 'متخصص نامعتبر است' }, { status: 400 });
			}
			try {
				await pb.collection('doctors').getOne(nextDoctorId, PB_NO_AUTO_CANCEL);
			} catch {
				return json({ error: 'متخصص یافت نشد' }, { status: 400 });
			}
			patch.doctor = nextDoctorId;
		}

		if (body.dateTime !== undefined) {
			patch.date_time = nextDateTime;
		}

		if (!Object.keys(patch).length) {
			return json({ error: 'تغییری ارسال نشده' }, { status: 400 });
		}

		const prevDoctor = String(existing.doctor || '');
		const prevTime = new Date(String(existing.date_time)).getTime();
		const nextTime = new Date(nextDateTime).getTime();
		const scheduleChanged = prevDoctor !== nextDoctorId || prevTime !== nextTime;

		if (scheduleChanged && String(existing.status) !== 'cancelled') {
			await assertSlotAvailable(pb, {
				doctorId: nextDoctorId,
				dateTime: nextDateTime,
				excludeAppointmentId: id
			});
			notifyReschedule = true;
		}

		const updated = await pb.collection('appointments').update(id, patch, PB_NO_AUTO_CANCEL);

		if (notifyCancel && user.role === 'patient') {
			try {
				await markPaidGatewayTransactionsRefundPending(pb, id);
			} catch (refundErr) {
				console.error('refund_pending marking failed:', refundErr);
			}
		}

		try {
			if (notifyCancel) {
				await notifyAppointmentCancelled(pb, id);
			} else if (notifyReschedule) {
				await notifyAppointmentRescheduled(pb, id);
			}
		} catch (notifyErr) {
			console.error('appointment notification failed:', notifyErr);
		}

		return json({
			id: updated.id,
			status: updated.status,
			date_time: updated.date_time,
			doctor: updated.doctor
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در به‌روزرسانی نوبت';
		return json({ error: message }, { status: 500 });
	}
};
