import { generateOtpCode } from '$lib/server/auth-secrets';
import { matchesDemoOtp } from '$lib/server/dev-auth';

export type PendingMobileChange = {
	code: string;
	newMobile: string;
	targetUserId: string;
	requestedBy: string;
	expires: number;
};

const pending = new Map<string, PendingMobileChange>();

export function pendingMobileKey(targetUserId: string, newMobile: string) {
	return `${targetUserId}:${newMobile}`;
}

export function storeMobileChangeOtp(row: PendingMobileChange) {
	pending.set(pendingMobileKey(row.targetUserId, row.newMobile), row);
}

export function createMobileChangeOtp(
	targetUserId: string,
	newMobile: string,
	requestedBy: string
): PendingMobileChange {
	const row: PendingMobileChange = {
		code: generateOtpCode(),
		newMobile,
		targetUserId,
		requestedBy,
		expires: Date.now() + 10 * 60 * 1000
	};
	storeMobileChangeOtp(row);
	return row;
}

export function consumeMobileChangeOtp(
	targetUserId: string,
	newMobile: string,
	code: string
): { ok: true } | { ok: false; error: string } {
	const key = pendingMobileKey(targetUserId, newMobile);
	const row = pending.get(key);
	if (!row) return { ok: false, error: 'درخواست معتبر یافت نشد؛ دوباره کد بگیرید' };
	if (Date.now() > row.expires) {
		pending.delete(key);
		return { ok: false, error: 'کد منقضی شده است' };
	}
	if (code !== row.code && !matchesDemoOtp(code)) {
		return { ok: false, error: 'کد تأیید نادرست است' };
	}
	pending.delete(key);
	return { ok: true };
}
