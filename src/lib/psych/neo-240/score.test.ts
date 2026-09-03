import { describe, expect, it } from 'vitest';
import { scoreNeo240, type NeoAnswerInput } from '$lib/psych/neo-240/score';
import { NEO_FACETS } from '$lib/psych/neo-240/meta';

function makeAnswers(count = 240): NeoAnswerInput[] {
	return Array.from({ length: count }, (_, i) => {
		const facet = NEO_FACETS[i % NEO_FACETS.length];
		return {
			order: i + 1,
			selected_index: 2,
			domain_key: facet.domain,
			facet_key: facet.key,
			score_points: 2,
			question_text: `Q${i + 1}`
		};
	});
}

describe('scoreNeo240', () => {
	it('returns neo_240 discriminator and all domain keys', () => {
		const scores = scoreNeo240(makeAnswers(30));
		expect(scores.test_type).toBe('neo_240');
		expect(Object.keys(scores.domains).sort()).toEqual(['A', 'C', 'E', 'N', 'O']);
		expect(Object.keys(scores.facets).length).toBe(30);
	});

	it('sums facet scores into domains', () => {
		const answers: NeoAnswerInput[] = [
			{
				order: 1,
				selected_index: 4,
				domain_key: 'N',
				facet_key: 'N1',
				score_points: 4,
				question_text: 'a'
			},
			{
				order: 2,
				selected_index: 0,
				domain_key: 'N',
				facet_key: 'N2',
				score_points: 0,
				question_text: 'b'
			}
		];
		const scores = scoreNeo240(answers);
		expect(scores.facets.N1).toBe(4);
		expect(scores.facets.N2).toBe(0);
		expect(scores.domains.N).toBe(4);
	});

	it('assigns bands from default thresholds', () => {
		const answers: NeoAnswerInput[] = [
			{
				order: 1,
				selected_index: 0,
				domain_key: 'E',
				facet_key: 'E1',
				score_points: 0,
				question_text: 'low'
			}
		];
		const scores = scoreNeo240(answers);
		expect(scores.facet_bands.E1).toBe('low');
		expect(scores.domain_bands.E).toBe('low');
	});
});
