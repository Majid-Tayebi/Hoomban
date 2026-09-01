import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { getAdminPb } from '$lib/server/pocketbase';

import { resolveStaffRoleForMobile } from '$lib/server/resolve-staff-role';

import { hasPendingLoginOtp } from '$lib/server/login-otp';

import { enforceAuthRateLimit, rateLimitErrorMessage } from '$lib/server/rate-limit';



const MOBILE_REGEX = /^09\d{9}$/;



function normalizeMobile(raw: string): string {

	const mobile = raw.replace(/\D/g, '');

	if (mobile.startsWith('98') && mobile.length === 12) return '0' + mobile.slice(2);

	if (mobile.startsWith('9') && mobile.length === 10) return '0' + mobile;

	return mobile;

}



export const POST: RequestHandler = async ({ request }) => {

	try {

		const body = await request.json();

		const normalized = normalizeMobile(String(body.mobile ?? ''));



		if (!MOBILE_REGEX.test(normalized)) {

			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });

		}



		const rateLimit = await enforceAuthRateLimit(request, {

			endpoint: 'resolve-role',

			mobile: normalized,

			ipLimit: 15,

			mobileLimit: 8

		});

		if (!rateLimit.ok) {

			return json(

				{ error: rateLimitErrorMessage(rateLimit), retryAfterSeconds: rateLimit.retryAfterSeconds },

				{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }

			);

		}



		const pb = await getAdminPb();



		const pendingOtp = await hasPendingLoginOtp(pb, normalized);

		if (!pendingOtp) {

			return json(

				{ error: 'ابتدا درخواست کد تأیید دهید' },

				{ status: 403 }

			);

		}



		const resolved = await resolveStaffRoleForMobile(pb, normalized);

		return json(resolved);

	} catch (err: unknown) {

		const message = err instanceof Error ? err.message : 'خطا در تشخیص نقش';

		return json({ error: message, role: 'patient', name: '' }, { status: 500 });

	}

};


