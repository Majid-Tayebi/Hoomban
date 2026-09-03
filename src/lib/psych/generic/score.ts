export type GenericScoringRule = {
	min: number;
	max: number;
	label: string;
	interpretation: string;
};

export type GenericQuestionOption = {
	text: string;
	scores?: Record<string, number>;
};

export type GenericAnswerRecord = {
	question_id: string;
	question_text: string;
	selected_option: string;
	selected_index: number;
	scores?: Record<string, number>;
};

export function scoreGenericAnswers(
	entries: Array<{
		question_id: string;
		question_text: string;
		selected_option: GenericQuestionOption;
		selected_index: number;
	}>,
	scoringRules?: GenericScoringRule[] | null
): { scores: Record<string, number>; interpretation: string; answersJson: GenericAnswerRecord[] } {
	const scores: Record<string, number> = {};
	const answersJson: GenericAnswerRecord[] = [];

	for (const entry of entries) {
		const selected = entry.selected_option;
		answersJson.push({
			question_id: entry.question_id,
			question_text: entry.question_text,
			selected_option: selected.text,
			selected_index: entry.selected_index,
			scores: selected.scores
		});

		if (!selected.scores) continue;

		const points = Number(selected.scores.score ?? selected.scores.value ?? 0);
		scores.total = (scores.total || 0) + points;
		for (const [key, value] of Object.entries(selected.scores)) {
			if (key === 'score' || key === 'value') continue;
			scores[key] = (scores[key] || 0) + Number(value);
		}
	}

	const totalScore = Number(
		scores.total ?? Object.values(scores).reduce((sum, value) => sum + Number(value), 0)
	);
	const maxScore = entries.length * 3;
	let interpretation = '';
	const rules = scoringRules ?? [];

	if (rules.length) {
		const match = rules.find((rule) => totalScore >= rule.min && totalScore <= rule.max);
		interpretation = match
			? `${match.label}: ${match.interpretation || ''}`.trim()
			: `نمره کل: ${totalScore}`;
	} else if (totalScore <= maxScore * 0.33) {
		interpretation = 'نتیجه: سطح خفیف — وضعیت کلی خوب است.';
	} else if (totalScore <= maxScore * 0.66) {
		interpretation = 'نتیجه: سطح متوسط — مشورت با متخصص توصیه می‌شود.';
	} else {
		interpretation = 'نتیجه: سطح بالا — حتماً با روانشناس مشورت کنید.';
	}

	return { scores, interpretation, answersJson };
}
