import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/auth?redirect=${redirectTo}`);
	}

	return {
		user: locals.user
	};
};
