import { NEO_FACETS, type NeoDomainKey, type NeoFacetKey } from './meta';

export type NeoQuestionKeyRow = {
	order: number;
	facet_key: NeoFacetKey;
	domain_key: NeoDomainKey;
	reverse_scored: boolean;
};

const FACET_SET = new Set(NEO_FACETS.map((f) => f.key));
const FACET_DOMAIN = Object.fromEntries(NEO_FACETS.map((f) => [f.key, f.domain])) as Record<
	NeoFacetKey,
	NeoDomainKey
>;

const TRUTHY = new Set(['1', 'true', 'yes', 'y', 'r', '+', 'معکوس', 'بله', 'م']);

function parseReverse(token: string | undefined): boolean {
	if (!token) return false;
	return TRUTHY.has(token.trim().toLowerCase()) || TRUTHY.has(token.trim());
}

function parseFacet(token: string): NeoFacetKey | null {
	const key = token.trim().toUpperCase() as NeoFacetKey;
	return FACET_SET.has(key) ? key : null;
}

/** Parse one line: `1,N1,true` | `1 N1 R` | `1\tN1\tمعکوس` | `N1+` (order from line number) */
function parseLine(line: string, fallbackOrder?: number): NeoQuestionKeyRow | null {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

	// JSON object per line
	if (trimmed.startsWith('{')) {
		try {
			const obj = JSON.parse(trimmed) as {
				order?: number;
				facet_key?: string;
				facet?: string;
				reverse_scored?: boolean;
				reverse?: boolean;
			};
			const facet = parseFacet(String(obj.facet_key ?? obj.facet ?? ''));
			if (!facet || !obj.order) return null;
			return {
				order: Number(obj.order),
				facet_key: facet,
				domain_key: FACET_DOMAIN[facet],
				reverse_scored: Boolean(obj.reverse_scored ?? obj.reverse)
			};
		} catch {
			return null;
		}
	}

	const parts = trimmed.split(/[,;\t|]+/).map((p) => p.trim()).filter(Boolean);
	if (!parts.length) return null;

	let order: number | null = null;
	let facet: NeoFacetKey | null = null;
	let reverse = false;

	if (parts.length === 1) {
		const compact = parts[0].toUpperCase();
		const m = compact.match(/^(\d+)[\s:.-]*([NEOAC]\d)([R+])?$/i);
		if (m) {
			order = Number(m[1]);
			facet = parseFacet(m[2]);
			reverse = Boolean(m[3]);
		} else {
			const m2 = compact.match(/^([NEOAC]\d)([R+])?$/i);
			if (m2 && fallbackOrder) {
				order = fallbackOrder;
				facet = parseFacet(m2[1]);
				reverse = Boolean(m2[2]);
			}
		}
	} else {
		const first = parts[0];
		if (/^\d+$/.test(first)) {
			order = Number(first);
			facet = parseFacet(parts[1] ?? '');
			reverse = parseReverse(parts[2]);
		} else {
			facet = parseFacet(first);
			reverse = parseReverse(parts[1]);
			if (fallbackOrder) order = fallbackOrder;
		}
	}

	if (!order || !facet) return null;
	return {
		order,
		facet_key: facet,
		domain_key: FACET_DOMAIN[facet],
		reverse_scored: reverse
	};
}

export type ParseNeoKeysResult = {
	rows: NeoQuestionKeyRow[];
	errors: string[];
};

/** Bulk paste: one key per line (240 lines) or CSV. */
export function parseNeoQuestionKeys(text: string): ParseNeoKeysResult {
	const lines = text.split(/\r?\n/);
	const rows: NeoQuestionKeyRow[] = [];
	const errors: string[] = [];
	const seen = new Set<number>();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.trim()) continue;
		const row = parseLine(line, i + 1);
		if (!row) {
			errors.push(`خط ${i + 1}: قابل خواندن نیست — «${line.slice(0, 40)}»`);
			continue;
		}
		if (seen.has(row.order)) {
			errors.push(`سوال ${row.order}: تکراری`);
			continue;
		}
		seen.add(row.order);
		rows.push(row);
	}

	return { rows, errors };
}

export function formatNeoQuestionKeys(
	questions: { order: number; facet_key: string; reverse_scored: boolean }[]
): string {
	return [...questions]
		.sort((a, b) => a.order - b.order)
		.map((q) => `${q.order},${q.facet_key},${q.reverse_scored ? 'معکوس' : 'مستقیم'}`)
		.join('\n');
}

export function formatNeoKeyCompact(facet_key: string, reverse_scored: boolean): string {
	return `${facet_key}${reverse_scored ? '+' : ''}`;
}

export function parseNeoKeyCompact(input: string): {
	facet_key: NeoFacetKey;
	domain_key: NeoDomainKey;
	reverse_scored: boolean;
} | null {
	const trimmed = input.trim().toUpperCase();
	const m = trimmed.match(/^([NEOAC]\d)(\+|R)?$/i);
	if (!m) return null;
	const facet = parseFacet(m[1]);
	if (!facet) return null;
	return {
		facet_key: facet,
		domain_key: FACET_DOMAIN[facet],
		reverse_scored: Boolean(m[2])
	};
}
