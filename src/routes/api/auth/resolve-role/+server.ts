import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { resolveStaffRoleForMobile } from '$lib/server/resolve-staff-role';

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

		const pb = await getAdminPb();
		const resolved = await resolveStaffRoleForMobile(pb, normalized);
		return json(resolved);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در تشخیص نقش';
		return json({ error: message, role: 'patient', name: '' }, { status: 500 });
	}
};
