import { loadLandingPublicData } from '$lib/landing/public-data';
import { LANDING_ARTICLES_FALLBACK } from '$lib/landing/articles-fallback';
import { getCachedJson, publicCacheHeaders } from '$lib/server/cache';
import { getServerPb } from '$lib/server/pocketbase';
import type { PageServerLoad } from './$types';

const LANDING_CACHE_TTL = 300;

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders(publicCacheHeaders(LANDING_CACHE_TTL));

	try {
		const pb = getServerPb();
		const data = await getCachedJson('public:landing-home', LANDING_CACHE_TTL, () =>
			loadLandingPublicData(pb)
		);
		return {
			connected: true,
			message: 'اتصال به PocketBase برقرار شد!',
			...data
		};
	} catch {
		return {
			connected: false,
			message:
				'اتصال به PocketBase برقرار نشد. لطفاً مطمئن شوید سرور PocketBase در حال اجرا است.',
			doctors: [],
			services: [],
			testimonials: [],
			articles: LANDING_ARTICLES_FALLBACK
		};
	}
};
