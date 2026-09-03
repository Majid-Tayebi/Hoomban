/**
 * Resolve client IP for rate limiting.
 *
 * By default, proxy headers are IGNORED (clients can spoof X-Forwarded-For).
 * Set TRUST_PROXY=true (or true behind Cloudflare with CF-Connecting-IP) in production
 * when a trusted reverse proxy overwrites these headers.
 */
import { env } from '$env/dynamic/private';

export function isTrustedProxyEnabled(): boolean {
	const flag = (env.TRUST_PROXY || '').toLowerCase().trim();
	return flag === '1' || flag === 'true' || flag === 'yes';
}

export function getClientIp(request: Request): string {
	if (isTrustedProxyEnabled()) {
		const cfIp = request.headers.get('cf-connecting-ip')?.trim();
		if (cfIp) return cfIp;

		const realIp = request.headers.get('x-real-ip')?.trim();
		if (realIp) return realIp;

		const forwarded = request.headers.get('x-forwarded-for');
		if (forwarded) {
			const first = forwarded.split(',')[0]?.trim();
			if (first) return first;
		}
	}

	return 'local';
}
