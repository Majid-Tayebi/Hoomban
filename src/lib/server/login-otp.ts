import { generateOtpCode } from '$lib/server/auth-secrets';
import { matchesDemoOtp } from '$lib/server/dev-auth';

export type PendingLoginOtp = {
	code: string;
	mobile: string;
	mode: 'login' | 'recovery';
	expires: number;
};

const pending = new Map<string, PendingLoginOtp>();

export function storeLoginOtp(row: PendingLoginOtp) {
	pending.set(row.mobile, row);
}

export function createLoginOtp(mobile: string, mode: 'login' | 'recovery'): PendingLoginOtp {
	const row: PendingLoginOtp = {
		code: generateOtpCode(),
		mobile,
		mode,
		expires: Date.now() + 10 * 60 * 1000
	};
	storeLoginOtp(row);
	return row;
}

export function consumeLoginOtp(
	mobile: string,
	code: string
): { ok: true; mode: 'login' | 'recovery' } | { ok: false; error: string } {
	const row = pending.get(mobile);
	if (!row) return { ok: false, error: 'درخواست معتبر یافت نشد؛ دوباره کد بگیرید' };
	if (Date.now() > row.expires) {
		pending.delete(mobile);
		return { ok: false, error: 'کد منقضی شده است' };
	}
	if (code !== row.code && !matchesDemoOtp(code)) {
		return { ok: false, error: 'کد تأیید نادرست است' };
	}
	pending.delete(mobile);
	return { ok: true, mode: row.mode };
}
