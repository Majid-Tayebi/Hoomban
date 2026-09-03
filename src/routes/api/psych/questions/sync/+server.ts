import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getErrorMessage } from '$lib/errors';
import { canEditPsychTests } from '$lib/rbac';
import { getServerPb } from '$lib/server/pocketbase';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import {
	batchSyncGenericQuestions,
	batchSyncNeoQuestions
} from '$lib/server/psych/sync-questions-batch';
import type { NeoQuestion } from '$lib/psych/neo-240/types';
import type { GenericPsychQuestion } from '$lib/tests/services/psych-questions';
import type { NeoScoringConfig } from '$lib/psych/neo-240/scoring-config';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token || !canEditPsychTests(user.role)) {
		return json({ error: 'فقط نقش نویسنده مجاز است' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const testId = String(body.testId ?? '').trim();
		const mode = String(body.mode ?? 'generic');
		if (!testId) return json({ error: 'شناسه آزمون نامعتبر است' }, { status: 400 });

		const pb = getServerPb();
		pb.authStore.save(user.token, null as never);

		if (mode === 'neo') {
			const questions = (body.questions ?? []) as NeoQuestion[];
			const scoringConfig = (body.scoringConfig ?? {}) as NeoScoringConfig;
			const likertLabels = Array.isArray(body.likertLabels)
				? body.likertLabels.map(String)
				: [];
			await batchSyncNeoQuestions(pb, testId, questions, scoringConfig, likertLabels);
			return json({ ok: true, questions });
		}

		const questions = (body.questions ?? []) as GenericPsychQuestion[];
		await batchSyncGenericQuestions(pb, testId, questions);
		return json({ ok: true, questions });
	} catch (err: unknown) {
		return json({ error: getErrorMessage(err, 'خطا در ذخیره سوالات') }, { status: 400 });
	}
};
