import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';

export const POST: RequestHandler = async ({ request, params }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

	try {
		const body = await request.json();
		const starred = Boolean(body.starred);

		const pb = await getAdminPb();
		const row = await pb.collection('internal_messages').getOne(params.id);
		const senderId = String(row.sender);
		const recipientId = String(row.recipient);

		if (user.id !== senderId && user.id !== recipientId && user.role !== 'admin') {
			return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
		}

		await pb.collection('internal_messages').update(params.id, { starred });
		return json({ ok: true, starred });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در به‌روزرسانی';
		return json({ error: message }, { status: 500 });
	}
};
