import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export const POST: RequestHandler = async ({ request }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	try {
		const pb = await getAdminPb();
		const unread = await pb.collection('notifications').getFullList({
			filter: `recipient = "${user.id}" && read_at = ""`,
			fields: 'id',
			...PB_NO_AUTO_CANCEL
		});

		const now = new Date().toISOString();
		for (const n of unread) {
			await pb.collection('notifications').update(n.id, { read_at: now }, PB_NO_AUTO_CANCEL);
		}

		return json({ ok: true, count: unread.length });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا';
		return json({ error: message }, { status: 500 });
	}
};
