import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

/** Recent SMS outbox (admin/secretary). Payload secrets are never returned. */
export const GET: RequestHandler = async ({ request, cookies, url }) => {
	const actor = await getAuthUserFromRequest(request, cookies);
	if (!actor || (actor.role !== 'admin' && actor.role !== 'secretary')) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage') || 20)));
	try {
		const pb = await getAdminPb();
		const res = await pb.collection('sms_outbox').getList(1, perPage, {
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
		const items = res.items.map((r) => ({
			id: r.id,
			to: String(r.to),
			template: String(r.template),
			status: String(r.status),
			body: String(r.body || ''),
			created: String(r.created || '')
		}));
		return json({ items });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بارگذاری صف پیامک';
		return json({ error: message, items: [] }, { status: 500 });
	}
};
