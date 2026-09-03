import type { PageServerLoad } from './$types';
import { getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { getCachedJson, publicCacheHeaders } from '$lib/server/cache';

type PublicTest = {
	id: string;
	title: string;
	description?: string;
	category: string;
	slug: string;
	test_type?: string;
};

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders(publicCacheHeaders(300));

	try {
		const tests = await getCachedJson<PublicTest[]>('public:psych-tests', 300, async () => {
			const pb = getServerPb();
			const result = await pb.collection('psych_tests').getList(1, 50, {
				filter: 'is_active = true',
				sort: '-id',
				...PB_NO_AUTO_CANCEL
			});
			return result.items.map((item) => ({
				id: item.id,
				title: String(item.title ?? ''),
				description: item.description ? String(item.description) : undefined,
				category: String(item.category ?? ''),
				slug: String(item.slug ?? ''),
				test_type: item.test_type ? String(item.test_type) : undefined
			}));
		});

		return { tests, loadError: null as string | null };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بارگذاری تست‌ها';
		console.error('[tests] load failed:', err);
		return { tests: [], loadError: message };
	}
};
