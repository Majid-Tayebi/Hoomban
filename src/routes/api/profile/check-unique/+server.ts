import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';
import {
	assertMobileAvailable,
	assertUsernameAvailable,
	assertEmailAvailable,
	normalizeMobile,
	normalizeUsername
} from '$lib/server/user-uniqueness';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

async function authUserId(token: string): Promise<string | null> {
	if (!token) return null;
	const userPb = new PocketBase(PB_URL);
	userPb.authStore.save(token, null as never);
	try {
		const refreshed = await userPb.collection('users').authRefresh();
		return refreshed.record.id;
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const rateLimit = await enforceAuthRateLimit(request, {
			endpoint: 'profile-check-unique',
			ipLimit: 30
		});
		if (!rateLimit.ok) {
			return json({ error: rateLimitErrorMessage(rateLimit) }, { status: 429 });
		}

		const authUser = await getAuthUserFromRequest(request, cookies);
		const body = await request.json();
		const field = String(body.field ?? '');
		const authHeader = request.headers.get('authorization') || '';
		const token =
			(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || String(body.token ?? '');

		const resolvedUserId = authUser?.id || (token ? await authUserId(token) : null);
		if (!resolvedUserId) {
			return json({ error: 'احراز هویت لازم است' }, { status: 401 });
		}

		const excludeUserId = String(body.excludeUserId ?? '') || resolvedUserId;

		if (field === 'mobile') {
			const mobile = normalizeMobile(String(body.value ?? body.mobile ?? ''));
			const pb = await getAdminPb();
			const result = await assertMobileAvailable(pb, mobile, { excludeUserId });
			if (!result.ok) return json({ available: false, error: result.error }, { status: 409 });
			return json({ available: true, value: mobile });
		}

		if (field === 'username') {
			const username = normalizeUsername(String(body.value ?? body.username ?? ''));
			if (!username) return json({ available: true, value: '' });
			const pb = await getAdminPb();
			const result = await assertUsernameAvailable(pb, username, { excludeUserId });
			if (!result.ok) return json({ available: false, error: result.error }, { status: 409 });
			return json({ available: true, value: result.username });
		}

		if (field === 'email') {
			const email = String(body.value ?? body.email ?? '');
			const pb = await getAdminPb();
			const result = await assertEmailAvailable(pb, email, { excludeUserId });
			if (!result.ok) return json({ available: false, error: result.error }, { status: 409 });
			return json({ available: true, value: result.email });
		}

		return json({ error: 'فیلد نامعتبر است' }, { status: 400 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بررسی یکتایی';
		return json({ error: message }, { status: 500 });
	}
};
