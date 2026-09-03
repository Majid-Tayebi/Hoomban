/**
 * Same-origin guard for cookie-authenticated mutating API requests (CSRF defense-in-depth).
 * SameSite=lax already blocks most cross-site POSTs; this rejects mismatched Origin/Referer.
 */

const EXEMPT_PREFIXES = [
	'/api/payments/zarinpal/callback',
	'/api/cron/'
];

export function isOriginCheckExempt(pathname: string): boolean {
	return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export type OriginCheckResult = { ok: true } | { ok: false; reason: string };

/**
 * Allow same-site requests. In local/dev, missing Origin is common for same-origin fetch.
 * In production, require Origin or Referer matching the request host.
 */
export function assertSameOrigin(
	request: Request,
	url: URL,
	opts?: { requireInProduction?: boolean }
): OriginCheckResult {
	const requireStrict = opts?.requireInProduction ?? true;
	const isProduction = process.env.NODE_ENV === 'production';

	const origin = request.headers.get('origin');
	if (origin) {
		try {
			const o = new URL(origin);
			if (o.protocol === url.protocol && o.host === url.host) return { ok: true };
			return { ok: false, reason: 'Origin mismatch' };
		} catch {
			return { ok: false, reason: 'Invalid Origin' };
		}
	}

	const referer = request.headers.get('referer');
	if (referer) {
		try {
			const r = new URL(referer);
			if (r.protocol === url.protocol && r.host === url.host) return { ok: true };
			return { ok: false, reason: 'Referer mismatch' };
		} catch {
			return { ok: false, reason: 'Invalid Referer' };
		}
	}

	if (isProduction && requireStrict) {
		return { ok: false, reason: 'Missing Origin/Referer' };
	}

	return { ok: true };
}

export function isMutatingMethod(method: string): boolean {
	const m = method.toUpperCase();
	return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}
