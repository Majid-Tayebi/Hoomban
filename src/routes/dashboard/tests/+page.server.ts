import type { PageServerLoad } from './$types';
import { requirePsychTestsDashboard } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals }) => {
	requirePsychTestsDashboard(locals.user);
	return {};
};
