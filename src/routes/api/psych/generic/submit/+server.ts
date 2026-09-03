import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { submitGenericPsychResult } from '$lib/server/psych/generic-submit';

/**
 * POST /api/psych/generic/submit
 * Server-side scoring for non-NEO psych tests.
 * Requires auth (Bearer or session). Creates psych_results via admin PB.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token) {
		return json({ error: 'برای ثبت نتیجه وارد شوید' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const result = await submitGenericPsychResult(user.token, {
			testId: String(body.testId ?? ''),
			answers: (body.answers ?? {}) as Record<string, number>
		});
		return json({ id: result.id });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت نتیجه آزمون';
		return json({ error: message }, { status: 400 });
	}
};
