import type PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import {
	canPatientCancelByTime,
	PATIENT_CANCEL_MIN_HOURS,
	PATIENT_CANCEL_TOO_LATE_MESSAGE
} from '$lib/appointments/cancellation-policy';
import { canCancelAppointmentStatus } from '$lib/appointments/services/appointment-actions';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

const REFUND_NOTE = '[درخواست استرداد: لغو توسط مراجع]';

export function getPatientCancelMinHours(): number {
	const raw = env.PATIENT_CANCEL_MIN_HOURS;
	if (raw) {
		const n = Number(raw);
		if (Number.isFinite(n) && n >= 0) return n;
	}
	return PATIENT_CANCEL_MIN_HOURS;
}

export function assertPatientCanCancelAppointment(existing: {
	status: string;
	date_time: string;
}): void {
	if (!canCancelAppointmentStatus(String(existing.status))) {
		throw new Error('این نوبت دیگر قابل لغو نیست');
	}
	const minHours = getPatientCancelMinHours();
	if (!canPatientCancelByTime(String(existing.date_time), minHours)) {
		throw new Error(PATIENT_CANCEL_TOO_LATE_MESSAGE);
	}
}

export async function markPaidGatewayTransactionsRefundPending(
	pb: PocketBase,
	appointmentId: string
): Promise<void> {
	const txs = await pb.collection('transactions').getFullList({
		filter: `appointment = ${JSON.stringify(appointmentId)} && gateway_status = "paid"`,
		...PB_NO_AUTO_CANCEL
	});

	for (const tx of txs) {
		const notes = String(tx.notes || '');
		await pb.collection('transactions').update(
			tx.id,
			{
				gateway_status: 'refund_pending',
				notes: notes.includes(REFUND_NOTE)
					? notes
					: notes
						? `${notes}\n${REFUND_NOTE}`
						: REFUND_NOTE
			},
			PB_NO_AUTO_CANCEL
		);
	}
}
