import type { NeoScoringConfig } from '$lib/psych/neo-240/scoring-config';
import type { NeoQuestion } from '$lib/psych/neo-240/types';
import type { GenericPsychQuestion } from '$lib/tests/services/psych-questions';

type SyncSuccess = { ok: true; questions: unknown[] };
type SyncError = { error: string };

async function postSync(body: unknown, token: string): Promise<SyncSuccess> {
	const res = await fetch('/api/psych/questions/sync', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(body)
	});
	const data = (await res.json()) as SyncSuccess | SyncError;
	if (!res.ok || 'error' in data) {
		throw new Error('error' in data ? data.error : 'خطا در ذخیره سوالات');
	}
	return data;
}

export async function syncNeoPsychQuestionsApi(
	token: string,
	testId: string,
	questions: NeoQuestion[],
	scoringConfig: NeoScoringConfig,
	likertLabels: string[]
): Promise<NeoQuestion[]> {
	const data = await postSync(
		{ mode: 'neo', testId, questions, scoringConfig, likertLabels },
		token
	);
	return data.questions as NeoQuestion[];
}

export async function syncGenericPsychQuestionsApi(
	token: string,
	testId: string,
	questions: GenericPsychQuestion[]
): Promise<GenericPsychQuestion[]> {
	const data = await postSync({ mode: 'generic', testId, questions }, token);
	return data.questions as GenericPsychQuestion[];
}
