import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { submitNeo240Result } from '$lib/server/psych/neo-240-submit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token) {
		return json({ error: 'برای ثبت نتیجه وارد شوید' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const result = await submitNeo240Result(user.token, {
			testId: String(body.testId ?? ''),
			answers: (body.answers ?? {}) as Record<string, number>
		});
		return json({ id: result.id });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در ثبت نتیجه آزمون';
		return json({ error: message }, { status: 400 });
	}
};
