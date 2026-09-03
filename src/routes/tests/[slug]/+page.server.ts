import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { getCachedJson } from '$lib/server/cache';

type PublicTestMeta = {
	id: string;
	title: string;
	description?: string;
	test_type?: string;
	slug: string;
};

type GenericQuestion = {
	id: string;
	question_text: string;
	options: { text: string; scores?: Record<string, number> }[];
};

export const load: PageServerLoad = async ({ params, locals }) => {
	const slug = String(params.slug ?? '').trim();
	if (!slug) throw error(404, 'آزمون یافت نشد');

	const test = await getCachedJson<PublicTestMeta | null>(`public:test-meta:${slug}`, 300, async () => {
		const pb = getServerPb();
		try {
			const record = await pb.collection('psych_tests').getFirstListItem(
				`slug = "${slug.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" && is_active = true`,
				PB_NO_AUTO_CANCEL
			);
			return {
				id: record.id,
				title: String(record.title ?? ''),
				description: record.description ? String(record.description) : undefined,
				test_type: record.test_type ? String(record.test_type) : undefined,
				slug
			};
		} catch {
			return null;
		}
	});

	if (!test) throw error(404, 'آزمون یافت نشد');

	let questions: GenericQuestion[] = [];
	if (test.test_type !== 'neo_240' && locals.user) {
		const pb = getServerPb();
		const questionsResult = await pb.collection('psych_questions').getList(1, 100, {
			filter: `test = "${test.id}"`,
			sort: 'order',
			...PB_NO_AUTO_CANCEL
		});
		questions = questionsResult.items.map((q) => ({
			id: q.id,
			question_text: String(q.question_text),
			options:
				typeof q.options_json === 'string'
					? (JSON.parse(q.options_json) as GenericQuestion['options'])
					: (q.options_json as GenericQuestion['options'])
		}));
	}

	return { test, questions };
};
