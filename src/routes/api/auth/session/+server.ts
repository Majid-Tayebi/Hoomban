import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getSessionToken, setSessionCookie } from '$lib/server/session';
import { getServerPb } from '$lib/server/pocketbase';

/** Restore client auth state from httpOnly session cookie (SSR/E2E cookie-only login). */
export const GET: RequestHandler = async ({ cookies }) => {
	const token = getSessionToken(cookies);
	if (!token) {
		return json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
	}

	try {
		const pb = getServerPb();
		pb.authStore.save(token, null as never);
		const auth = await pb.collection('users').authRefresh();
		return json({
			token: auth.token,
			record: auth.record as Record<string, unknown>
		});
	} catch {
		return json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
	}
};

/** Sync httpOnly session cookie from an existing client Bearer token. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) {
		return json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
	}

	setSessionCookie(cookies, user.token);
	return json({
		ok: true,
		user: { id: user.id, role: user.role }
	});
};
