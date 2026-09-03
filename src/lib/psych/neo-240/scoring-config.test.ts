import { describe, expect, it } from 'vitest';
import {
	DEFAULT_NEO_SCORING_CONFIG,
	parseNeoScoringConfig
} from '$lib/psych/neo-240/scoring-config';

describe('parseNeoScoringConfig', () => {
	it('returns defaults for null input', () => {
		const config = parseNeoScoringConfig(null);
		expect(config.facetBands).toEqual(DEFAULT_NEO_SCORING_CONFIG.facetBands);
		expect(config.likert).toHaveLength(5);
	});

	it('merges partial overrides', () => {
		const config = parseNeoScoringConfig({
			facetBands: { lowMax: 8, mediumMax: 18 },
			likert: ['a', 'b', 'c', 'd', 'e']
		});
		expect(config.facetBands.lowMax).toBe(8);
		expect(config.facetBands.mediumMax).toBe(18);
		expect(config.domainBands).toEqual(DEFAULT_NEO_SCORING_CONFIG.domainBands);
		expect(config.likert).toEqual(['a', 'b', 'c', 'd', 'e']);
	});

	it('falls back when likert length is not 5', () => {
		const config = parseNeoScoringConfig({ likert: ['only', 'two'] });
		expect(config.likert).toEqual(DEFAULT_NEO_SCORING_CONFIG.likert);
	});
});
