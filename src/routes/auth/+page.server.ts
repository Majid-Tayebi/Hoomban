import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isDevAuthEnabled } from '$lib/server/dev-auth';
import { DEV_LOGIN_PASSWORD, DEV_ROLE_ACCOUNTS } from '$lib/server/dev-credentials';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const target = url.searchParams.get('redirect') || '/dashboard';
		if (target.startsWith('/dashboard') || target === '/auth') {
			throw redirect(303, target.startsWith('/dashboard') ? target : '/dashboard');
		}
		throw redirect(303, '/dashboard');
	}

	const devDemoAuth = isDevAuthEnabled();

	return {
		devDemoAuth,
		devLoginPassword: devDemoAuth ? DEV_LOGIN_PASSWORD : null,
		devRoleAccounts: devDemoAuth ? [...DEV_ROLE_ACCOUNTS] : []
	};
};
