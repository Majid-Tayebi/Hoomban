import type { PageServerLoad } from './$types';
import { requireSecretaryDeskAccess } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireSecretaryDeskAccess(locals.user);
	return { patientId: params.id };
};
