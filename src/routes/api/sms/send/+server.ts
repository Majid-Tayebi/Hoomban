import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { renderSmsBody, type SmsTemplate } from '$lib/sms';
import { queueSms } from '$lib/server/sms/queue-sms';
import { isSmsDispatchAllowed, isSmsirConfigured } from '$lib/server/sms/smsir-config';

function canSendSms(role: string): boolean {
	return role === 'admin' || role === 'secretary';
}

/**
 * POST /api/sms/send — browser never calls SMS.ir.
 * Queue + dispatch (Verify/Bulk with X-API-KEY) run only inside this SvelteKit handler.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const actor = await getAuthUserFromRequest(request, cookies);
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
		const freeText =
			typeof body.body === 'string' && body.body.trim() ? body.body.trim().slice(0, 500) : '';
		// Free-text SMS is admin-only — secretaries must use approved templates.
		const text =
			freeText && actor.role === 'admin'
				? freeText
				: template
					? renderSmsBody(template, payload)
					: '';

		if (!to || to.length < 10) {
			return json({ ok: false, status: 'failed', error: 'شماره نامعتبر' }, { status: 400 });
		}
		if (!text) {
			return json(
				{
					ok: false,
					status: 'failed',
					error:
						actor.role === 'admin'
							? 'قالب یا متن لازم است'
							: 'ارسال پیامک فقط با قالب تأییدشده مجاز است'
				},
				{ status: 400 }
			);
		}

		const pb = await getAdminPb();
		const result = await queueSms(pb, {
			to,
			template: template || 'custom',
			payload,
			body: text
		});

		return json({
			ok: result.status === 'sent' || result.status === 'queued' || result.status === 'stub',
			status: result.status,
			id: result.id,
			error: result.error,
			configured: await isSmsirConfigured(),
			dispatchAllowed: await isSmsDispatchAllowed()
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در صف پیامک';
		return json({ ok: false, status: 'failed', error: message }, { status: 500 });
	}
};
