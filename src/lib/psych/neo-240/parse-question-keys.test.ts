import { describe, expect, it } from 'vitest';
import {
	formatNeoQuestionKeys,
	parseNeoKeyCompact,
	parseNeoQuestionKeys
} from '$lib/psych/neo-240/parse-question-keys';

describe('parseNeoQuestionKeys', () => {
	it('parses CSV lines with reverse flag', () => {
		const { rows, errors } = parseNeoQuestionKeys('1,N1,معکوس\n2,E1,false');
		expect(errors).toHaveLength(0);
		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({ order: 1, facet_key: 'N1', domain_key: 'N', reverse_scored: true });
		expect(rows[1]).toMatchObject({ order: 2, facet_key: 'E1', domain_key: 'E', reverse_scored: false });
	});

	it('rejects invalid facet keys', () => {
		const { rows, errors } = parseNeoQuestionKeys('1,ZZ,true');
		expect(rows).toHaveLength(0);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('round-trips via formatNeoQuestionKeys', () => {
		const text = formatNeoQuestionKeys([
			{ order: 5, facet_key: 'C2', reverse_scored: true }
		]);
		const { rows, errors } = parseNeoQuestionKeys(text);
		expect(errors).toHaveLength(0);
		expect(rows[0]?.facet_key).toBe('C2');
	});
});

describe('parseNeoKeyCompact', () => {
	it('parses facet with + reverse suffix', () => {
		expect(parseNeoKeyCompact('N1+')).toMatchObject({
			facet_key: 'N1',
			domain_key: 'N',
			reverse_scored: true
		});
	});
});
