import { NEO_LIKERT_OPTIONS } from './meta';

/** Stored on psych_tests.scoring_config — editable by writer role. */
export type NeoScoringConfig = {
	version?: number;
	likert?: string[];
	facetBands?: { lowMax: number; mediumMax: number };
	domainBands?: { lowMax: number; mediumMax: number };
};

export const DEFAULT_NEO_SCORING_CONFIG: Required<NeoScoringConfig> = {
	version: 2,
	likert: NEO_LIKERT_OPTIONS.map((o) => o.text),
	facetBands: { lowMax: 9, mediumMax: 20 },
	domainBands: { lowMax: 95, mediumMax: 127 }
};

export function parseNeoScoringConfig(raw: unknown): Required<NeoScoringConfig> {
	if (!raw || typeof raw !== 'object') return { ...DEFAULT_NEO_SCORING_CONFIG };
	const obj = raw as NeoScoringConfig;
	const facet = obj.facetBands ?? DEFAULT_NEO_SCORING_CONFIG.facetBands;
	const domain = obj.domainBands ?? DEFAULT_NEO_SCORING_CONFIG.domainBands;
	const likert =
		Array.isArray(obj.likert) && obj.likert.length === 5
			? obj.likert.map(String)
			: [...DEFAULT_NEO_SCORING_CONFIG.likert];
	return {
		version: Number(obj.version) || DEFAULT_NEO_SCORING_CONFIG.version,
		likert,
		facetBands: {
			lowMax: Number(facet.lowMax) || DEFAULT_NEO_SCORING_CONFIG.facetBands.lowMax,
			mediumMax: Number(facet.mediumMax) || DEFAULT_NEO_SCORING_CONFIG.facetBands.mediumMax
		},
		domainBands: {
			lowMax: Number(domain.lowMax) || DEFAULT_NEO_SCORING_CONFIG.domainBands.lowMax,
			mediumMax: Number(domain.mediumMax) || DEFAULT_NEO_SCORING_CONFIG.domainBands.mediumMax
		}
	};
}

export function likertOptionsFromConfig(config: NeoScoringConfig) {
	const labels = parseNeoScoringConfig(config).likert;
	return labels.map((text, value) => ({ text, value }));
}
