import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getServerPb } from '$lib/server/pocketbase';
import {
	updateProfileAddress,
	updateProfileDetails
} from '$lib/server/profile/update-profile';
import { mapProfileRecord } from '$lib/profile/services/profile-mappers';

/**
 * PATCH /api/profile
 * Body: { section: 'details' | 'address', ...fields }
 * Never accepts role / verified / emailVisibility.
 */
export const PATCH: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const section = String(body.section ?? '');
		const pb = getServerPb();

		if (section === 'details') {
			const firstName = String(body.firstName ?? '').trim();
			const lastName = String(body.lastName ?? '').trim();
			const name =
				body.name != null
					? String(body.name)
					: `${firstName} ${lastName}`.trim();

			const record = await updateProfileDetails(pb, user.token, user.id, {
				name,
				username: body.username != null ? String(body.username) : undefined,
				birth_date: body.birthDate != null ? String(body.birthDate) : undefined
			});
			return json({ record: mapProfileRecord(record as never) });
		}

		if (section === 'address') {
			const record = await updateProfileAddress(pb, user.token, user.id, {
				province: body.province != null ? String(body.province) : undefined,
				city: body.city != null ? String(body.city) : undefined,
				home_address: body.homeAddress != null ? String(body.homeAddress) : undefined,
				landline: body.landline != null ? String(body.landline) : undefined
			});
			return json({ record: mapProfileRecord(record as never) });
		}

		return json({ error: 'بخش نامعتبر است' }, { status: 400 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ذخیره پروفایل ناموفق بود';
		return json({ error: message }, { status: 400 });
	}
};
