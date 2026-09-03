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
	avatar?: string;
	updated?: string;
};

type JwtPayload = {
	id?: string;
	exp?: number;
	refreshable?: boolean;
};

const RESOLVE_CACHE_TTL_MS = 60_000;
const resolveCache = new Map<string, { at: number; user: ResolvedAuthUser }>();

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

function mapResolved(
	token: string,
	model: {
		id?: string;
		role?: string;
		name?: string;
		email?: string;
		mobile?: string;
		avatar?: string;
		updated?: string;
	}
): ResolvedAuthUser | null {
	if (!model?.id) return null;
	return {
		id: model.id,
		role: String(model.role || 'patient'),
		token,
		name: model.name,
		email: model.email,
		mobile: model.mobile,
		avatar: model.avatar ? String(model.avatar) : undefined,
		updated: model.updated ? String(model.updated) : undefined
	};
}

function cacheResolved(token: string, user: ResolvedAuthUser) {
	resolveCache.set(token, { at: Date.now(), user });
}

/** Validate a PocketBase users token via authRefresh; impersonation tokens validated by PB API. */
export async function resolveUserFromAuthToken(token: string): Promise<ResolvedAuthUser | null> {
	if (!token.trim()) return null;

	const cached = resolveCache.get(token);
	if (cached && Date.now() - cached.at < RESOLVE_CACHE_TTL_MS) {
		return cached.user;
	}

	const payload = decodeAuthJwt(token);
	if (payload?.exp && !isExpired(payload) && payload.exp * 1000 - Date.now() > 5 * 60_000) {
		if (cached) return cached.user;
	}

	const pb = getServerPb();
	pb.authStore.save(token, null as never);

	try {
		const auth = await pb.collection('users').authRefresh();
		const resolved = mapResolved(token, auth.record as never);
		if (resolved) cacheResolved(token, resolved);
		return resolved;
	} catch {
		if (!payload?.id || isExpired(payload) || payload.refreshable !== false) {
			return null;
		}

		try {
			const userPb = new PocketBase(PB_URL);
			userPb.authStore.save(token, null as never);
			const record = await userPb.collection('users').getOne(payload.id);
			const resolved = mapResolved(token, record as never);
			if (resolved) cacheResolved(token, resolved);
			return resolved;
		} catch {
			return null;
		}
	}
}
