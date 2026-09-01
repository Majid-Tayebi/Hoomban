import type PocketBase from 'pocketbase';
import type { SmsTemplate } from '$lib/sms';
import { renderSmsBody } from '$lib/sms';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { dispatchSmsOutbox, type SmsDispatchResult } from '$lib/server/sms/dispatch-sms';
import { isSmsDispatchAllowed, isSmsirConfigured } from '$lib/server/sms/smsir-config';

export type QueueSmsResult = SmsDispatchResult & { id?: string };

export async function queueSms(
	pb: PocketBase,
	input: {
		to: string;
		template?: SmsTemplate | string;
		payload?: Record<string, string | number>;
		body?: string;
	}
): Promise<QueueSmsResult> {
	const to = String(input.to).replace(/\D/g, '');
	if (to.length < 10) {
		return { status: 'failed', error: 'شماره نامعتبر' };
	}

	const normalizedTo = to.startsWith('0') ? to : `0${to}`;
	const body =
		input.body ||
		(input.template ? renderSmsBody(input.template as SmsTemplate, input.payload || {}) : '');

	const initialStatus = isSmsirConfigured()
		? isSmsDispatchAllowed()
			? 'pending'
			: 'queued'
		: 'stub';

	const record = await pb.collection('sms_outbox').create(
		{
			to: normalizedTo,
			template: input.template || 'custom',
			payload: input.payload || {},
			body,
			status: initialStatus,
			error: initialStatus === 'queued' ? 'ارسال واقعی فقط در محیط localhost فعال است' : ''
		},
		PB_NO_AUTO_CANCEL
	);

	return { ...(await dispatchSmsOutbox(pb, record)), id: record.id };
}
