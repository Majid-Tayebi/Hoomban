import { pb } from '$lib/pocketbase';
import { loadLandingPublicData } from '$lib/landing/public-data';
import { LANDING_ARTICLES_FALLBACK } from '$lib/landing/articles-fallback';

export async function load() {
	try {
		await pb.health.check();
		const { doctors, services, testimonials, articles } = await loadLandingPublicData();
		return {
			connected: true,
			message: 'اتصال به PocketBase برقرار شد!',
			doctors,
			services,
			testimonials,
			articles
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
}
