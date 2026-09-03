import { env } from '$env/dynamic/public';

const DEFAULT_SITE_URL = 'http://127.0.0.1:5173';

/** Canonical public site origin (no trailing slash). */
export function getSiteUrl(): string {
	const raw = env.PUBLIC_APP_URL?.trim() || DEFAULT_SITE_URL;
	return raw.replace(/\/+$/, '');
}

export function absoluteUrl(path: string): string {
	const base = getSiteUrl();
	if (!path || path === '/') return base;
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
