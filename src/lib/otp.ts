/** OTP codes are six digits — must match generateOtpCode() in auth-secrets. */
export const OTP_CODE_LENGTH = 6;

/** Client resend cooldown — keep in sync with OTP_RESEND_COOLDOWN_MS on server. */
export const OTP_RESEND_SECONDS = 120;

/** Login OTP validity window (server). */
export const OTP_EXPIRY_MS = 10 * 60 * 1000;

/** Western digits only — accepts Persian/Arabic numerals from mobile keyboards. */
export function normalizeOtpCode(raw: string): string {
	const persian = '۰۱۲۳۴۵۶۷۸۹';
	const arabic = '٠١٢٣٤٥٦٧٨٩';
	let out = '';
	for (const ch of raw.trim()) {
		const pi = persian.indexOf(ch);
		if (pi >= 0) {
			out += String(pi);
			continue;
		}
		const ai = arabic.indexOf(ch);
		if (ai >= 0) {
			out += String(ai);
			continue;
		}
		if (/\d/.test(ch)) out += ch;
	}
	return out;
}
