import { createClient, type RedisClientType } from 'redis';
import { env } from '$env/dynamic/private';
import type { RateLimitBucketResult, RateLimitStore } from './types';

export class RedisRateLimitStore implements RateLimitStore {
	constructor(private readonly client: RedisClientType) {}

	async increment(key: string, windowMs: number): Promise<RateLimitBucketResult> {
		const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
		const redisKey = `hoomban:rl:${key}`;

		const count = await this.client.incr(redisKey);
		if (count === 1) {
			await this.client.expire(redisKey, windowSec);
		}

		const ttl = await this.client.ttl(redisKey);
		const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
		return { count, resetAt };
	}
}

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;
let redisStore: RedisRateLimitStore | null = null;

export function isRedisConfigured(): boolean {
	return Boolean(env.REDIS_URL?.trim());
}

export async function getRedisClient(): Promise<RedisClientType | null> {
	const url = env.REDIS_URL?.trim();
	if (!url) return null;

	if (client?.isOpen) return client;

	if (!connectPromise) {
		connectPromise = (async () => {
			const next = createClient({ url });
			next.on('error', (err) => console.error('[redis]', err));
			await next.connect();
			client = next;
			return next;
		})().catch((err) => {
			connectPromise = null;
			console.error('[redis] connect failed — falling back to memory rate limit', err);
			throw err;
		});
	}

	try {
		return await connectPromise;
	} catch {
		return null;
	}
}

export async function getRedisRateLimitStore(): Promise<RedisRateLimitStore | null> {
	const redis = await getRedisClient();
	if (!redis) return null;
	if (!redisStore) redisStore = new RedisRateLimitStore(redis);
	return redisStore;
}
