import { NEO_LIKERT_OPTIONS } from './meta';

export type NeoQuestionOption = {
	text: string;
	scores: { value: number; score?: number };
};

/** Standard forward key: کاملاً مخالفم=0 … کاملاً موافقم=4 */
export const NEO_FORWARD_SCORES = [0, 1, 2, 3, 4] as const;

/** Reverse key: کاملاً مخالفم=4 … کاملاً موافقم=0 */
export const NEO_REVERSE_SCORES = [4, 3, 2, 1, 0] as const;

export function clampNeoScore(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.min(4, Math.max(0, Math.round(n)));
}

export function defaultLikertLabels(): string[] {
	return NEO_LIKERT_OPTIONS.map((o) => o.text);
}

export function buildNeoQuestionOptions(
	likertLabels: string[],
	scoreValues: readonly number[] = NEO_FORWARD_SCORES
): NeoQuestionOption[] {
	const labels =
		likertLabels.length === 5 ? likertLabels : defaultLikertLabels();
	return labels.map((text, i) => {
		const value = clampNeoScore(scoreValues[i] ?? i);
		return { text, scores: { value, score: value } };
	});
}

export function parseQuestionOptions(
	raw: unknown,
	likertLabels: string[],
	reverseScored = false
): NeoQuestionOption[] {
	const labels =
		likertLabels.length === 5 ? likertLabels : defaultLikertLabels();

	if (Array.isArray(raw) && raw.length >= 5) {
		const parsed = raw.slice(0, 5).map((entry, i) => {
			const opt = entry as { text?: string; scores?: Record<string, unknown> };
			const value = clampNeoScore(
				opt.scores?.value ?? opt.scores?.score ?? (reverseScored ? NEO_REVERSE_SCORES[i] : i)
			);
			return {
				text: String(opt.text || labels[i] || ''),
				scores: { value, score: value }
			};
		});

		const isUniformForward = parsed.every((opt, i) => optionScoreAt(parsed, i) === i);
		if (reverseScored && isUniformForward) {
			return applyScorePattern(parsed, NEO_REVERSE_SCORES);
		}
		return parsed;
	}

	return buildNeoQuestionOptions(
		labels,
		reverseScored ? NEO_REVERSE_SCORES : NEO_FORWARD_SCORES
	);
}

export function optionScoreAt(options: NeoQuestionOption[], selectedIndex: number): number {
	const idx = Math.min(4, Math.max(0, selectedIndex));
	const opt = options[idx];
	if (!opt) return idx;
	return clampNeoScore(opt.scores.value ?? opt.scores.score ?? idx);
}

export function scoresMatchPattern(
	options: NeoQuestionOption[],
	pattern: readonly number[]
): boolean {
	if (options.length !== 5) return false;
	return options.every((opt, i) => optionScoreAt(options, i) === pattern[i]);
}

export function isReversePattern(options: NeoQuestionOption[]): boolean {
	return scoresMatchPattern(options, NEO_REVERSE_SCORES);
}

export function applyScorePattern(
	options: NeoQuestionOption[],
	pattern: readonly number[]
): NeoQuestionOption[] {
	return options.map((opt, i) => {
		const value = clampNeoScore(pattern[i] ?? 0);
		return { ...opt, scores: { value, score: value } };
	});
}

export function syncOptionLabels(
	options: NeoQuestionOption[],
	likertLabels: string[]
): NeoQuestionOption[] {
	if (likertLabels.length !== 5) return options;
	return options.map((opt, i) => ({ ...opt, text: likertLabels[i] ?? opt.text }));
}
