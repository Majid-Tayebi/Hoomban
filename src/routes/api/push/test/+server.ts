import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { sendWebPushToUser } from '$lib/server/push/send';
import { isVapidConfigured } from '$lib/server/push/vapid';

/** Send a test push to the authenticated user's subscriptions. */
export const POST: RequestHandler = async ({ request }) => {
	if (!isVapidConfigured()) {
		return json({ error: 'Web Push پیکربندی نشده' }, { status: 503 });
	}

	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });

	const allowedRoles = ['admin', 'secretary', 'doctor'];
	if (!allowedRoles.includes(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const pb = await getAdminPb();
		const result = await sendWebPushToUser(pb, user.id, {
			title: 'تست اعلان هومبان',
			body: 'اگر این پیام را می‌بینید، Web Push فعال است.',
			href: '/dashboard/appointments',
			tag: 'hoomban-test'
		});

		if (result.sent === 0) {
			return json({
				ok: false,
				error:
					result.failed > 0
						? 'ارسال push ناموفق بود'
						: 'اشتراک push یافت نشد — ابتدا اعلان مرورگر را فعال کنید',
				...result
			});
		}

		return json({ ok: true, ...result });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ارسال تست ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
