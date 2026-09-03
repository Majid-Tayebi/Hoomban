import { describe, expect, it } from 'vitest';
import { buildIdOrFilter, escapeFilterValue } from './pocketbase-filter';

describe('pocketbase-filter', () => {
	it('escapes backslashes and quotes', () => {
		expect(escapeFilterValue('a"b\\c')).toBe('a\\"b\\\\c');
	});

	it('builds OR id filters', () => {
		expect(buildIdOrFilter(['x', 'y', 'x', ''])).toBe('id = "x" || id = "y"');
		expect(buildIdOrFilter([])).toBe('');
	});
});
