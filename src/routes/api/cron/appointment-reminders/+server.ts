import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import { runAppointmentReminders } from '$lib/server/notifications/reminder-notify';
import { timingSafeEqualString } from '$lib/server/security/timing-safe';

/** Cron endpoint: POST with header x-cron-secret matching CRON_SECRET env. */
export const POST: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		return json({ error: 'CRON_SECRET تنظیم نشده' }, { status: 503 });
	}
	const provided = request.headers.get('x-cron-secret') ?? '';
	if (!timingSafeEqualString(provided, secret)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const pb = await getAdminPb();
		const result = await runAppointmentReminders(pb);
		return json({ ok: true, ...result });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در یادآوری';
		return json({ error: message }, { status: 500 });
	}
};
