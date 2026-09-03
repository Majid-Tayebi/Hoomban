import { redirect, error } from '@sveltejs/kit';
import { loginRedirectUrl } from '$lib/auth-redirect';
import { getSessionToken } from '$lib/server/session';
import { resolveUserFromAuthToken } from '$lib/server/auth-token';
import { loadPsychResultForUser } from '$lib/server/psych/load-result';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, cookies }) => {
	if (!locals.user) {
		throw redirect(303, loginRedirectUrl(`/tests/result/${params.id}`));
	}

	const token = getSessionToken(cookies);
	const resolved = token ? await resolveUserFromAuthToken(token) : null;
	if (!resolved?.token) {
		throw redirect(303, loginRedirectUrl(`/tests/result/${params.id}`));
	}

	try {
		const payload = await loadPsychResultForUser(params.id, resolved.token);
		return { result: payload };
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(404, 'نتیجه یافت نشد');
	}
};