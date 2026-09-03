/** Extract a user-facing message from unknown thrown values. */
export function getErrorMessage(err: unknown, fallback = 'خطای ناشناخته'): string {
	if (err instanceof Error && err.message.trim()) return err.message;
	if (typeof err === 'string' && err.trim()) return err;
	if (err && typeof err === 'object' && 'message' in err) {
		const message = String((err as { message?: unknown }).message ?? '').trim();
		if (message) return message;
	}
	return fallback;
}
