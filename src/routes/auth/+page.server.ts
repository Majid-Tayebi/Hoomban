import { redirect } from '@sveltejs/kit';
import { sanitizeAuthRedirect } from '$lib/auth-redirect';
import type { PageServerLoad } from './$types';
import { isDevAuthEnabled } from '$lib/server/dev-auth';
import { DEV_LOGIN_PASSWORD, DEV_ROLE_ACCOUNTS } from '$lib/server/dev-credentials';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const target = sanitizeAuthRedirect(url.searchParams.get('redirect'));
		throw redirect(303, target);
	}

	const devDemoAuth = isDevAuthEnabled();

	return {
		devDemoAuth,
		devLoginPassword: devDemoAuth ? DEV_LOGIN_PASSWORD : null,
		devRoleAccounts: devDemoAuth ? [...DEV_ROLE_ACCOUNTS] : []
	};
};
