import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';

export const POST: RequestHandler = async ({ request, params }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

	try {
		const pb = await getAdminPb();
		const row = await pb.collection('internal_messages').getOne(params.id);

		if (String(row.recipient) !== user.id && user.role !== 'admin') {
			return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
		}

		await pb.collection('internal_messages').update(params.id, {
			read_at: new Date().toISOString()
		});

		return json({ ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در علامت‌گذاری';
		return json({ error: message }, { status: 500 });
	}
};
