import { error } from '@sveltejs/kit';
import { getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { escapeFilterValue } from '$lib/pocketbase-filter';

export type PsychResultPayload = {
	id: string;
	interpretation_text: string;
	scores_json: unknown;
	answers_json: unknown;
	created: string;
	test: { title: string };
	participant: {
		name: string;
		mobile: string;
		email: string;
	};
};

/** Load psych result using the user's PB token — ACL enforced by PocketBase. */
export async function loadPsychResultForUser(
	resultId: string,
	userToken: string
): Promise<PsychResultPayload> {
	const pb = getServerPb();
	pb.authStore.save(userToken, null as never);

	try {
		const resultData = await pb.collection('psych_results').getOne(resultId, {
			expand: 'test,user',
			...PB_NO_AUTO_CANCEL
		});

		const u = resultData.expand?.user as
			| { name?: string; mobile?: string; email?: string; username?: string }
			| undefined;
		const testExpand = resultData.expand?.test as { title?: string } | undefined;

		return {
			id: resultData.id,
			interpretation_text: String(resultData.interpretation_text || ''),
			scores_json: resultData.scores_json,
			answers_json: resultData.answers_json,
			created: String(resultData.created || ''),
			test: { title: String(testExpand?.title || 'نتیجه تست') },
			participant: {
				name: String(u?.name || u?.username || '—'),
				mobile: String(u?.mobile || ''),
				email: String(u?.email || u?.username || '')
			}
		};
	} catch {
		throw error(404, 'نتیجه یافت نشد یا دسترسی ندارید');
	}
}
