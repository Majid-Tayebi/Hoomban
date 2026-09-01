import { redirect } from '@sveltejs/kit';
import { loginRedirectUrl } from '$lib/auth-redirect';
import type { PageServerLoad } from './$types';

/** آزمون‌دهی فقط برای کاربران واردشده */
export const load: PageServerLoad = async ({ locals, params }) => {
	const slug = params.slug;
	if (!locals.user) {
		throw redirect(303, loginRedirectUrl(`/tests/${slug}`));
	}
	return {};
};
