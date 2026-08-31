import { loadPublishedArticles } from '$lib/landing/public-data';

export async function load() {
	const articles = await loadPublishedArticles(50);
	return { articles };
}
