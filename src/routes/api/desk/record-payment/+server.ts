import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { notifyPaymentRecorded } from '$lib/server/notifications/payment-notify';
import { derivePaymentStatus } from '$lib/desk/payment-status';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'gateway' | 'other';

function canRecordPayment(role: string): boolean {
	return role === 'admin' || role === 'secretary';
}

export const POST: RequestHandler = async ({ request }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	if (!canRecordPayment(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const patientUserId = String(body.patientUserId ?? '');
		const title = String(body.title ?? '').trim();
		const expectedAmount = Number(body.expectedAmount ?? 0);
		const paidAmount = Number(body.paidAmount ?? 0);
		const waivedAmount = Number(body.waivedAmount ?? 0);
		const method = body.method as PaymentMethod | undefined;
		const notes = String(body.notes ?? '');
		const appointmentId = body.appointmentId ? String(body.appointmentId) : undefined;
		const transactionId = body.transactionId ? String(body.transactionId) : undefined;

		if (!patientUserId || !title) {
			return json({ error: 'مراجع و عنوان الزامی است' }, { status: 400 });
		}

		if (waivedAmount < 0 || paidAmount < 0) {
			return json({ error: 'مبالغ نامعتبر است' }, { status: 400 });
		}

		if (paidAmount + waivedAmount > expectedAmount) {
			return json({ error: 'جمع پرداخت و بخشودگی بیشتر از مبلغ کل است' }, { status: 400 });
		}

		const status = derivePaymentStatus(expectedAmount, paidAmount, waivedAmount);

		const payload: Record<string, unknown> = {
			patient: patientUserId,
			title,
			expected_amount: expectedAmount,
			paid_amount: paidAmount,
			waived_amount: waivedAmount,
			status,
			notes,
			created_by: user.id
		};
		if (appointmentId) payload.appointment = appointmentId;
		if (paidAmount > 0 && method) {
			payload.method = method;
			payload.paid_at = new Date().toISOString().slice(0, 10);
		}

		const pb = await getAdminPb();
		const record = transactionId
			? await pb.collection('transactions').update(transactionId, payload, PB_NO_AUTO_CANCEL)
			: await pb.collection('transactions').create(payload, PB_NO_AUTO_CANCEL);

		try {
			await notifyPaymentRecorded(pb, {
				patientUserId,
				title,
				paidAmount,
				transactionId: String(record.id)
			});
		} catch (notifyErr) {
			console.error('payment notification failed:', notifyErr);
		}

		return json({
			transactionId: record.id,
			status: record.status,
			paidAmount: Number(record.paid_amount || 0),
			waivedAmount: Number(record.waived_amount || 0)
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت پرداخت';
		return json({ error: message }, { status: 500 });
	}
};
