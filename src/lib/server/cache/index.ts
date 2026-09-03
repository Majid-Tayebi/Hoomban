import { getRedisClient, isRedisConfigured } from '$lib/server/rate-limit/redis-store';

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memoryGet(key: string): string | null {
	const entry = memoryStore.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		memoryStore.delete(key);
		return null;
	}
	return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
	memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheGet(key: string): Promise<string | null> {
	const redisKey = `hoomban:cache:${key}`;
	if (isRedisConfigured()) {
		const client = await getRedisClient();
		if (client) return client.get(redisKey);
	}
	return memoryGet(redisKey);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
	const redisKey = `hoomban:cache:${key}`;
	if (isRedisConfigured()) {
		const client = await getRedisClient();
		if (client) {
			await client.set(redisKey, value, { EX: Math.max(1, ttlSeconds) });
			return;
		}
	}
	memorySet(redisKey, value, ttlSeconds);
}

export async function getCachedJson<T>(
	key: string,
	ttlSeconds: number,
	fetcher: () => Promise<T>
): Promise<T> {
	const cached = await cacheGet(key);
	if (cached) {
		try {
			return JSON.parse(cached) as T;
		} catch {
			// stale/corrupt — refetch
		}
	}

	const fresh = await fetcher();
	await cacheSet(key, JSON.stringify(fresh), ttlSeconds);
	return fresh;
}

export function publicCacheHeaders(maxAgeSeconds: number): Record<string, string> {
	return {
		'Cache-Control': `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`
	};
}
