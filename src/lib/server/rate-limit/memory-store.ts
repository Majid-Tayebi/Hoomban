import type { RateLimitBucketResult, RateLimitStore } from './types';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export class MemoryRateLimitStore implements RateLimitStore {
	async increment(key: string, windowMs: number): Promise<RateLimitBucketResult> {
		const now = Date.now();
		const bucket = buckets.get(key);

		if (!bucket || now >= bucket.resetAt) {
			const resetAt = now + windowMs;
			buckets.set(key, { count: 1, resetAt });
			return { count: 1, resetAt };
		}

		bucket.count += 1;
		return { count: bucket.count, resetAt: bucket.resetAt };
	}
}

let memoryStore: MemoryRateLimitStore | null = null;

export function getMemoryRateLimitStore(): MemoryRateLimitStore {
	if (!memoryStore) memoryStore = new MemoryRateLimitStore();
	return memoryStore;
}
