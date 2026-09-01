/** Parse PocketBase JSON fields that may arrive as string or already-parsed object. */
export function parsePsychJsonField<T>(value: unknown): T {
	if (value == null) return {} as T;
	if (typeof value === 'string') {
		try {
			return JSON.parse(value) as T;
		} catch {
			return {} as T;
		}
	}
	return value as T;
}
