import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { deletePushSubscription } from '$lib/server/push/subscriptions';

export const POST: RequestHandler = async ({ request }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

	try {
		const body = await request.json();
		const endpoint = String(body.endpoint ?? '');
		if (!endpoint) {
			return json({ error: 'endpoint الزامی است' }, { status: 400 });
		}

		const pb = await getAdminPb();
		await deletePushSubscription(pb, user.id, endpoint);
		return json({ ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'لغو اشتراک ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
