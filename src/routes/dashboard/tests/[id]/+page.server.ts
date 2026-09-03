import type { PageServerLoad } from './$types';
import { requirePsychTestsDashboard } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePsychTestsDashboard(locals.user);
	return { testId: params.id };
};
