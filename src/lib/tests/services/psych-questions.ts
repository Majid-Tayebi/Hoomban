import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import {
	clampNeoScore,
	isReversePattern,
	syncOptionLabels,
	type NeoQuestionOption
} from '$lib/psych/neo-240/option-scores';
import type { NeoScoringConfig } from '$lib/psych/neo-240/scoring-config';
import type { NeoQuestion } from '$lib/psych/neo-240/types';
import { escapeFilterValue } from '$lib/pocketbase-filter';

export type GenericPsychQuestion = {
	id?: string;
	question_text: string;
	order: number;
	options_json: Array<{
		text: string;
		scores?: { score?: number; value?: number };
	}>;
};

/** Delete psych_questions orphans and upsert the provided list (generic tests). */
export async function syncGenericPsychQuestions(
	pb: PocketBase,
	testId: string,
	questions: GenericPsychQuestion[]
): Promise<void> {
	const existing = await pb.collection('psych_questions').getFullList({
		filter: `test = "${escapeFilterValue(testId)}"`,
		fields: 'id',
		...PB_NO_AUTO_CANCEL
	});
	const keepIds = new Set(questions.map((q) => q.id).filter(Boolean));
	for (const old of existing) {
		if (!keepIds.has(old.id)) {
			await pb.collection('psych_questions').delete(old.id, PB_NO_AUTO_CANCEL);
		}
	}

	for (let i = 0; i < questions.length; i++) {
		const q = questions[i];
		const payload = {
			test: testId,
			question_text: q.question_text.trim(),
			order: i + 1,
			options_json: q.options_json.map((opt) => {
				const score = Number(opt.scores?.score ?? opt.scores?.value ?? 0);
				return { text: String(opt.text || ''), scores: { score, value: score } };
			})
		};
		if (q.id) {
			await pb.collection('psych_questions').update(q.id, payload, PB_NO_AUTO_CANCEL);
		} else {
			const created = await pb.collection('psych_questions').create(payload, PB_NO_AUTO_CANCEL);
			questions[i].id = created.id;
		}
	}
}

/** Save NEO scoring config + sync all NEO questions for a test. */
export async function syncNeoPsychQuestions(
	pb: PocketBase,
	testId: string,
	questions: NeoQuestion[],
	scoringConfig: NeoScoringConfig,
	likertLabels: string[]
): Promise<void> {
	await pb.collection('psych_tests').update(
		testId,
		{ scoring_config: scoringConfig },
		PB_NO_AUTO_CANCEL
	);

	const existing = await pb.collection('psych_questions').getFullList({
		filter: `test = "${escapeFilterValue(testId)}"`,
		fields: 'id',
		...PB_NO_AUTO_CANCEL
	});
	const keepIds = new Set(questions.map((q) => q.id).filter(Boolean));
	for (const old of existing) {
		if (!keepIds.has(old.id)) {
			await pb.collection('psych_questions').delete(old.id, PB_NO_AUTO_CANCEL);
		}
	}

	for (const q of questions) {
		const options = syncOptionLabels(q.options_json, likertLabels).map((opt) => ({
			text: opt.text,
			scores: {
				value: clampNeoScore(opt.scores.value ?? opt.scores.score),
				score: clampNeoScore(opt.scores.value ?? opt.scores.score)
			}
		}));
		const payload = {
			test: testId,
			question_text: q.question_text.trim(),
			order: q.order,
			domain_key: q.domain_key,
			facet_key: q.facet_key,
			reverse_scored: isReversePattern(options),
			options_json: options
		};
		if (q.id) {
			await pb.collection('psych_questions').update(q.id, payload, PB_NO_AUTO_CANCEL);
		} else {
			const created = await pb.collection('psych_questions').create(payload, PB_NO_AUTO_CANCEL);
			q.id = created.id;
		}
	}
}
