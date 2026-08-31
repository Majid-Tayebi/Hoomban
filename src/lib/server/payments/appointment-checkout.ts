import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { notifyAppointmentCreated } from '$lib/server/notifications/appointment-notify';
import { notifyPaymentRecorded } from '$lib/server/notifications/payment-notify';
import {
	getZarinpalCallbackUrl,
	getPublicAppUrl,
	isZarinpalConfigured
} from '$lib/server/payments/zarinpal-config';
import {
	getZarinpalStartPayUrl,
	tomanToRial,
	zarinpalRequestPayment,
	zarinpalVerifyPayment,
	ZarinpalError
} from '$lib/server/payments/zarinpal';

export type CheckoutBookingInput = {
	patientId: string;
	doctorId: string;
	dateTime: string;
	type: 'in_person' | 'service';
	notesPublic?: string;
	amountToman: number;
	title: string;
	mobile?: string;
	email?: string;
	origin?: string;
};

export async function resolveBookingAmountToman(
	pb: PocketBase,
	params: {
		doctorId: string;
		type: 'in_person' | 'service';
		servicePriceToman?: number;
	}
): Promise<number> {
	if (params.type === 'service') {
		return Math.max(0, Math.round(Number(params.servicePriceToman || 0)));
	}
	const doctor = await pb.collection('doctors').getOne(params.doctorId, PB_NO_AUTO_CANCEL);
	return Math.max(0, Math.round(Number(doctor.visit_fee || 0)));
}

export async function startAppointmentCheckout(
	pb: PocketBase,
	input: CheckoutBookingInput
): Promise<{ paymentUrl: string; authority: string; appointmentId: string; transactionId: string }> {
	if (!isZarinpalConfigured()) {
		throw new ZarinpalError('درگاه پرداخت آنلاین فعال نیست');
	}

	const amountToman = Math.round(input.amountToman);
	const amountRial = tomanToRial(amountToman);
	if (amountRial < 1000) {
		throw new ZarinpalError('مبلغ این نوبت برای پرداخت آنلاین کافی نیست');
	}

	const appointment = await pb.collection('appointments').create(
		{
			patient: input.patientId,
			doctor: input.doctorId,
			date_time: input.dateTime,
			status: 'pending',
			type: input.type,
			...(input.notesPublic ? { notes_public: input.notesPublic } : {})
		},
		PB_NO_AUTO_CANCEL
	);

	const callbackUrl = getZarinpalCallbackUrl(input.origin);
	const { authority } = await zarinpalRequestPayment({
		amountRial,
		description: input.title,
		callbackUrl,
		mobile: input.mobile,
		email: input.email
	});

	const transaction = await pb.collection('transactions').create(
		{
			patient: input.patientId,
			appointment: appointment.id,
			title: input.title,
			expected_amount: amountToman,
			paid_amount: 0,
			status: 'unpaid',
			gateway: 'zarinpal',
			gateway_authority: authority,
			gateway_status: 'pending',
			amount_rial: amountRial,
			notes: `checkout:${getPublicAppUrl(input.origin)}`
		},
		PB_NO_AUTO_CANCEL
	);

	return {
		paymentUrl: getZarinpalStartPayUrl(authority),
		authority,
		appointmentId: String(appointment.id),
		transactionId: String(transaction.id)
	};
}

export async function finalizeZarinpalCallback(
	pb: PocketBase,
	params: { authority: string; status: string | null }
): Promise<{ ok: boolean; refId?: string; appointmentId?: string; message: string }> {
	const authority = params.authority.trim();
	if (!authority) {
		return { ok: false, message: 'شناسه پرداخت نامعتبر است' };
	}

	let transaction;
	try {
		transaction = await pb.collection('transactions').getFirstListItem(
			`gateway_authority = ${JSON.stringify(authority)}`,
			PB_NO_AUTO_CANCEL
		);
	} catch {
		return { ok: false, message: 'تراکنش پرداخت یافت نشد' };
	}

	const appointmentId = transaction.appointment ? String(transaction.appointment) : undefined;
	const gatewayStatus = String(transaction.gateway_status || '');

	if (gatewayStatus === 'paid') {
		return {
			ok: true,
			refId: transaction.gateway_ref_id ? String(transaction.gateway_ref_id) : undefined,
			appointmentId,
			message: 'این پرداخت قبلاً تأیید شده است'
		};
	}

	if (params.status !== 'OK' && params.status !== 'ok') {
		await pb.collection('transactions').update(
			transaction.id,
			{ gateway_status: 'cancelled' },
			PB_NO_AUTO_CANCEL
		);
		if (appointmentId) {
			await pb.collection('appointments').update(
				appointmentId,
				{ status: 'cancelled' },
				PB_NO_AUTO_CANCEL
			);
		}
		return { ok: false, appointmentId, message: 'پرداخت توسط کاربر لغو شد' };
	}

	const amountRial = Number(transaction.amount_rial || 0);
	const amountToman = Number(transaction.expected_amount || 0);

	try {
		const { refId } = await zarinpalVerifyPayment({ authority, amountRial });
		const paidAt = new Date().toISOString().slice(0, 10);

		await pb.collection('transactions').update(
			transaction.id,
			{
				paid_amount: amountToman,
				status: 'paid',
				method: 'gateway',
				paid_at: paidAt,
				gateway_status: 'paid',
				gateway_ref_id: refId
			},
			PB_NO_AUTO_CANCEL
		);

		if (appointmentId) {
			await pb.collection('appointments').update(
				appointmentId,
				{ status: 'reserved' },
				PB_NO_AUTO_CANCEL
			);
			try {
				await notifyAppointmentCreated(pb, appointmentId);
			} catch (notifyErr) {
				console.error('appointment notification failed:', notifyErr);
			}
		}

		try {
			await notifyPaymentRecorded(pb, {
				patientUserId: String(transaction.patient),
				title: String(transaction.title || 'پرداخت آنلاین'),
				paidAmount: amountToman,
				transactionId: String(transaction.id)
			});
		} catch (notifyErr) {
			console.error('payment notification failed:', notifyErr);
		}

		return { ok: true, refId, appointmentId, message: 'پرداخت با موفقیت انجام شد' };
	} catch (err) {
		await pb.collection('transactions').update(
			transaction.id,
			{ gateway_status: 'failed' },
			PB_NO_AUTO_CANCEL
		);
		if (appointmentId) {
			await pb.collection('appointments').update(
				appointmentId,
				{ status: 'cancelled' },
				PB_NO_AUTO_CANCEL
			);
		}
		const message = err instanceof ZarinpalError ? err.message : 'تأیید پرداخت ناموفق بود';
		return { ok: false, appointmentId, message };
	}
}
