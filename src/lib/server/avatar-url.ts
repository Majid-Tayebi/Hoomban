import PocketBase from 'pocketbase';
import { env as publicEnv } from '$env/dynamic/public';

/** Browser-loadable avatar URL with auth token for protected users collection files. */
export function buildAvatarFileUrl(
	userId: string,
	avatar: unknown,
	opts?: { token?: string; updated?: unknown }
): string | null {
	if (!avatar) return null;
	const pbUrl = publicEnv.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
	const client = new PocketBase(pbUrl);
	const base = client.files.getURL(
		{ id: userId, collectionName: 'users' } as never,
		String(avatar),
		opts?.token ? { token: opts.token } : undefined
	);
	const cacheKey = opts?.updated ? String(opts.updated) : userId;
	return `${base}${base.includes('?') ? '&' : '?'}v=${encodeURIComponent(cacheKey)}`;
}
