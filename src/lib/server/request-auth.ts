import { resolveUserFromAuthToken } from '$lib/server/auth-token';

export type RequestAuthUser = {
	id: string;
	role: string;
	token: string;
};

/** Validate Bearer token via PocketBase authRefresh (same pattern as mobile-change API). */
export async function getAuthUserFromRequest(
	request: Request
): Promise<RequestAuthUser | null> {
	const authHeader = request.headers.get('authorization') || '';
	if (!authHeader.startsWith('Bearer ')) return null;

	const token = authHeader.slice(7).trim();
	if (!token) return null;

	const resolved = await resolveUserFromAuthToken(token);
	if (!resolved) return null;

	return {
		id: resolved.id,
		role: resolved.role,
		token: resolved.token
	};
}

export function canManageAppointments(role: string): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'patient';
}
