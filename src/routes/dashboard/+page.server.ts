import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { loadDashboardData } from '$lib/dashboard';
import type { DashboardData } from '$lib/dashboard/types';

function reviveDashboardDates(data: DashboardData): DashboardData {
	return {
		...data,
		appointments: data.appointments.map((apt) => ({
			...apt,
			dateTime: new Date(apt.dateTime)
		}))
	};
}

/** Doctor home is the unified appointments view — no separate dashboard duplicate. */
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role === 'doctor') {
		throw redirect(303, '/dashboard/appointments');
	}

	const user = locals.user;
	if (!user) {
		throw redirect(303, '/auth');
	}

	const admin = await getAdminPb();
	const dashboard = reviveDashboardDates(
		await loadDashboardData(
			{
				id: user.id,
				role: user.role,
				name: user.name
			},
			admin
		)
	);

	return { dashboard };
};
