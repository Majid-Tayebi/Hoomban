import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jsonWithSession } from '$lib/server/auth-response';
import { getServerPb } from '$lib/server/pocketbase';
import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';
import { isDevAuthEnabled } from '$lib/server/dev-auth';

/**
 * POST /api/auth/login
 * Authenticate with username (or mobile) + password.
 * Sets httpOnly session cookie and returns PocketBase token + user record.
 * Rate limited: 15 requests / 15 min per IP (skipped when DEV_DEMO_AUTH).
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		if (!isDevAuthEnabled()) {
			const rateLimit = await enforceAuthRateLimit(request, {
				endpoint: 'auth-login',
				ipLimit: 15
			});
			if (!rateLimit.ok) {
				return json({ error: rateLimitErrorMessage(rateLimit) }, { status: 429 });
			}
		}

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
