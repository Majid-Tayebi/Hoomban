import type PocketBase from 'pocketbase';
import { generateOtpCode } from '$lib/server/auth-secrets';
import { matchesDemoOtp } from '$lib/server/dev-auth';
import { OTP_EXPIRY_MS, OTP_RESEND_SECONDS, normalizeOtpCode } from '$lib/otp';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { escapeFilterValue } from '$lib/pocketbase-filter';

export type PendingLoginOtp = {
	code: string;
	mobile: string;
	mode: 'login' | 'recovery';
	expires: number;
};

export type LoginOtpConsumeResult =
	| { ok: true; mode: 'login' | 'recovery' }
	| { ok: false; error: string };

export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_SECONDS * 1000;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

const NOT_FOUND_ERROR = 'درخواست معتبر یافت نشد؛ دوباره کد بگیرید';
const LOCKED_ERROR = 'تعداد تلاش‌های ناموفق زیاد است؛ دوباره کد بگیرید';

function codeMatches(stored: string, submitted: string): boolean {
	if (matchesDemoOtp(submitted)) return true;
	const a = stored.normalize('NFKC');
	const b = submitted.normalize('NFKC');
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

type OtpRecord = {
	id: string;
	mobile?: string;
	code?: string;
	mode?: string;
	expires_at?: string;
	consumed?: boolean;
	verify_attempts?: number;
	created?: string;
};

function isRecordActive(row: OtpRecord, now = Date.now()): boolean {
	if (row.consumed) return false;
	const expiresMs = row.expires_at ? new Date(String(row.expires_at)).getTime() : 0;
	return Number.isFinite(expiresMs) && expiresMs > now;
}

export async function getOtpResendWaitSeconds(pb: PocketBase, mobile: string): Promise<number> {
	const safeMobile = escapeFilterValue(mobile);
	try {
		const res = await pb.collection('login_otps').getList(1, 1, {
			filter: `mobile = "${safeMobile}"`,
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
		const row = res.items[0] as OtpRecord | undefined;
		if (!row?.created) return 0;
		const sentMs = new Date(String(row.created)).getTime();
		if (!Number.isFinite(sentMs)) return 0;
		const remaining = OTP_RESEND_COOLDOWN_MS - (Date.now() - sentMs);
		return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
	} catch {
		return 0;
	}
}

export async function assertCanSendOtp(
	pb: PocketBase,
	mobile: string
): Promise<{ ok: true } | { ok: false; waitSeconds: number }> {
	const waitSeconds = await getOtpResendWaitSeconds(pb, mobile);
	if (waitSeconds > 0) return { ok: false, waitSeconds };
	return { ok: true };
}

/** True when an unconsumed OTP exists — gates resolve-role after OTP request. */
export async function hasPendingLoginOtp(pb: PocketBase, mobile: string): Promise<boolean> {
	const safeMobile = escapeFilterValue(mobile);
	try {
		const res = await pb.collection('login_otps').getList(1, 5, {
			filter: `mobile = "${safeMobile}" && consumed = false`,
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
		return res.items.some((item) => isRecordActive(item as OtpRecord));
	} catch {
		return false;
	}
}

async function invalidatePendingOtps(pb: PocketBase, mobile: string): Promise<void> {
	const safeMobile = escapeFilterValue(mobile);
	try {
		const res = await pb.collection('login_otps').getList(1, 20, {
			filter: `mobile = "${safeMobile}" && consumed = false`,
			...PB_NO_AUTO_CANCEL
		});
		for (const item of res.items) {
			await pb.collection('login_otps').update(item.id, { consumed: true }, PB_NO_AUTO_CANCEL);
		}
	} catch {
		/* best-effort */
	}
}

export async function createLoginOtp(
	pb: PocketBase,
	mobile: string,
	mode: 'login' | 'recovery'
): Promise<PendingLoginOtp> {
	const sendGate = await assertCanSendOtp(pb, mobile);
	if (!sendGate.ok) {
		throw new Error(`RESEND_COOLDOWN:${sendGate.waitSeconds}`);
	}

	const expires = Date.now() + OTP_EXPIRY_MS;
	const code = generateOtpCode();

	await invalidatePendingOtps(pb, mobile);
	await pb.collection('login_otps').create(
		{
			mobile,
			code,
			mode,
			expires_at: new Date(expires).toISOString(),
			consumed: false,
			verify_attempts: 0
		},
		PB_NO_AUTO_CANCEL
	);

	return { code, mobile, mode, expires };
}

async function incrementVerifyAttempts(pb: PocketBase, row: OtpRecord): Promise<number> {
	const attempts = Number(row.verify_attempts || 0) + 1;
	const patch: Record<string, unknown> = { verify_attempts: attempts };
	if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
		patch.consumed = true;
	}
	await pb.collection('login_otps').update(row.id, patch, PB_NO_AUTO_CANCEL);
	return attempts;
}

async function consumeLoginOtpFromDb(
	pb: PocketBase,
	mobile: string,
	code: string
): Promise<LoginOtpConsumeResult> {
	const safeMobile = escapeFilterValue(mobile);
	let res;
	try {
		res = await pb.collection('login_otps').getList(1, 5, {
			filter: `mobile = "${safeMobile}" && consumed = false`,
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});
	} catch {
		return { ok: false, error: NOT_FOUND_ERROR };
	}

	const row = res.items.find((item) => isRecordActive(item as OtpRecord)) as OtpRecord | undefined;
	if (!row) return { ok: false, error: NOT_FOUND_ERROR };

	if (Number(row.verify_attempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
		return { ok: false, error: LOCKED_ERROR };
	}

	if (!codeMatches(String(row.code || ''), code)) {
		const attempts = await incrementVerifyAttempts(pb, row);
		if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
			return { ok: false, error: LOCKED_ERROR };
		}
		return { ok: false, error: 'کد تأیید نادرست است' };
	}

	await pb.collection('login_otps').update(row.id, { consumed: true }, PB_NO_AUTO_CANCEL);
	const mode = String(row.mode) === 'recovery' ? 'recovery' : 'login';
	return { ok: true, mode };
}

function extractCodeFromOutbox(payload: Record<string, unknown> | null, body: string): string {
	const fromPayload = payload?.code ?? payload?.Code ?? payload?.otp;
	if (fromPayload != null && String(fromPayload).trim()) {
		return normalizeOtpCode(String(fromPayload));
	}
	const match = body.match(/\d{4,8}/);
	return match ? normalizeOtpCode(match[0]) : '';
}

async function consumeLoginOtpFromOutbox(
	pb: PocketBase,
	mobile: string,
	code: string
): Promise<LoginOtpConsumeResult> {
	const safeMobile = escapeFilterValue(mobile);
	try {
		const res = await pb.collection('sms_outbox').getList(1, 8, {
			filter: `to = "${safeMobile}" && (template = "otp_login" || template = "otp_recovery") && status != "consumed"`,
			sort: '-id',
			...PB_NO_AUTO_CANCEL
		});

		const cutoff = Date.now() - OTP_EXPIRY_MS;
		for (const item of res.items) {
			const createdRaw = item.created || item.updated;
			if (createdRaw) {
				const createdMs = new Date(String(createdRaw)).getTime();
				if (Number.isFinite(createdMs) && createdMs < cutoff) continue;
			}

			const payload = (item.payload ?? null) as Record<string, unknown> | null;
			const stored = extractCodeFromOutbox(payload, String(item.body || ''));
			if (!stored || !codeMatches(stored, code)) continue;

			const mode =
				String(item.template) === 'otp_recovery' ||
				String((payload?.mode as string | undefined) ?? '') === 'recovery'
					? 'recovery'
					: 'login';

			try {
				await pb.collection('sms_outbox').update(
					item.id,
					{ status: 'consumed', error: '' },
					PB_NO_AUTO_CANCEL
				);
			} catch {
				/* best-effort */
			}

			return { ok: true, mode };
		}
	} catch {
		/* ignore lookup errors */
	}

	return { ok: false, error: NOT_FOUND_ERROR };
}

/** DB first; falls back to sms_outbox for legacy rows. */
export async function consumeLoginOtpWithFallback(
	pb: PocketBase,
	mobile: string,
	rawCode: string
): Promise<LoginOtpConsumeResult> {
	const code = normalizeOtpCode(rawCode);
	if (!code) {
		return { ok: false, error: 'کد تأیید را وارد کنید' };
	}

	const dbResult = await consumeLoginOtpFromDb(pb, mobile, code);
	if (dbResult.ok) return dbResult;
	if (dbResult.error !== NOT_FOUND_ERROR && dbResult.error !== LOCKED_ERROR) return dbResult;

	return consumeLoginOtpFromOutbox(pb, mobile, code);
}

