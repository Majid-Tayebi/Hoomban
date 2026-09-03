import { getMemoryRateLimitStore } from './memory-store';
import { getRedisRateLimitStore, isRedisConfigured } from './redis-store';
import type { AuthRateLimitOptions, RateLimitResult, RateLimitStore } from './types';
import { env } from '$env/dynamic/private';
import { getClientIp } from '$lib/server/request-ip';

export type { AuthRateLimitOptions, RateLimitResult } from './types';
export { isRedisConfigured } from './redis-store';
export { getClientIp } from '$lib/server/request-ip';

async function getRateLimitStore(): Promise<RateLimitStore> {
	if (isRedisConfigured()) {
		const redisStore = await getRedisRateLimitStore();
		if (redisStore) return redisStore;
		if (env.NODE_ENV === 'production') {
			throw new Error('Redis rate limit store is unavailable in production');
		}
	}
	if (env.NODE_ENV === 'production') {
		throw new Error('REDIS_URL is required in production for distributed rate limiting');
	}
	return getMemoryRateLimitStore();
}

async function checkBucket(
	key: string,
	limit: number,
	windowMs: number,
	scope: 'ip' | 'mobile'
): Promise<RateLimitResult> {
	const store = await getRateLimitStore();
	const { count, resetAt } = await store.increment(key, windowMs);

	if (count > limit) {
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
			scope
		};
	}

	return { ok: true };
}

export async function enforceAuthRateLimit(
	request: Request,
	opts: AuthRateLimitOptions
): Promise<RateLimitResult> {
	const windowMs = opts.windowMs ?? 15 * 60 * 1000;
	const ip = getClientIp(request);

	const ipResult = await checkBucket(`${opts.endpoint}:ip:${ip}`, opts.ipLimit, windowMs, 'ip');
	if (!ipResult.ok) return ipResult;

	if (opts.mobile && opts.mobileLimit) {
		return checkBucket(
			`${opts.endpoint}:mobile:${opts.mobile}`,
			opts.mobileLimit,
			windowMs,
			'mobile'
		);
	}

	return { ok: true };
}

export function rateLimitErrorMessage(result: Extract<RateLimitResult, { ok: false }>): string {
	if (result.scope === 'mobile') {
		return `تعداد درخواست‌های این شماره بیش از حد مجاز است. ${result.retryAfterSeconds.toLocaleString('fa-IR')} ثانیه دیگر تلاش کنید.`;
	}
	return `تعداد درخواست‌ها بیش از حد مجاز است. ${result.retryAfterSeconds.toLocaleString('fa-IR')} ثانیه دیگر تلاش کنید.`;
}
