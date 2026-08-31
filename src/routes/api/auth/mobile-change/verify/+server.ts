import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import { consumeMobileChangeOtp } from '$lib/server/mobile-change-otp';

const MOBILE_REGEX = /^09\d{9}$/;
const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

function normalizeMobile(raw: string) {
	let digits = raw.replace(/\D/g, '');
	if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);
	if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;
	return digits;
}

async function authActor(token: string) {
	const userPb = new PocketBase(PB_URL);
	userPb.authStore.save(token, null as never);
	const refreshed = await userPb.collection('users').authRefresh();
	return refreshed.record as { id: string; role?: string };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const newMobile = normalizeMobile(String(body.newMobile ?? ''));
		const code = String(body.code ?? '').trim();
		const targetUserId = String(body.targetUserId ?? '');
		const authHeader = request.headers.get('authorization') || '';
		const token =
			(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || String(body.token ?? '');

		if (!token) return json({ error: 'احراز هویت لازم است' }, { status: 401 });
		if (!MOBILE_REGEX.test(newMobile)) {
			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
		}
		if (!code) return json({ error: 'کد تأیید الزامی است' }, { status: 400 });

		const actor = await authActor(token);
		const targetId = targetUserId || actor.id;
		const isSelf = targetId === actor.id;

		if (!isSelf && actor.role !== 'admin') {
			return json(
				{ error: 'تغییر شماره موبایل دیگران فقط توسط مدیر کلینیک امکان‌پذیر است' },
				{ status: 403 }
			);
		}

		const check = consumeMobileChangeOtp(targetId, newMobile, code);
		if (!check.ok) return json({ error: check.error }, { status: 400 });

		const pb = await getAdminPb();
		const target = await pb.collection('users').getOne(targetId);
		const oldMobile = String(target.mobile || '');
		const newEmail = `user_${newMobile}@hoomban.com`;

		await pb.collection('users').update(targetId, {
			mobile: newMobile,
			email: newEmail,
			emailVisibility: true,
			...(isSelf ? { verified: true } : {})
		});

		// Sync staff_registry by old mobile
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
