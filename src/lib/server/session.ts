import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { resolveUserFromAuthToken } from '$lib/server/auth-token';

export const SESSION_COOKIE = 'hoomban_auth';
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

	const resolved = await resolveUserFromAuthToken(token);
	if (!resolved) return null;

	return {
		id: resolved.id,
		role: resolved.role,
		name: resolved.name,
		email: resolved.email,
		mobile: resolved.mobile
	};
}
