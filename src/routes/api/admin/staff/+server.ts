import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getAdminPb } from '$lib/server/pocketbase';
import { ensureUserRecord } from '$lib/server/auth-user';
import {
	assertMobileAvailable,
	findUserIdByMobile,
	normalizeMobile
} from '$lib/server/user-uniqueness';
import { userEmailForMobile, type StaffRole } from '$lib/server/resolve-staff-role';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const STAFF_ROLES: StaffRole[] = ['admin', 'secretary', 'doctor', 'writer'];

async function requireAdmin(token: string) {
	if (!token) return null;
	const userPb = new PocketBase(PB_URL);
	userPb.authStore.save(token, null as never);
	try {
		const refreshed = await userPb.collection('users').authRefresh();
		if (String(refreshed.record.role) !== 'admin') return null;
		return refreshed.record.id as string;
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const authHeader = request.headers.get('authorization') || '';
		const token =
			(authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || String(body.token ?? '');

		if (!(await requireAdmin(token))) {
		 return json({ error: 'فقط مدیر کلینیک مجاز است' }, { status: 403 });
		}

		const mobile = normalizeMobile(String(body.mobile ?? ''));
		const name = String(body.name ?? '').trim();
		const role = String(body.role ?? 'secretary') as StaffRole;
		const active = body.active !== false;
		const staffId = String(body.id ?? '');

		if (!name) return json({ error: 'نام الزامی است' }, { status: 400 });
		if (!STAFF_ROLES.includes(role)) return json({ error: 'نقش نامعتبر است' }, { status: 400 });

		const pb = await getAdminPb();
		const mobileCheck = await assertMobileAvailable(pb, mobile, {
			excludeStaffId: staffId || undefined
		});
		if (!mobileCheck.ok) return json({ error: mobileCheck.error }, { status: 409 });

		const payload = { mobile, name, role, active };

		if (staffId) {
			const existingStaff = await pb.collection('staff_registry').getOne(staffId);
			const oldMobile = String(existingStaff.mobile || '');
			await pb.collection('staff_registry').update(staffId, payload);

			let userId = await findUserIdByMobile(pb, oldMobile);
			if (!userId) userId = await findUserIdByMobile(pb, mobile);

			if (userId) {
				await pb.collection('users').update(userId, {
					name,
					role,
					mobile,
					email: userEmailForMobile(mobile),
					emailVisibility: true
				});
			}

			return json({ ok: true, staffId, userId: userId ?? null });
		}

		const staff = await pb.collection('staff_registry').create(payload);

		let userId = await findUserIdByMobile(pb, mobile);

		if (!userId) {
			const created = await ensureUserRecord(pb, { mobile, role, name });
			userId = created.userId;
		}

		await pb.collection('users').update(userId, {
			name,
			role,
			mobile,
			email: userEmailForMobile(mobile),
			emailVisibility: true,
			verified: false
		});

		return json({ ok: true, staffId: staff.id, userId });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ذخیره همکار ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
