import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { createLoginOtp } from '$lib/server/login-otp';
import { maybeDemoCode } from '$lib/server/dev-auth';
import { resolveStaffRoleForMobile } from '$lib/server/resolve-staff-role';

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

		if (mode === 'recovery') {
			const pb = await getAdminPb();
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

		const otpRow = createLoginOtp(mobile, mode);

		try {
			const pb = await getAdminPb();
			await pb.collection('sms_outbox').create({
				to: mobile,
				template: mode === 'recovery' ? 'otp_recovery' : 'otp_login',
				body: `کد ورود هومبان: ${otpRow.code}`,
				status: 'stub',
				payload: { mobile, mode }
			});
		} catch {
			/* optional */
		}

		const resolved = await resolveStaffRoleForMobile(await getAdminPb(), mobile);
		const demoCode = maybeDemoCode(otpRow.code);

		return json({
			ok: true,
			message: 'کد تأیید ارسال شد',
			...(demoCode ? { demoCode } : {}),
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
