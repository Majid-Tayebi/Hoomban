import { json, type Cookies } from '@sveltejs/kit';
import { setSessionCookie } from '$lib/server/session';
import { maybeDemoCode } from '$lib/server/dev-auth';

type AuthPayload = {
	token: string;
	record: Record<string, unknown>;
};

/** JSON auth response + httpOnly session cookie for SSR guards. */
export function jsonWithSession(
	cookies: Cookies,
	payload: AuthPayload,
	extra: Record<string, unknown> = {}
) {
	setSessionCookie(cookies, payload.token);
	return json({
		token: payload.token,
		record: payload.record,
		...extra
	});
}

export function jsonWithOptionalDemoOtp(
	cookies: Cookies | null,
	payload: Record<string, unknown>,
	otpCode: string
) {
	if (cookies && payload.token && payload.record) {
		setSessionCookie(cookies, String(payload.token));
	}
	const demoCode = maybeDemoCode(otpCode);
	return json(demoCode ? { ...payload, demoCode } : payload);
}
