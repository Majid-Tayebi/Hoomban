import { NEO_LIKERT_OPTIONS } from './meta';
import { buildNeoQuestionOptions } from './option-scores';

/** Standard 5-point Likert options for PocketBase `options_json` (forward key). */
export function buildNeoLikertOptions(reverseScored = false) {
	const labels = NEO_LIKERT_OPTIONS.map((option) => option.text);
	return buildNeoQuestionOptions(
		labels,
		reverseScored ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]
	);
}
