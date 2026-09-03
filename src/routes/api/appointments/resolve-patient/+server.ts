import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateSecurePassword } from '$lib/server/auth-secrets';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';

const MOBILE_REGEX = /^09\d{9}$/;

function canResolvePatients(role: string) {
	return role === 'admin' || role === 'secretary' || role === 'doctor';
}

/** Find or create a patient user; does not return an auth token (desk booking). */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const actor = await getAuthUserFromRequest(request, cookies);
		if (!actor || !canResolvePatients(actor.role)) {
			return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
		}

		const body = await request.json();
		const mobile = String(body.mobile ?? '').replace(/\D/g, '');
		const name = String(body.name ?? '').trim();

		if (!MOBILE_REGEX.test(mobile)) {
			return json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
		}
		if (!name) {
			return json({ error: 'نام مراجع لازم است' }, { status: 400 });
		}

		const pb = await getAdminPb();
		const email = `user_${mobile}@hoomban.com`;

		try {
			const existing = await pb.collection('users').getFirstListItem(`mobile = "${mobile}"`);
			if (existing.role && existing.role !== 'patient') {
				return json({ error: 'این شماره متعلق به کارمند است' }, { status: 400 });
			}
			await pb.collection('users').update(existing.id, {
				name,
				role: 'patient',
				mobile
			});
			return json({ id: existing.id, name, mobile });
		} catch {
			/* create */
		}

		try {
			const byEmail = await pb.collection('users').getFirstListItem(`email = "${email}"`);
			if (byEmail.role && byEmail.role !== 'patient') {
				return json({ error: 'این شماره متعلق به کارمند است' }, { status: 400 });
			}
			await pb.collection('users').update(byEmail.id, {
				name,
				role: 'patient',
				mobile
			});
			return json({ id: byEmail.id, name, mobile });
		} catch {
			/* create */
		}

		const password = generateSecurePassword();
		const created = await pb.collection('users').create({
			email,
			emailVisibility: true,
			password,
			passwordConfirm: password,
			name,
			role: 'patient',
			mobile,
			verified: true
		});

		return json({ id: created.id, name, mobile });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت مراجع';
		return json({ error: message }, { status: 500 });
	}
};
