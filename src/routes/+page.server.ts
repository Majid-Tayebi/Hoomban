import { pb } from '$lib/pocketbase';
import { loadLandingPublicData } from '$lib/landing/public-data';

export async function load() {
	try {
		await pb.health.check();
		const { doctors, services, testimonials } = await loadLandingPublicData();
		return {
			connected: true,
			message: 'اتصال به PocketBase برقرار شد!',
			doctors,
			services,
			testimonials
		};
	} catch {
		return {
			connected: false,
			message:
				'اتصال به PocketBase برقرار نشد. لطفاً مطمئن شوید سرور PocketBase در حال اجرا است.',
			doctors: [],
			services: [],
			testimonials: []
		};
	}
}
