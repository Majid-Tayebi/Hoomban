import { loadPublishedArticles } from '$lib/landing/public-data';
import { getCachedJson, publicCacheHeaders } from '$lib/server/cache';
import type { PageServerLoad } from './$types';

const ARTICLES_CACHE_TTL = 180;

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders(publicCacheHeaders(ARTICLES_CACHE_TTL));
	const articles = await getCachedJson('public:articles-list', ARTICLES_CACHE_TTL, () =>
		loadPublishedArticles(50)
	);
	return { articles };
};
