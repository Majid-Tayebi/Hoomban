import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { createMobileChangeOtp } from '$lib/server/mobile-change-otp';
import { maybeExposeOtpForClient, isSmsSandboxMode } from '$lib/server/sms/smsir-otp-hint';
import { assertMobileAvailable, normalizeMobile } from '$lib/server/user-uniqueness';
import { queueSms } from '$lib/server/sms/queue-sms';
import { OTP_RESEND_SECONDS } from '$lib/otp';
import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const newMobile = normalizeMobile(String(body.newMobile ?? ''));
		const targetUserId = String(body.targetUserId ?? '');

		const actor = await getAuthUserFromRequest(request, cookies);
		if (!actor) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

		const targetId = targetUserId || actor.id;
		const isSelf = targetId === actor.id;

		if (!isSelf && actor.role !== 'admin') {
			return json(
				{ error: 'تغییر شماره موبایل دیگران فقط توسط مدیر کلینیک امکان‌پذیر است' },
				{ status: 403 }
			);
		}

		const rateLimit = await enforceAuthRateLimit(request, {
			endpoint: 'mobile-change-request',
			mobile: newMobile,
			ipLimit: 15,
			mobileLimit: 5
		});
		if (!rateLimit.ok) {
			return json(
				{ error: rateLimitErrorMessage(rateLimit), retryAfterSeconds: rateLimit.retryAfterSeconds },
				{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
			);
		}

		const pb = await getAdminPb();
		const unique = await assertMobileAvailable(pb, newMobile, { excludeUserId: targetId });
		if (!unique.ok) return json({ error: unique.error }, { status: 409 });

		const target = await pb.collection('users').getOne(targetId);
		const targetRole = String(target.role || '');

		if (!isSelf) {
			const allowed = ['patient', 'doctor', 'secretary', 'writer'];
			if (!allowed.includes(targetRole)) {
				return json({ error: 'نقش هدف برای تغییر موبایل مجاز نیست' }, { status: 400 });
			}
		}

		if (String(target.mobile || '') === newMobile) {
			if (!(isSelf && !target.verified)) {
				return json({ error: 'شماره جدید با شماره فعلی یکسان است' }, { status: 400 });
			}
		}

		let otpRow;
		try {
			otpRow = await createMobileChangeOtp(pb, targetId, newMobile, actor.id);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : '';
			if (message.startsWith('RESEND_COOLDOWN:')) {
				const waitSeconds = Number(message.split(':')[1] || OTP_RESEND_SECONDS);
				return json(
					{
						error: `لطفاً ${waitSeconds.toLocaleString('fa-IR')} ثانیه دیگر برای ارسال مجدد صبر کنید`,
						resendAfterSeconds: waitSeconds
					},
					{ status: 429 }
				);
			}
			throw err;
		}

		try {
			await queueSms(pb, {
				to: newMobile,
				template: 'otp_mobile_change',
				body: `کد تأیید تغییر شماره موبایل هومبان: ${otpRow.code}`,
				payload: { targetUserId: targetId, code: otpRow.code }
			});
		} catch {
			/* optional */
		}

		const exposedCode = maybeExposeOtpForClient(otpRow.code);

		return json({
			ok: true,
			message: isSmsSandboxMode()
				? 'درخواست OTP ثبت شد (Sandbox — پیامک واقعی ارسال نمی‌شود)'
				: 'کد تأیید به شماره جدید ارسال شد',
			...(exposedCode ? { demoCode: exposedCode } : {}),
			smsSandbox: isSmsSandboxMode(),
			targetUserId: targetId,
			newMobile
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در درخواست تغییر موبایل';
		return json({ error: message }, { status: 500 });
	}
};
