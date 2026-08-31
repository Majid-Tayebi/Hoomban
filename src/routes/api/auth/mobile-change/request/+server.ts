import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import { createMobileChangeOtp } from '$lib/server/mobile-change-otp';
import { maybeDemoCode } from '$lib/server/dev-auth';
import { assertMobileAvailable, normalizeMobile } from '$lib/server/user-uniqueness';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

async function authActor(token: string) {
	const userPb = new PocketBase(PB_URL);
	userPb.authStore.save(token, null as never);
	const refreshed = await userPb.collection('users').authRefresh();
	return refreshed.record as { id: string; role?: string; mobile?: string };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const newMobile = normalizeMobile(String(body.newMobile ?? ''));
		const targetUserId = String(body.targetUserId ?? '');
		const authHeader = request.headers.get('authorization') || '';
		const token =
			(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || String(body.token ?? '');

		if (!token) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

		const actor = await authActor(token);
		const targetId = targetUserId || actor.id;
		const isSelf = targetId === actor.id;

		if (!isSelf && actor.role !== 'admin') {
			return json(
				{ error: 'تغییر شماره موبایل دیگران فقط توسط مدیر کلینیک امکان‌پذیر است' },
				{ status: 403 }
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

		const otpRow = createMobileChangeOtp(targetId, newMobile, actor.id);

		try {
			await pb.collection('sms_outbox').create({
				to: newMobile,
				template: 'otp_mobile_change',
				body: `کد تأیید تغییر شماره موبایل هومبان: ${otpRow.code}`,
				status: 'stub',
				payload: { targetUserId: targetId }
			});
		} catch {
			/* optional */
		}

		const demoCode = maybeDemoCode(otpRow.code);

		return json({
			ok: true,
			message: 'کد تأیید به شماره جدید ارسال شد',
			...(demoCode ? { demoCode } : {}),
			targetUserId: targetId,
			newMobile
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در درخواست تغییر موبایل';
		return json({ error: message }, { status: 500 });
	}
};
