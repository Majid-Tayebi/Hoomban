import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jsonWithSession } from '$lib/server/auth-response';
import { getServerPb } from '$lib/server/pocketbase';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const identity = String(body.username ?? body.identity ?? '').trim().replace(/^@+/, '');
		const password = String(body.password ?? '');

		if (!identity || !password) {
			return json({ error: 'نام کاربری و رمز عبور را وارد کنید' }, { status: 400 });
		}

		const pb = getServerPb();
		const auth = await pb.collection('users').authWithPassword(identity, password);

		return jsonWithSession(cookies, {
			token: auth.token,
			record: auth.record as Record<string, unknown>
		});
	} catch {
		return json({ error: 'نام کاربری یا رمز عبور نادرست است' }, { status: 401 });
	}
};
