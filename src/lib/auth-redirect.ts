/** Safe post-login return path for public flows (tests, dashboard). */
export function sanitizeAuthRedirect(path: string | null | undefined, fallback = '/dashboard'): string {
	if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback;
	if (path.startsWith('/auth')) return fallback;
	if (path.startsWith('/dashboard') || path.startsWith('/tests')) return path;
	return fallback;
}

export function loginRedirectUrl(returnPath: string): string {
	return `/auth?redirect=${encodeURIComponent(returnPath)}`;
}
