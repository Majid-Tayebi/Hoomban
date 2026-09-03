import { scoreGenericAnswers, type GenericQuestionOption } from '$lib/psych/generic/score';
import { getAdminPb, getServerPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { escapeFilterValue } from '$lib/pocketbase-filter';

export type GenericSubmitPayload = {
	testId: string;
	/** question index (0-based) → selected option index */
	answers: Record<string, number>;
};

export type GenericSubmitResult = {
	id: string;
};

function parseOptions(raw: unknown): GenericQuestionOption[] {
	if (Array.isArray(raw)) return raw as GenericQuestionOption[];
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw) as unknown;
			return Array.isArray(parsed) ? (parsed as GenericQuestionOption[]) : [];
		} catch {
			return [];
		}
	}
	return [];
}

async function resolveUserId(userToken: string): Promise<string> {
	const userPb = getServerPb();
	userPb.authStore.save(userToken, null as never);
	const userId = userPb.authStore.model?.id;
	if (!userId) throw new Error('کاربر احراز هویت نشده است');
	return String(userId);
}

export async function submitGenericPsychResult(
	userToken: string,
	payload: GenericSubmitPayload
): Promise<GenericSubmitResult> {
	const testId = String(payload.testId ?? '').trim();
	if (!testId) throw new Error('شناسه آزمون نامعتبر است');

	const adminPb = await getAdminPb();
	const userId = await resolveUserId(userToken);

	const test = await adminPb.collection('psych_tests').getOne(testId, PB_NO_AUTO_CANCEL);
	if (String(test.test_type) === 'neo_240') {
		throw new Error('برای آزمون نئو از مسیر اختصاصی استفاده کنید');
	}

	const questionsResult = await adminPb.collection('psych_questions').getList(1, 200, {
		filter: `test = "${escapeFilterValue(testId)}"`,
		sort: 'order',
		...PB_NO_AUTO_CANCEL
	});

	const questions = questionsResult.items;
	if (questions.length === 0) throw new Error('سوالی برای این آزمون یافت نشد');

	const rawAnswers = payload.answers ?? {};
	const entries: Array<{
		question_id: string;
		question_text: string;
		selected_option: GenericQuestionOption;
		selected_index: number;
	}> = [];

	for (let index = 0; index < questions.length; index++) {
		const question = questions[index];
		const selectedIndex = rawAnswers[String(index)] ?? rawAnswers[index as unknown as string];
		if (selectedIndex === undefined || selectedIndex === null) {
			throw new Error(`به سوال ${index + 1} پاسخ داده نشده است`);
		}

		const optionIndex = Number(selectedIndex);
		if (!Number.isInteger(optionIndex) || optionIndex < 0) {
			throw new Error(`پاسخ سوال ${index + 1} نامعتبر است`);
		}

		const options = parseOptions(question.options_json);
		if (optionIndex >= options.length) {
			throw new Error(`گزینه انتخاب‌شده برای سوال ${index + 1} نامعتبر است`);
		}

		entries.push({
			question_id: String(question.id),
			question_text: String(question.question_text),
			selected_option: options[optionIndex],
			selected_index: optionIndex
		});
	}

	const scoringRules = Array.isArray(test.scoring_rules)
		? (test.scoring_rules as {
				min: number;
				max: number;
				label: string;
				interpretation: string;
			}[])
		: null;

	const { scores, interpretation, answersJson } = scoreGenericAnswers(entries, scoringRules);

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
