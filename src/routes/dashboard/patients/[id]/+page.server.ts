import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requirePatientRecordAccess } from '$lib/server/dashboard-guards';

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePatientRecordAccess(locals.user);
	return { patientId: params.id };
};
