export type RateLimitBucketResult = {
	count: number;
	resetAt: number;
};

export interface RateLimitStore {
	increment(key: string, windowMs: number): Promise<RateLimitBucketResult>;
}

export type RateLimitResult =
	| { ok: true }
	| { ok: false; retryAfterSeconds: number; scope: 'ip' | 'mobile' };

export type AuthRateLimitOptions = {
	endpoint: string;
	mobile?: string;
	ipLimit: number;
	mobileLimit?: number;
	windowMs?: number;
};
