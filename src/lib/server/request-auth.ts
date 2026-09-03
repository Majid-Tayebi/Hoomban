import type { Cookies } from '@sveltejs/kit';
import { resolveUserFromAuthToken } from '$lib/server/auth-token';
import { getSessionToken } from '$lib/server/session';

export type RequestAuthUser = {
	id: string;
	role: string;
	token: string;
};

async function resolveToken(token: string): Promise<RequestAuthUser | null> {
	const resolved = await resolveUserFromAuthToken(token);
	if (!resolved) return null;
	return {
		id: resolved.id,
		role: resolved.role,
		token: resolved.token
	};
}

/**
 * Resolve authenticated user from Bearer token or session cookie.
 * Bearer takes precedence when both are present.
 */
export async function getAuthUserFromRequest(
	request: Request,
	cookies?: Cookies
): Promise<RequestAuthUser | null> {
	const authHeader = request.headers.get('authorization') || '';
	if (authHeader.startsWith('Bearer ')) {
		const token = authHeader.slice(7).trim();
		if (token) {
			const user = await resolveToken(token);
			if (user) return user;
		}
	}

	if (cookies) {
		const sessionToken = getSessionToken(cookies);
		if (sessionToken) {
			const user = await resolveToken(sessionToken);
			if (user) return user;
		}
	}

	return null;
}

export function canManageAppointments(role: string): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'patient';
}
