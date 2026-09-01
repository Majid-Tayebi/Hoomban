import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getServerPb } from '$lib/server/pocketbase';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export type ResolvedAuthUser = {
	id: string;
	role: string;
	token: string;
	name?: string;
	email?: string;
	mobile?: string;
};

type JwtPayload = {
	id?: string;
	exp?: number;
	refreshable?: boolean;
};

export function decodeAuthJwt(token: string): JwtPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
		return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as JwtPayload;
	} catch {
		return null;
	}
}

function isExpired(payload: JwtPayload | null): boolean {
	if (!payload?.exp) return true;
	return payload.exp * 1000 <= Date.now();
}

/** Validate a PocketBase users token via authRefresh; impersonation tokens validated by PB API. */
export async function resolveUserFromAuthToken(token: string): Promise<ResolvedAuthUser | null> {
	if (!token.trim()) return null;

	const pb = getServerPb();
	pb.authStore.save(token, null as never);

	try {
		const auth = await pb.collection('users').authRefresh();
		const model = auth.record as {
			id?: string;
			role?: string;
			name?: string;
			email?: string;
			mobile?: string;
		};
		if (!model?.id) return null;
		return {
			id: model.id,
			role: String(model.role || 'patient'),
			token,
			name: model.name,
			email: model.email,
			mobile: model.mobile
		};
	} catch {
		const payload = decodeAuthJwt(token);
		if (!payload?.id || isExpired(payload) || payload.refreshable !== false) {
			return null;
		}

		try {
			const userPb = new PocketBase(PB_URL);
			userPb.authStore.save(token, null as never);
			const record = await userPb.collection('users').getOne(payload.id);
			return {
				id: record.id,
				role: String(record.role || 'patient'),
				token,
				name: record.name as string | undefined,
				email: record.email as string | undefined,
				mobile: record.mobile as string | undefined
			};
		} catch {
			return null;
		}
	}
}
