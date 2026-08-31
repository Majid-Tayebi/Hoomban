import { redirect } from '@sveltejs/kit';
import { canAccessPatientRecord } from '$lib/rbac';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user || !canAccessPatientRecord(locals.user.role)) {
		throw redirect(303, '/dashboard');
	}
	return { patientId: params.id };
};
