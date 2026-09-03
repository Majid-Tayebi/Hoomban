import type { PageServerLoad } from './$types';
import { requirePatientRecordAccess } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals }) => {
	requirePatientRecordAccess(locals.user);
	return {};
};
