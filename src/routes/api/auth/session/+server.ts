import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { setSessionCookie } from '$lib/server/session';

/** Sync httpOnly session cookie from an existing client Bearer token. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) {
		return json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
	}

	setSessionCookie(cookies, user.token);
	return json({
		ok: true,
		user: { id: user.id, role: user.role }
	});
};
