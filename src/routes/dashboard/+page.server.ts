import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Doctor home is the unified appointments view — no separate dashboard duplicate. */
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role === 'doctor') {
		throw redirect(303, '/dashboard/appointments');
	}
	return {};
};
