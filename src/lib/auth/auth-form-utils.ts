/** Presentational helpers for the auth page (no session side effects). */

export function normalizeAuthMobile(value: string) {
	const digits = value.replace(/\D/g, '');
	if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2);
	if (digits.startsWith('9') && digits.length === 10) return '0' + digits;
	return digits;
}

export function pbErrorMessage(err: unknown, fallback: string) {
	if (err instanceof Error) return err.message || fallback;
	const e = err as {
		message?: string;
		data?: { message?: string; data?: Record<string, { message?: string }> };
	};
	const fieldErrors = e?.data?.data;
	if (fieldErrors) {
		const first = Object.values(fieldErrors).find((f) => f?.message)?.message;
		if (first) return first;
	}
	return e?.data?.message || e?.message || fallback;
}
