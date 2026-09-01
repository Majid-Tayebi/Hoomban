import { env } from '$env/dynamic/private';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function getSmsirApiKey(): string {
	return String(env.SMSIR_API_KEY || '').trim();
}

export function getSmsirLineNumber(): number | null {
	const raw = String(env.SMSIR_LINE_NUMBER || '').trim();
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : null;
}

export function getSmsirOtpTemplateId(): number {
	const raw = String(env.SMSIR_TEMPLATE_OTP || '123456').trim();
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : 123456;
}

export function getSmsirVerifyParamName(): string {
	return String(env.SMSIR_VERIFY_PARAM || 'Code').trim() || 'Code';
}

export function isSmsirSandbox(): boolean {
	const raw = String(env.SMSIR_SANDBOX ?? 'true').trim().toLowerCase();
	return raw !== 'false' && raw !== '0' && raw !== 'no';
}

/** When true, SMS is only dispatched if app URLs point to localhost (safe for dev keys). */
export function isSmsirLocalOnly(): boolean {
	const raw = String(env.SMSIR_LOCAL_ONLY ?? 'true').trim().toLowerCase();
	return raw !== 'false' && raw !== '0' && raw !== 'no';
}

export function isSmsirConfigured(): boolean {
	return getSmsirApiKey().length > 0;
}

/** Bulk (appointment) texts need a dedicated line number from SMS.ir panel. */
export function isSmsirBulkConfigured(): boolean {
	return isSmsirConfigured() && getSmsirLineNumber() != null;
}

/** Dev/Sandbox: record appointment SMS without calling Bulk when line number is missing. */
export function shouldStubBulkSms(): boolean {
	if (!isSmsirConfigured()) return false;
	if (getSmsirLineNumber()) return false;
	return isSmsirSandbox() || (isSmsirLocalOnly() && isLocalHostEnvironment());
}

function hostFromUrl(raw: string): string | null {
	try {
		return new URL(raw).hostname.toLowerCase();
	} catch {
		return null;
	}
}

export function isLocalHostEnvironment(): boolean {
	const candidates = [env.PUBLIC_APP_URL, env.POCKETBASE_URL, env.ORIGIN].filter(Boolean);
	if (!candidates.length) return true;
	return candidates.some((url) => {
		const host = hostFromUrl(String(url));
		return host != null && LOCAL_HOSTS.has(host);
	});
}

export function isSmsDispatchAllowed(): boolean {
	if (!isSmsirConfigured()) return false;
	if (isSmsirLocalOnly() && !isLocalHostEnvironment()) return false;
	return true;
}

export function getSmsirApiBase(): string {
	return 'https://api.sms.ir/v1';
}
