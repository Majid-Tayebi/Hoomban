import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

const STAFF_ROLES = ['admin', 'secretary', 'doctor', 'writer'];

const ROLE_LABELS: Record<string, string> = {
	admin: 'مدیر کلینیک',
	secretary: 'منشی',
	doctor: 'روانشناس',
	writer: 'نویسنده'
};

export const GET: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user || !STAFF_ROLES.includes(user.role)) {
		return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
	}

	try {
		const pb = await getAdminPb();
		const filter = STAFF_ROLES.map((r) => `role = "${r}"`).join(' || ');
		const result = await pb.collection('users').getList(1, 100, {
			filter,
			sort: 'name',
			...PB_NO_AUTO_CANCEL
		});

		const recipients = result.items
			.filter((u) => u.id !== user.id)
			.map((u) => ({
				id: u.id,
				name: String(u.name || 'کاربر'),
				role: ROLE_LABELS[String(u.role || '')] || String(u.role || '')
			}));

		return json({ recipients });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بارگذاری گیرندگان';
		return json({ error: message }, { status: 500 });
	}
};
