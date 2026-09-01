import type { PageServerLoad } from './$types';
import { getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export const load: PageServerLoad = async () => {
	const pb = getServerPb();
	try {
		const result = await pb.collection('psych_tests').getList(1, 50, {
			filter: 'is_active = true',
			sort: '-id',
			...PB_NO_AUTO_CANCEL
		});
		return {
			tests: result.items.map((item) => ({
				id: item.id,
				title: String(item.title ?? ''),
				description: item.description ? String(item.description) : undefined,
				category: String(item.category ?? ''),
				slug: String(item.slug ?? ''),
				test_type: item.test_type ? String(item.test_type) : undefined
			})),
			loadError: null as string | null
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بارگذاری تست‌ها';
		console.error('[tests] load failed:', err);
		return { tests: [], loadError: message };
	}
};
