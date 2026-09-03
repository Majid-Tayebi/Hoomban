import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import {
	clampNeoScore,
	isReversePattern,
	syncOptionLabels
} from '$lib/psych/neo-240/option-scores';
import type { NeoScoringConfig } from '$lib/psych/neo-240/scoring-config';
import type { NeoQuestion } from '$lib/psych/neo-240/types';
import type { GenericPsychQuestion } from '$lib/tests/services/psych-questions';
import { escapeFilterValue } from '$lib/pocketbase-filter';

const BATCH_CHUNK = 50;

async function deleteOrphans(pb: PocketBase, testId: string, keepIds: Set<string>) {
	const existing = await pb.collection('psych_questions').getFullList({
		filter: `test = "${escapeFilterValue(testId)}"`,
		fields: 'id',
		...PB_NO_AUTO_CANCEL
	});
	for (const old of existing) {
		if (!keepIds.has(old.id)) {
			await pb.collection('psych_questions').delete(old.id, PB_NO_AUTO_CANCEL);
		}
	}
}

async function sendBatchChunks(
	pb: PocketBase,
	ops: Array<(batch: ReturnType<PocketBase['createBatch']>) => void>
): Promise<void> {
	for (let i = 0; i < ops.length; i += BATCH_CHUNK) {
		const chunk = ops.slice(i, i + BATCH_CHUNK);
		const batch = pb.createBatch();
		for (const op of chunk) op(batch);
		await batch.send();
	}
}

export async function batchSyncGenericQuestions(
	pb: PocketBase,
	testId: string,
	questions: GenericPsychQuestion[]
): Promise<void> {
	const keepIds = new Set(
		questions.map((q) => q.id).filter((id): id is string => Boolean(id))
	);
	await deleteOrphans(pb, testId, keepIds);

	const ops: Array<(batch: ReturnType<PocketBase['createBatch']>) => void> = [];
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
			const id = q.id;
			ops.push((batch) => batch.collection('psych_questions').update(id, payload));
		} else {
			const index = i;
			ops.push((batch) => {
				batch.collection('psych_questions').create(payload);
				// PocketBase batch create responses are mapped by order — capture after send in fallback loop below.
				void index;
			});
		}
	}

	if (ops.length) await sendBatchChunks(pb, ops);

	// Batch create does not return IDs to client models — refresh IDs for new rows.
	for (let i = 0; i < questions.length; i++) {
		if (questions[i].id) continue;
		const created = await pb.collection('psych_questions').getFirstListItem(
			`test = "${escapeFilterValue(testId)}" && order = ${i + 1}`,
			PB_NO_AUTO_CANCEL
		);
		questions[i].id = created.id;
	}
}

export async function batchSyncNeoQuestions(
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

	const keepIds = new Set(
		questions.map((q) => q.id).filter((id): id is string => Boolean(id))
	);
	await deleteOrphans(pb, testId, keepIds);

	const ops: Array<(batch: ReturnType<PocketBase['createBatch']>) => void> = [];
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
			const id = q.id;
			ops.push((batch) => batch.collection('psych_questions').update(id, payload));
		} else {
			ops.push((batch) => batch.collection('psych_questions').create(payload));
		}
	}

	if (ops.length) await sendBatchChunks(pb, ops);

	for (const q of questions) {
		if (q.id) continue;
		const created = await pb.collection('psych_questions').getFirstListItem(
			`test = "${escapeFilterValue(testId)}" && order = ${q.order}`,
			PB_NO_AUTO_CANCEL
		);
		q.id = created.id;
	}
}
