import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { getAdminPb } from '$lib/server/pocketbase';

import { createLoginOtp } from '$lib/server/login-otp';

import { maybeExposeOtpForClient, isSmsSandboxMode } from '$lib/server/sms/smsir-otp-hint';

import { resolveStaffRoleForMobile } from '$lib/server/resolve-staff-role';

import { queueSms } from '$lib/server/sms/queue-sms';
import { OTP_RESEND_SECONDS } from '$lib/otp';
import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';



const MOBILE_REGEX = /^09\d{9}$/;



function normalizeMobile(raw: string) {

	let digits = raw.replace(/\D/g, '');

	if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);

	if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;

	return digits;

}



export const POST: RequestHandler = async ({ request }) => {

	try {

		const body = await request.json();

		const mobile = normalizeMobile(String(body.mobile ?? ''));

		const mode = body.mode === 'recovery' ? 'recovery' : 'login';



		if (!MOBILE_REGEX.test(mobile)) {

			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });

		}



		const rateLimit = await enforceAuthRateLimit(request, {

			endpoint: 'otp-request',

			mobile,

			ipLimit: 20,

			mobileLimit: 5

		});

		if (!rateLimit.ok) {

			return json(

				{ error: rateLimitErrorMessage(rateLimit), retryAfterSeconds: rateLimit.retryAfterSeconds },

				{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }

			);

		}



		const pb = await getAdminPb();



		if (mode === 'recovery') {

			const resolved = await resolveStaffRoleForMobile(pb, mobile);

			if (!resolved.name && resolved.role === 'patient') {

				try {

					await pb.collection('users').getFirstListItem(`mobile = "${mobile}"`);

				} catch {

					return json(

						{ error: 'حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید.' },

						{ status: 404 }

					);

				}

			}

		}



		let otpRow;

		try {

			otpRow = await createLoginOtp(pb, mobile, mode);

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

				to: mobile,

				template: mode === 'recovery' ? 'otp_recovery' : 'otp_login',

				body: `کد ورود هومبان: ${otpRow.code}`,

				payload: { mobile, mode, code: otpRow.code }

			});

		} catch {

			/* optional */

		}



		const resolved = await resolveStaffRoleForMobile(pb, mobile);

		const exposedCode = maybeExposeOtpForClient(otpRow.code);



		return json({

			ok: true,

			message: isSmsSandboxMode()

				? 'درخواست OTP ثبت شد (Sandbox — پیامک واقعی ارسال نمی‌شود)'

				: 'کد تأیید ارسال شد',

			...(exposedCode ? { demoCode: exposedCode } : {}),

			smsSandbox: isSmsSandboxMode(),

			mobile,

			mode,

			role: resolved.role,

			name: resolved.name

		});

	} catch (err: unknown) {

		const message = err instanceof Error ? err.message : 'خطا در ارسال کد';

		return json({ error: message }, { status: 500 });

	}

};


