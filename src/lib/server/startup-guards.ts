import { env } from '$env/dynamic/private';

let validated = false;

/** Fail fast when production is misconfigured. */
export function assertProductionConfig(): void {
	if (validated) return;
	validated = true;

	if (env.NODE_ENV !== 'production') return;

	if (env.DEV_DEMO_AUTH === 'true') {
		throw new Error(
			'DEV_DEMO_AUTH must not be enabled in production. Remove it from environment variables.'
		);
	}

	if (!env.REDIS_URL?.trim()) {
		throw new Error('REDIS_URL is required in production for distributed rate limiting.');
	}
}
