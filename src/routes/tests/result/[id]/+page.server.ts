import { redirect } from '@sveltejs/kit';
import { loginRedirectUrl } from '$lib/auth-redirect';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, loginRedirectUrl(`/tests/result/${params.id}`));
	}
	return {};
};
