import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { consumeMobileChangeOtp } from '$lib/server/mobile-change-otp';
import { normalizeOtpCode } from '$lib/otp';
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
		const newMobile = normalizeMobile(String(body.newMobile ?? ''));
		const code = normalizeOtpCode(String(body.code ?? ''));
		const targetUserId = String(body.targetUserId ?? '');

		const actor = await getAuthUserFromRequest(request);
		if (!actor) return json({ error: 'احراز هویت لازم است' }, { status: 401 });
		if (!MOBILE_REGEX.test(newMobile)) {
			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
		}
		if (!code) return json({ error: 'کد تأیید الزامی است' }, { status: 400 });

		const targetId = targetUserId || actor.id;
		const isSelf = targetId === actor.id;

		if (!isSelf && actor.role !== 'admin') {
			return json(
				{ error: 'تغییر شماره موبایل دیگران فقط توسط مدیر کلینیک امکان‌پذیر است' },
				{ status: 403 }
			);
		}

		const rateLimit = await enforceAuthRateLimit(request, {
			endpoint: 'mobile-change-verify',
			mobile: newMobile,
			ipLimit: 20,
			mobileLimit: 8
		});
		if (!rateLimit.ok) {
			return json(
				{ error: rateLimitErrorMessage(rateLimit), retryAfterSeconds: rateLimit.retryAfterSeconds },
				{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
			);
		}

		const pb = await getAdminPb();
		const check = await consumeMobileChangeOtp(pb, targetId, newMobile, code);
		if (!check.ok) return json({ error: check.error }, { status: 400 });

		const target = await pb.collection('users').getOne(targetId);
		const oldMobile = String(target.mobile || '');
		const newEmail = `user_${newMobile}@hoomban.com`;

		await pb.collection('users').update(targetId, {
			mobile: newMobile,
			email: newEmail,
			emailVisibility: true,
			...(isSelf ? { verified: true } : {})
		});

		if (oldMobile) {
			try {
				const staff = await pb
					.collection('staff_registry')
					.getFirstListItem(`mobile = "${oldMobile}"`);
				await pb.collection('staff_registry').update(staff.id, {
					mobile: newMobile,
					name: target.name || staff.name
				});
			} catch {
				/* not staff */
			}
		}

		const updated = await pb.collection('users').getOne(targetId);

		return json({
			ok: true,
			message: 'شماره موبایل با موفقیت به‌روزرسانی شد',
			record: {
				id: updated.id,
				name: updated.name,
				email: updated.email,
				mobile: updated.mobile,
				role: updated.role
			}
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در تأیید تغییر موبایل';
		return json({ error: message }, { status: 500 });
	}
};
