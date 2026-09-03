import type { LayoutServerLoad } from './$types';
import { resolveLocale, type Locale } from '$lib/i18n';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const locale = resolveLocale(cookies.get('locale')) satisfies Locale;
	return { locale };
};
