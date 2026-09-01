import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { ensureUserAndAuth } from '$lib/server/auth-user';

import { consumeLoginOtpWithFallback } from '$lib/server/login-otp';

import { normalizeOtpCode } from '$lib/otp';

import { jsonWithSession } from '$lib/server/auth-response';

import { resolveStaffRoleForMobile } from '$lib/server/resolve-staff-role';

import { getAdminPb } from '$lib/server/pocketbase';

import type { StaffRole } from '$lib/server/resolve-staff-role';

import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';



const MOBILE_REGEX = /^09\d{9}$/;



function normalizeMobile(raw: string) {

	let digits = raw.replace(/\D/g, '');

	if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);

	if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;

	return digits;

}



export const POST: RequestHandler = async ({ request, cookies }) => {

	try {

		const body = await request.json();

		const mobile = normalizeMobile(String(body.mobile ?? ''));

		const code = normalizeOtpCode(String(body.code ?? ''));

		const requestedRole = (body.role as StaffRole) || undefined;

		const requestedName = String(body.name ?? '');



		if (!MOBILE_REGEX.test(mobile)) {

			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });

		}

		if (!code) {

			return json({ error: 'کد تأیید را وارد کنید' }, { status: 400 });

		}



		const rateLimit = await enforceAuthRateLimit(request, {

			endpoint: 'otp-verify',

			mobile,

			ipLimit: 30,

			mobileLimit: 10

		});

		if (!rateLimit.ok) {

			return json(

				{ error: rateLimitErrorMessage(rateLimit), retryAfterSeconds: rateLimit.retryAfterSeconds },

				{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }

			);

		}



		const pb = await getAdminPb();

		const otpResult = await consumeLoginOtpWithFallback(pb, mobile, code);

		if (!otpResult.ok) {

			return json({ error: otpResult.error }, { status: 400 });

		}



		const resolved = await resolveStaffRoleForMobile(pb, mobile);



		if (otpResult.mode === 'recovery') {

			try {

				await pb.collection('users').getFirstListItem(`mobile = "${mobile}"`);

			} catch {

				return json({ error: 'حسابی با این شماره یافت نشد' }, { status: 404 });

			}

		}



		const auth = await ensureUserAndAuth({

			mobile,

			role: requestedRole || resolved.role,

			name: requestedName || resolved.name

		});



		return jsonWithSession(cookies, auth, { mode: otpResult.mode });

	} catch (err: unknown) {

		const message = err instanceof Error ? err.message : 'خطا در تأیید کد';

		return json({ error: message }, { status: 500 });

	}

};


