import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import {
	assertMobileAvailable,
	assertUsernameAvailable,
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const field = String(body.field ?? '');
		const authHeader = request.headers.get('authorization') || '';
		const token =
			(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || String(body.token ?? '');
		const excludeUserId =
			String(body.excludeUserId ?? '') || (await authUserId(token)) || undefined;

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

		return json({ error: 'فیلد نامعتبر است' }, { status: 400 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بررسی یکتایی';
		return json({ error: message }, { status: 500 });
	}
};
