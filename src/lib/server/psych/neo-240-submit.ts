import { getAdminPb, getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { buildNeoInterpretation } from '$lib/psych/neo-240/interpret';
import { scoreNeo240, type NeoAnswerInput } from '$lib/psych/neo-240/score';
import {
	likertOptionsFromConfig,
	parseNeoScoringConfig
} from '$lib/psych/neo-240/scoring-config';
import {
	optionScoreAt,
	parseQuestionOptions
} from '$lib/psych/neo-240/option-scores';
import type { NeoDomainKey, NeoFacetKey } from '$lib/psych/neo-240/meta';
import { escapeFilterValue } from '$lib/pocketbase-filter';

export type Neo240SubmitPayload = {
	testId: string;
	/** question order → selected likert index (0–4) */
	answers: Record<string, number>;
};

export type Neo240SubmitResult = {
	id: string;
};

export async function submitNeo240Result(
	userToken: string,
	payload: Neo240SubmitPayload
): Promise<Neo240SubmitResult> {
	const testId = String(payload.testId ?? '').trim();
	if (!testId) throw new Error('شناسه آزمون نامعتبر است');

	const rawAnswers = payload.answers ?? {};
	const adminPb = await getAdminPb();

	const test = await adminPb.collection('psych_tests').getOne(testId, PB_NO_AUTO_CANCEL);
	if (String(test.test_type) !== 'neo_240') {
		throw new Error('این آزمون از نوع نئو ۲۴۰ نیست');
	}

	const scoringConfig = parseNeoScoringConfig(test.scoring_config);
	const likertOptions = likertOptionsFromConfig(scoringConfig);

	const questionsResult = await adminPb.collection('psych_questions').getList(1, 250, {
		filter: `test = "${escapeFilterValue(testId)}"`,
		sort: 'order',
		...PB_NO_AUTO_CANCEL
	});

	const questions = questionsResult.items;
	if (questions.length === 0) throw new Error('سوالی برای این آزمون یافت نشد');

	const answerInputs: NeoAnswerInput[] = [];
	const answersJson: unknown[] = [];

	for (const q of questions) {
		const order = Number(q.order);
		if (!Number.isFinite(order)) continue;

		const selectedIndex = rawAnswers[String(order)] ?? rawAnswers[order as unknown as string];
		if (selectedIndex === undefined || selectedIndex === null) {
			throw new Error(`به سوال ${order} پاسخ داده نشده است`);
		}

		const idx = Number(selectedIndex);
		if (!Number.isInteger(idx) || idx < 0 || idx > 4) {
			throw new Error(`پاسخ سوال ${order} نامعتبر است`);
		}

		const reverseScored = Boolean(q.reverse_scored);
		const options = parseQuestionOptions(q.options_json, scoringConfig.likert, reverseScored);
		const selected = likertOptions[idx] ?? likertOptions[0];
		const scorePoints = optionScoreAt(options, idx);
		const domainKey = String(q.domain_key) as NeoDomainKey;
		const facetKey = String(q.facet_key) as NeoFacetKey;

		answerInputs.push({
			order,
			selected_index: idx,
			domain_key: domainKey,
			facet_key: facetKey,
			score_points: scorePoints,
			question_text: String(q.question_text)
		});

		answersJson.push({
			question_id: q.id,
			order,
			question_text: String(q.question_text),
			facet_key: facetKey,
			domain_key: domainKey,
			selected_option: selected.text,
			selected_index: idx,
			score_points: scorePoints
		});
	}

	if (answerInputs.length !== questions.length) {
		throw new Error('تعداد پاسخ‌ها با تعداد سوالات مطابقت ندارد');
	}

	const scores = scoreNeo240(answerInputs, scoringConfig);
	const interpretation = buildNeoInterpretation(scores);

	const userId = await resolveUserId(userToken);

	const result = await adminPb.collection('psych_results').create(
		{
			user: userId,
			test: testId,
			answers_json: answersJson,
			scores_json: scores,
			interpretation_text: interpretation
		},
		PB_NO_AUTO_CANCEL
	);

	return { id: result.id };
}

async function resolveUserId(userToken: string): Promise<string> {
	const userPb = getServerPb();
	userPb.authStore.save(userToken, null as never);
	const userId = userPb.authStore.model?.id;
	if (!userId) throw new Error('کاربر احراز هویت نشده است');
	return String(userId);
}
