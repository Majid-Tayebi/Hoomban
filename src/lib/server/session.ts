import type { Cookies } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

export const SESSION_COOKIE = 'hoomban_auth';
const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
	id: string;
	role: string;
	name?: string;
	email?: string;
	mobile?: string;
};

export function setSessionCookie(cookies: Cookies, token: string) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionToken(cookies: Cookies): string | null {
	return cookies.get(SESSION_COOKIE) ?? null;
}

export async function getSessionUser(cookies: Cookies): Promise<SessionUser | null> {
	const token = getSessionToken(cookies);
	if (!token) return null;

	const pb = new PocketBase(PB_URL);
	try {
		pb.authStore.save(token, null as never);
		const auth = await pb.collection('users').authRefresh();
		const model = auth.record as unknown as SessionUser & { id?: string };
		if (!model?.id) return null;
		return {
			id: model.id,
			role: String(model.role || 'patient'),
			name: model.name,
			email: model.email,
			mobile: model.mobile
		};
	} catch {
		return null;
	}
}
