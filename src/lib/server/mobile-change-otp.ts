import type PocketBase from 'pocketbase';
import { generateOtpCode } from '$lib/server/auth-secrets';
import { matchesDemoOtp } from '$lib/server/dev-auth';
import { OTP_EXPIRY_MS, OTP_RESEND_SECONDS, normalizeOtpCode } from '$lib/otp';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export type PendingMobileChange = {
	code: string;
	newMobile: string;
	targetUserId: string;
	requestedBy: string;
	expires: number;
};

export type MobileChangeOtpConsumeResult = { ok: true } | { ok: false; error: string };

export const MOBILE_CHANGE_RESEND_COOLDOWN_MS = OTP_RESEND_SECONDS * 1000;
export const MOBILE_CHANGE_MAX_VERIFY_ATTEMPTS = 5;

const NOT_FOUND_ERROR = 'درخواست معتبر یافت نشد؛ دوباره کد بگیرید';
const LOCKED_ERROR = 'تعداد تلاش‌های ناموفق زیاد است؛ دوباره کد بگیرید';

function escapeFilterValue(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function codeMatches(stored: string, submitted: string): boolean {
	return stored === submitted || matchesDemoOtp(submitted);
}

type MobileChangeOtpRecord = {
	id: string;
	target_user?: string;
	new_mobile?: string;
	code?: string;
	expires_at?: string;
	consumed?: boolean;
	verify_attempts?: number;
	created?: string;
};

function isRecordActive(row: MobileChangeOtpRecord, now = Date.now()): boolean {
	if (row.consumed) return false;
	const expiresMs = row.expires_at ? new Date(String(row.expires_at)).getTime() : 0;
	return Number.isFinite(expiresMs) && expiresMs > now;
}

export async function getMobileChangeResendWaitSeconds(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string
): Promise<number> {
	const filter = buildPendingFilter(targetUserId, newMobile);
	try {
		const res = await pb.collection('mobile_change_otps').getList(1, 1, {
			filter,
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
		const row = res.items[0] as MobileChangeOtpRecord | undefined;
		if (!row?.created) return 0;
		const sentMs = new Date(String(row.created)).getTime();
		if (!Number.isFinite(sentMs)) return 0;
		const remaining = MOBILE_CHANGE_RESEND_COOLDOWN_MS - (Date.now() - sentMs);
		return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
	} catch {
		return 0;
	}
}

function buildPendingFilter(targetUserId: string, newMobile: string): string {
	const safeUser = escapeFilterValue(targetUserId);
	const safeMobile = escapeFilterValue(newMobile);
	return `target_user = "${safeUser}" && new_mobile = "${safeMobile}" && consumed = false`;
}

async function invalidatePendingOtps(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string
): Promise<void> {
	try {
		const res = await pb.collection('mobile_change_otps').getList(1, 20, {
			filter: buildPendingFilter(targetUserId, newMobile),
			...PB_NO_AUTO_CANCEL
		});
		for (const item of res.items) {
			await pb.collection('mobile_change_otps').update(item.id, { consumed: true }, PB_NO_AUTO_CANCEL);
		}
	} catch {
		/* best-effort */
	}
}

export async function createMobileChangeOtp(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string,
	requestedBy: string
): Promise<PendingMobileChange> {
	const waitSeconds = await getMobileChangeResendWaitSeconds(pb, targetUserId, newMobile);
	if (waitSeconds > 0) {
		throw new Error(`RESEND_COOLDOWN:${waitSeconds}`);
	}

	const expires = Date.now() + OTP_EXPIRY_MS;
	const code = generateOtpCode();

	await invalidatePendingOtps(pb, targetUserId, newMobile);
	await pb.collection('mobile_change_otps').create(
		{
			target_user: targetUserId,
			requested_by: requestedBy,
			new_mobile: newMobile,
			code,
			expires_at: new Date(expires).toISOString(),
			consumed: false,
			verify_attempts: 0
		},
		PB_NO_AUTO_CANCEL
	);

	return { code, newMobile, targetUserId, requestedBy, expires };
}

async function incrementVerifyAttempts(
	pb: PocketBase,
	row: MobileChangeOtpRecord
): Promise<number> {
	const attempts = Number(row.verify_attempts || 0) + 1;
	const patch: Record<string, unknown> = { verify_attempts: attempts };
	if (attempts >= MOBILE_CHANGE_MAX_VERIFY_ATTEMPTS) {
		patch.consumed = true;
	}
	await pb.collection('mobile_change_otps').update(row.id, patch, PB_NO_AUTO_CANCEL);
	return attempts;
}

function extractCodeFromOutbox(payload: Record<string, unknown> | null, body: string): string {
	const fromPayload = payload?.code ?? payload?.Code ?? payload?.otp;
	if (fromPayload != null && String(fromPayload).trim()) {
		return normalizeOtpCode(String(fromPayload));
	}
	const match = body.match(/\d{4,8}/);
	return match ? normalizeOtpCode(match[0]) : '';
}

async function consumeMobileChangeOtpFromOutbox(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string,
	code: string
): Promise<MobileChangeOtpConsumeResult> {
	const safeMobile = escapeFilterValue(newMobile);
	try {
		const res = await pb.collection('sms_outbox').getList(1, 8, {
			filter: `to = "${safeMobile}" && template = "otp_mobile_change" && status != "consumed"`,
			sort: '-id',
			...PB_NO_AUTO_CANCEL
		});

		const cutoff = Date.now() - OTP_EXPIRY_MS;
		for (const item of res.items) {
			const payload = (item.payload ?? null) as Record<string, unknown> | null;
			const payloadTarget = String(payload?.targetUserId ?? '');
			if (payloadTarget && payloadTarget !== targetUserId) continue;

			const createdRaw = item.created || item.updated;
			if (createdRaw) {
				const createdMs = new Date(String(createdRaw)).getTime();
				if (Number.isFinite(createdMs) && createdMs < cutoff) continue;
			}

			const stored = extractCodeFromOutbox(payload, String(item.body || ''));
			if (!stored || !codeMatches(stored, code)) continue;

			try {
				await pb.collection('sms_outbox').update(
					item.id,
					{ status: 'consumed', error: '' },
					PB_NO_AUTO_CANCEL
				);
			} catch {
				/* best-effort */
			}

			return { ok: true };
		}
	} catch {
		/* ignore */
	}

	return { ok: false, error: NOT_FOUND_ERROR };
}

async function consumeMobileChangeOtpFromDb(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string,
	code: string
): Promise<MobileChangeOtpConsumeResult> {
	let res;
	try {
		res = await pb.collection('mobile_change_otps').getList(1, 5, {
			filter: buildPendingFilter(targetUserId, newMobile),
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
	} catch {
		return { ok: false, error: NOT_FOUND_ERROR };
	}

	const row = res.items.find((item) => isRecordActive(item as MobileChangeOtpRecord)) as
		| MobileChangeOtpRecord
		| undefined;
	if (!row) return { ok: false, error: NOT_FOUND_ERROR };

	if (Number(row.verify_attempts || 0) >= MOBILE_CHANGE_MAX_VERIFY_ATTEMPTS) {
		return { ok: false, error: LOCKED_ERROR };
	}

	if (!codeMatches(String(row.code || ''), code)) {
		const attempts = await incrementVerifyAttempts(pb, row);
		if (attempts >= MOBILE_CHANGE_MAX_VERIFY_ATTEMPTS) {
			return { ok: false, error: LOCKED_ERROR };
		}
		return { ok: false, error: 'کد تأیید نادرست است' };
	}

	await pb.collection('mobile_change_otps').update(row.id, { consumed: true }, PB_NO_AUTO_CANCEL);
	return { ok: true };
}

/** DB first; falls back to sms_outbox for legacy rows. */
export async function consumeMobileChangeOtp(
	pb: PocketBase,
	targetUserId: string,
	newMobile: string,
	rawCode: string
): Promise<MobileChangeOtpConsumeResult> {
	const code = normalizeOtpCode(rawCode);
	if (!code) {
		return { ok: false, error: 'کد تأیید الزامی است' };
	}

	const dbResult = await consumeMobileChangeOtpFromDb(pb, targetUserId, newMobile, code);
	if (dbResult.ok) return dbResult;
	if (dbResult.error !== NOT_FOUND_ERROR && dbResult.error !== LOCKED_ERROR) return dbResult;

	return consumeMobileChangeOtpFromOutbox(pb, targetUserId, newMobile, code);
}
