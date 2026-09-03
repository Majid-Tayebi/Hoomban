import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	const id = params.id;
	if (!id) {
		return json({ error: 'شناسه نامعتبر' }, { status: 400 });
	}

	try {
		const pb = await getAdminPb();
		const record = await pb.collection('notifications').getOne(id);
		if (String(record.recipient) !== user.id) {
			return json({ error: 'دسترسی ندارید' }, { status: 403 });
		}

		await pb.collection('notifications').update(id, {
			read_at: new Date().toISOString()
		});

		return json({ ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا';
		return json({ error: message }, { status: 500 });
	}
};
