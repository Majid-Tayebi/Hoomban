import { env } from '$env/dynamic/private';
import PocketBase from 'pocketbase';
import { getServerPb } from '$lib/server/pocketbase';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

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

	const pb = getServerPb();
	try {
		pb.authStore.save(token, null as never);
		const auth = await pb.collection('users').authRefresh();
		const model = auth.record as { id?: string; role?: string };
		if (!model?.id) return null;
		return {
			id: model.id,
			role: String(model.role || 'patient'),
			token
		};
	} catch {
		/* fallback: fresh client instance */
		try {
			const userPb = new PocketBase(PB_URL);
			userPb.authStore.save(token, null as never);
			const auth = await userPb.collection('users').authRefresh();
			const model = auth.record as { id?: string; role?: string };
			if (!model?.id) return null;
			return {
				id: model.id,
				role: String(model.role || 'patient'),
				token
			};
		} catch {
			return null;
		}
	}
}

export function canManageAppointments(role: string): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'patient';
}
