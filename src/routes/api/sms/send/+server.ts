import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { renderSmsBody, type SmsTemplate } from '$lib/sms';

function canSendSms(role: string): boolean {
	return role === 'admin' || role === 'secretary';
}

/**
 * Queues SMS into sms_outbox. Provider integration is stubbed:
 * status = "stub" until Kavenegar (or similar) is configured.
 */
export const POST: RequestHandler = async ({ request }) => {
	const actor = await getAuthUserFromRequest(request);
	if (!actor) {
		return json({ ok: false, status: 'failed', error: 'احراز هویت لازم است' }, { status: 401 });
	}
	if (!canSendSms(actor.role)) {
		return json({ ok: false, status: 'failed', error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const to = String(body.to ?? '').replace(/\D/g, '');
		const template = body.template as SmsTemplate;
		const payload = (body.payload || {}) as Record<string, string | number>;
		const text =
			typeof body.body === 'string' && body.body
				? body.body
				: template
					? renderSmsBody(template, payload)
					: '';

		if (!to || to.length < 10) {
			return json({ ok: false, status: 'failed', error: 'شماره نامعتبر' }, { status: 400 });
		}
		if (!template && !text) {
			return json({ ok: false, status: 'failed', error: 'قالب یا متن لازم است' }, { status: 400 });
		}

		const pb = await getAdminPb();

		const record = await pb.collection('sms_outbox').create({
			to: to.startsWith('0') ? to : `0${to}`,
			template: template || 'custom',
			payload,
			body: text,
			status: 'stub',
			error: ''
		});

		return json({
			ok: true,
			status: 'stub',
			id: record.id
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در صف پیامک';
		return json({ ok: false, status: 'failed', error: message }, { status: 500 });
	}
};
