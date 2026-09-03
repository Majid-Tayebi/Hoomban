/** Same-origin avatar URLs — avoid broken PocketBase host/token links in the browser. */
export function appAvatarUrl(
	userId: string,
	avatar: unknown,
	updated?: unknown
): string | null {
	if (!avatar || !userId) return null;
	const v = updated ? String(updated) : String(avatar);
	return `/api/users/${userId}/avatar?v=${encodeURIComponent(v)}`;
}
