import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals.user);
	return {};
};
