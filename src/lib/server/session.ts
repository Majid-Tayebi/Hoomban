import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { resolveUserFromAuthToken } from '$lib/server/auth-token';
import { appAvatarUrl } from '$lib/avatar-url';

export const SESSION_COOKIE = 'hoomban_auth';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Only set Secure cookies over HTTPS — HTTP production (no TLS yet) must stay false. */
function sessionCookieSecure(): boolean {
	if (env.COOKIE_SECURE === 'true') return true;
	if (env.COOKIE_SECURE === 'false') return false;
	const origin = (env.ORIGIN || env.PUBLIC_APP_URL || '').trim();
	return origin.startsWith('https://');
}

export type SessionUser = {
	id: string;
	role: string;
	name?: string;
	email?: string;
	mobile?: string;
	avatar?: string;
	avatarUrl?: string | null;
};

export function setSessionCookie(cookies: Cookies, token: string) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: sessionCookieSecure(),
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
		mobile: resolved.mobile,
		avatar: resolved.avatar,
		avatarUrl: appAvatarUrl(resolved.id, resolved.avatar, resolved.updated)
	};
}
