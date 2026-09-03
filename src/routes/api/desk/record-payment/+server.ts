import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { notifyPaymentRecorded } from '$lib/server/notifications/payment-notify';
import { derivePaymentStatus } from '$lib/desk/payment-status';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'gateway' | 'other';

const MAX_AMOUNT_TOMAN = 500_000_000;

function canRecordPayment(role: string): boolean {
	return role === 'admin' || role === 'secretary';
}

function roundToman(n: number): number {
	return Math.max(0, Math.round(Number(n) || 0));
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	if (!canRecordPayment(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const patientUserId = String(body.patientUserId ?? '');
		const title = String(body.title ?? '').trim().slice(0, 200);
		let expectedAmount = roundToman(body.expectedAmount);
		let paidAmount = roundToman(body.paidAmount);
		let waivedAmount = roundToman(body.waivedAmount);
		const method = body.method as PaymentMethod | undefined;
		const notes = String(body.notes ?? '').slice(0, 2000);
		const appointmentId = body.appointmentId ? String(body.appointmentId) : undefined;
		const transactionId = body.transactionId ? String(body.transactionId) : undefined;

		if (!patientUserId || !title) {
			return json({ error: 'مراجع و عنوان الزامی است' }, { status: 400 });
		}

		const pb = await getAdminPb();

		// Updating an existing row: never let the client raise expected_amount above DB value.
		if (transactionId) {
			const existing = await pb.collection('transactions').getOne(transactionId, PB_NO_AUTO_CANCEL);
			if (String(existing.patient) !== patientUserId) {
				return json({ error: 'تراکنش متعلق به این مراجع نیست' }, { status: 403 });
			}
			const dbExpected = roundToman(existing.expected_amount);
			expectedAmount = dbExpected > 0 ? dbExpected : expectedAmount;
			const alreadyPaid = roundToman(existing.paid_amount);
			const alreadyWaived = roundToman(existing.waived_amount);
			if (paidAmount < alreadyPaid || waivedAmount < alreadyWaived) {
				return json({ error: 'کاهش مبلغ پرداخت‌شده مجاز نیست' }, { status: 400 });
			}
		}

		if (expectedAmount <= 0 || expectedAmount > MAX_AMOUNT_TOMAN) {
			return json({ error: 'مبلغ کل نامعتبر است' }, { status: 400 });
		}
		if (paidAmount > MAX_AMOUNT_TOMAN || waivedAmount > MAX_AMOUNT_TOMAN) {
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
