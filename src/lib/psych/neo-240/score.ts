import type { NeoDomainKey, NeoFacetKey } from './meta';
import { NEO_DOMAIN_MAX, NEO_FACET_MAX, NEO_FACETS } from './meta';
import {
	DEFAULT_NEO_SCORING_CONFIG,
	type NeoScoringConfig,
	parseNeoScoringConfig
} from './scoring-config';

export type { NeoScoringConfig };
export { DEFAULT_NEO_SCORING_CONFIG, parseNeoScoringConfig };

export type NeoItemMeta = {
	order: number;
	question_text: string;
	domain_key: NeoDomainKey;
	facet_key: NeoFacetKey;
	reverse_scored: boolean;
};

export type NeoAnswerInput = {
	order: number;
	selected_index: number;
	domain_key: NeoDomainKey;
	facet_key: NeoFacetKey;
	/** Points contributed to facet/domain totals (from option key). */
	score_points: number;
	question_text: string;
};

export type NeoScoreBand = 'low' | 'medium' | 'high';

export type NeoScores = {
	test_type: 'neo_240';
	domains: Record<NeoDomainKey, number>;
	facets: Record<NeoFacetKey, number>;
	domain_bands: Record<NeoDomainKey, NeoScoreBand>;
	facet_bands: Record<NeoFacetKey, NeoScoreBand>;
};

function itemScore(answer: NeoAnswerInput): number {
	return Math.min(4, Math.max(0, answer.score_points));
}

function bandForFacet(score: number, config: NeoScoringConfig): NeoScoreBand {
	const { lowMax, mediumMax } = parseNeoScoringConfig(config).facetBands;
	if (score <= lowMax) return 'low';
	if (score <= mediumMax) return 'medium';
	return 'high';
}

function bandForDomain(score: number, config: NeoScoringConfig): NeoScoreBand {
	const { lowMax, mediumMax } = parseNeoScoringConfig(config).domainBands;
	if (score <= lowMax) return 'low';
	if (score <= mediumMax) return 'medium';
	return 'high';
}

export function scoreNeo240(
	answers: NeoAnswerInput[],
	config: NeoScoringConfig = DEFAULT_NEO_SCORING_CONFIG
): NeoScores {
	const facets = Object.fromEntries(NEO_FACETS.map((f) => [f.key, 0])) as Record<
		NeoFacetKey,
		number
	>;
	const domains = { N: 0, E: 0, O: 0, A: 0, C: 0 } satisfies Record<NeoDomainKey, number>;

	for (const answer of answers) {
		const points = itemScore(answer);
		facets[answer.facet_key] += points;
		domains[answer.domain_key] += points;
	}

	const facet_bands = Object.fromEntries(
		Object.entries(facets).map(([key, value]) => [key, bandForFacet(value, config)])
	) as Record<NeoFacetKey, NeoScoreBand>;

	const domain_bands = Object.fromEntries(
		Object.entries(domains).map(([key, value]) => [key, bandForDomain(value, config)])
	) as Record<NeoDomainKey, NeoScoreBand>;

	return {
		test_type: 'neo_240',
		domains,
		facets,
		domain_bands,
		facet_bands
	};
}

export function isNeoScores(value: unknown): value is NeoScores {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as NeoScores).test_type === 'neo_240' &&
		typeof (value as NeoScores).domains === 'object'
	);
}

export function formatNeoScoreSummary(scores: NeoScores): string {
	return Object.entries(scores.domains)
		.map(([key, value]) => `${key}: ${value}/${NEO_DOMAIN_MAX}`)
		.join(' | ');
}

export { NEO_FACET_MAX, NEO_DOMAIN_MAX };
