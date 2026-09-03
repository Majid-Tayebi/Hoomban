import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureUserRecord } from '$lib/server/auth-user';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import {
	mergeLoginIdentity,
	resolveStaffRoleForMobile,
	type StaffRole
} from '$lib/server/resolve-staff-role';

const MOBILE_REGEX = /^09\d{9}$/;

function canProvisionUsers(role: string) {
	return role === 'admin' || role === 'secretary';
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const actor = await getAuthUserFromRequest(request, cookies);
		if (!actor || !canProvisionUsers(actor.role)) {
			return json({ error: 'فقط مدیر یا منشی مجاز است' }, { status: 403 });
		}

		const body = await request.json();
		const mobile = String(body.mobile ?? '').replace(/\D/g, '');
		const requestedRole = (body.role as StaffRole) || 'patient';
		const requestedName = String(body.name ?? '');

		if (!MOBILE_REGEX.test(mobile)) {
			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
		}

		const pb = await getAdminPb();
		const resolved = await resolveStaffRoleForMobile(pb, mobile);

		let existing: { id: string; name?: string; role?: string; mobile?: string } | null = null;
		for (const filter of [`mobile = "${mobile}"`, `email = "user_${mobile}@hoomban.com"`]) {
			try {
				existing = await pb.collection('users').getFirstListItem(filter);
				break;
			} catch {
				/* try next */
			}
		}

		const identity = mergeLoginIdentity(existing, resolved, {
			role: requestedRole,
			name: requestedName,
			mobile
		});

		const { userId, record } = await ensureUserRecord(pb, {
			mobile,
			role: identity.role,
			name: identity.name
		});

		return json({ ok: true, userId, record });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ایجاد کاربر';
		return json({ error: message }, { status: 500 });
	}
};
