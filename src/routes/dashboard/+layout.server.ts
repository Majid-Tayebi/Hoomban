import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canAccessPath } from '$lib/rbac';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/auth?redirect=${redirectTo}`);
	}

	if (!canAccessPath(url.pathname, locals.user.role)) {
		throw redirect(303, '/dashboard');
	}

	return {
		user: locals.user
	};
};
