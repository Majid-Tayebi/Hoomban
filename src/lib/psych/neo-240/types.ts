import type { NeoDomainKey, NeoFacetKey } from './meta';
import type { NeoQuestionOption } from './option-scores';

/** NEO question row as used in editor/runner UI and PocketBase sync. */
export type NeoQuestion = {
	id?: string;
	order: number;
	question_text: string;
	domain_key: NeoDomainKey | string;
	facet_key: NeoFacetKey | string;
	options_json: NeoQuestionOption[];
	reverse_scored?: boolean;
};
