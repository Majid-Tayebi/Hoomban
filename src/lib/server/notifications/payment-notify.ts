import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { createNotificationsForUsers } from '$lib/server/notifications/create';

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

export async function notifyPaymentRecorded(
	pb: PocketBase,
	params: {
		patientUserId: string;
		title: string;
		paidAmount: number;
		transactionId: string;
	}
): Promise<void> {
	if (params.paidAmount <= 0) return;

	const amountLabel = params.paidAmount.toLocaleString('fa-IR');
	const metadata = { transactionId: params.transactionId, kind: 'payment_recorded' };

	await createNotificationsForUsers(pb, [params.patientUserId], {
		type: 'system',
		title: 'ثبت پرداخت',
		body: `پرداخت ${amountLabel} تومان برای «${params.title}» ثبت شد.`,
		href: '/dashboard',
		metadata
	});

	const staffIds = await staffUserIds(pb);
	if (staffIds.length) {
		await createNotificationsForUsers(pb, staffIds, {
			type: 'system',
			title: 'ثبت پرداخت',
			body: `پرداخت ${amountLabel} تومان در حسابداری ثبت شد.`,
			href: '/dashboard/desk/accounting',
			metadata
		});
	}
}
