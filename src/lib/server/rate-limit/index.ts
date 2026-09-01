import { getMemoryRateLimitStore } from './memory-store';
import { getRedisRateLimitStore, isRedisConfigured } from './redis-store';
import type { AuthRateLimitOptions, RateLimitResult, RateLimitStore } from './types';

export type { AuthRateLimitOptions, RateLimitResult } from './types';
export { isRedisConfigured } from './redis-store';

async function getRateLimitStore(): Promise<RateLimitStore> {
	if (isRedisConfigured()) {
		const redisStore = await getRedisRateLimitStore();
		if (redisStore) return redisStore;
	}
	return getMemoryRateLimitStore();
}

export function getClientIp(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}
	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;
	const cfIp = request.headers.get('cf-connecting-ip')?.trim();
	if (cfIp) return cfIp;
	return 'local';
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
