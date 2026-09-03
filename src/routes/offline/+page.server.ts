import type { PageServerLoad } from './$types';
import { resolveLocale } from '$lib/i18n';

export const load: PageServerLoad = async ({ cookies }) => {
	return { locale: resolveLocale(cookies.get('locale')) };
};
