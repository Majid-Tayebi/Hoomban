import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/** Demo OTP/password helpers are only active in dev or when explicitly enabled. */
export function isDevAuthEnabled(): boolean {
	if (env.NODE_ENV === 'production') return false;
	return dev || env.DEV_DEMO_AUTH === 'true';
}

export function getDemoOtp(): string | null {
	if (!isDevAuthEnabled()) return null;
	return env.DEMO_OTP || '1234';
}

export function matchesDemoOtp(code: string): boolean {
	const demo = getDemoOtp();
	return demo !== null && code === demo;
}

export function maybeDemoCode(code: string): string | undefined {
	return isDevAuthEnabled() ? code : undefined;
}
