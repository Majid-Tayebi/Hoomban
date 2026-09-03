/**
 * Escape a value for use inside a PocketBase filter string literal.
 * Shared across client/server to avoid divergent copies.
 */
export function escapeFilterValue(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Build `id = "a" || id = "b" …` for batch lookups (max ids clamped by caller). */
export function buildIdOrFilter(ids: string[]): string {
	const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
	if (!unique.length) return '';
	return unique.map((id) => `id = "${escapeFilterValue(id)}"`).join(' || ');
}
