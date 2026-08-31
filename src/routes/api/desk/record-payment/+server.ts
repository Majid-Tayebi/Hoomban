import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { notifyPaymentRecorded } from '$lib/server/notifications/payment-notify';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

function canRecordPayment(role: string): boolean {
	return role === 'admin' || role === 'secretary';
}

function deriveStatus(expected: number, paid: number): string {
	if (paid <= 0) return 'unpaid';
	if (paid >= expected) return 'paid';
	return 'partial';
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
		const method = body.method as PaymentMethod | undefined;
		const notes = String(body.notes ?? '');
		const appointmentId = body.appointmentId ? String(body.appointmentId) : undefined;
		const transactionId = body.transactionId ? String(body.transactionId) : undefined;
		const statusOverride = body.statusOverride ? String(body.statusOverride) : undefined;

		if (!patientUserId || !title) {
			return json({ error: 'مراجع و عنوان الزامی است' }, { status: 400 });
		}

		const status =
			statusOverride ?? deriveStatus(expectedAmount, paidAmount);

		const payload: Record<string, unknown> = {
			patient: patientUserId,
			title,
			expected_amount: expectedAmount,
			paid_amount: paidAmount,
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
			paidAmount: Number(record.paid_amount || 0)
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت پرداخت';
		return json({ error: message }, { status: 500 });
	}
};
