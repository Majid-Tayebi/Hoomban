import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { upsertPushSubscription } from '$lib/server/push/subscriptions';
import { isVapidConfigured } from '$lib/server/push/vapid';

export const POST: RequestHandler = async ({ request }) => {
	if (!isVapidConfigured()) {
		return json({ error: 'Web Push پیکربندی نشده' }, { status: 503 });
	}

	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

	try {
		const body = await request.json();
		const endpoint = String(body.endpoint ?? '');
		const p256dh = String(body.keys?.p256dh ?? '');
		const auth = String(body.keys?.auth ?? '');

		if (!endpoint || !p256dh || !auth) {
			return json({ error: 'اشتراک نامعتبر است' }, { status: 400 });
		}

		const pb = await getAdminPb();
		await upsertPushSubscription(
			pb,
			user.id,
			{ endpoint, keys: { p256dh, auth } },
			request.headers.get('user-agent') ?? undefined
		);

		return json({ ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ثبت اشتراک ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
