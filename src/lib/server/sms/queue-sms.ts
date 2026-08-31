import type PocketBase from 'pocketbase';
import type { SmsTemplate } from '$lib/sms';
import { renderSmsBody } from '$lib/sms';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export async function queueSms(
	pb: PocketBase,
	input: {
		to: string;
		template?: SmsTemplate;
		payload?: Record<string, string | number>;
		body?: string;
	}
): Promise<void> {
	const to = String(input.to).replace(/\D/g, '');
	if (to.length < 10) return;

	const body =
		input.body ||
		(input.template ? renderSmsBody(input.template, input.payload || {}) : '');

	await pb.collection('sms_outbox').create(
		{
			to: to.startsWith('0') ? to : `0${to}`,
			template: input.template || 'custom',
			payload: input.payload || {},
			body,
			status: 'stub',
			error: ''
		},
		PB_NO_AUTO_CANCEL
	);
}
