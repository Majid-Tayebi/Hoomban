import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getServerPb } from '$lib/server/pocketbase';
import { updateProfilePassword } from '$lib/server/profile/update-profile';

/** POST /api/profile/password */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const pb = getServerPb();
		await updateProfilePassword(pb, user.token, user.id, {
			oldPassword: body.oldPassword ? String(body.oldPassword) : undefined,
			password: String(body.password ?? ''),
			passwordConfirm: String(body.passwordConfirm ?? '')
		});
		return json({ ok: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'تغییر رمز ناموفق بود';
		return json({ error: message }, { status: 400 });
	}
};
