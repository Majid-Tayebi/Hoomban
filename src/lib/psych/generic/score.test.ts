import { describe, expect, it } from 'vitest';
import { scoreGenericAnswers } from '$lib/psych/generic/score';

describe('scoreGenericAnswers', () => {
	it('sums option scores and applies scoring rules', () => {
		const result = scoreGenericAnswers(
			[
				{
					question_id: 'q1',
					question_text: 'سوال ۱',
					selected_index: 0,
					selected_option: { text: 'بله', scores: { score: 2, anxiety: 2 } }
				},
				{
					question_id: 'q2',
					question_text: 'سوال ۲',
					selected_index: 1,
					selected_option: { text: 'خیر', scores: { score: 1, anxiety: 1 } }
				}
			],
			[{ min: 0, max: 5, label: 'خفیف', interpretation: 'وضعیت خوب' }]
		);

		expect(result.scores.total).toBe(3);
		expect(result.scores.anxiety).toBe(3);
		expect(result.interpretation).toContain('خفیف');
		expect(result.answersJson).toHaveLength(2);
	});

	it('uses default bands when scoring rules are missing', () => {
		const result = scoreGenericAnswers(
			[
				{
					question_id: 'q1',
					question_text: 'سوال ۱',
					selected_index: 0,
					selected_option: { text: 'زیاد', scores: { score: 3 } }
				}
			],
			null
		);

		expect(result.interpretation).toContain('سطح بالا');
	});
});
